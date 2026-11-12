import { appClient } from "@/integrations/manus/client";

const MANUS_URL = "/api";

async function invokeGoogleFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await appClient.functions.invoke<T>(name, { body });
  if (error) throw new Error(error.message || `${name} failed`);
  return data as T;
}

function geocodeAddress(address: string) {
  return invokeGoogleFunction<{ results: unknown[]; status: string }>("google-geocode", { address });
}

function searchGooglePlaces(query: string, maxResultCount = 10) {
  return invokeGoogleFunction<{ places?: unknown[] }>("google-places", { query, maxResultCount });
}

function computeGoogleRoute(origin: Record<string, unknown>, destination: Record<string, unknown>, travelMode = "DRIVE") {
  return invokeGoogleFunction<{ routes?: unknown[] }>("google-routes", { origin, destination, travelMode });
}

function searchYouTube(query: string, maxResults = 10) {
  return invokeGoogleFunction<{ items?: unknown[] }>("youtube-search", { query, maxResults });
}

export interface ShippingRate {
  provider: string;
  service: string;
  price: number;
  estimatedDays: string;
  description: string;
}

export interface PudoLocker {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  availableSlots: number;
}


// Get shipping rates
export async function getShippingRates(
  originPostalCode: string,
  destinationPostalCode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number },
  deliveryAddress?: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  }
): Promise<ShippingRate[]> {
  try {
    const response = await fetch(`${MANUS_URL}/functions/shipping-rates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originPostalCode,
        destinationPostalCode,
        weight,
        dimensions,
        // Full structured address so Ship Logic can geocode the delivery and
        // return live Courier Guy door-to-door quotes (postal code alone fails).
        ...(deliveryAddress && deliveryAddress.address ? { deliveryAddress } : {}),
        provider: "all",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shipping rates");
    }

    const payload = await response.json();
    return payload.data?.rates || payload.rates || [];
  } catch (error) {
    console.error("Shipping rates error:", error);
    return [];
  }
}

// Get PUDO locker locations
export async function getPudoLockers(postalCode: string): Promise<PudoLocker[]> {
  try {
    const response = await fetch(
      `${MANUS_URL}/functions/shipping-rates?action=lockers&postalCode=${postalCode}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch PUDO lockers");
    }

    const data = await response.json();
    return data.lockers || [];
  } catch (error) {
    console.error("PUDO lockers error:", error);
    return [];
  }
}


// PayFast payment response type

export interface PayPalPaymentResult {
  success: boolean;
  redirectUrl?: string;
  orderId?: string;
  error?: string;
}

export interface PayFastPaymentResult {
  success: boolean;
  actionUrl?: string;
  formFields?: Record<string, string>;
  paymentId?: string;
  error?: string;
}

// Initiate PayFast payment - returns form data for POST submission
export async function initiatePayFastPayment(
  orderId: string,
  amount: number,
  itemName: string,
  customerEmail: string,
  customerName: string,
  returnUrl: string,
  cancelUrl: string,
  accessToken?: string
): Promise<PayFastPaymentResult> {
  try {
    const { data, error } = await appClient.functions.invoke("payfast-payment", {
      body: { orderId, amount, itemName, customerEmail, customerName, returnUrl, cancelUrl, accessToken },
    });
    if (error) throw new Error(error.message || "Payment initiation failed");
    return data;
  } catch (error: any) {
    console.error("PayFast payment error:", error);
    return { success: false, error: error.message };
  }
}


// Initiate Yoco payment
export async function initiateYocoPayment(
  orderId: string,
  amount: number,
  currency: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  accessToken?: string
): Promise<{ success: boolean; redirectUrl?: string; checkoutId?: string; error?: string }> {
  try {
    const { data, error } = await appClient.functions.invoke("yoco-payment", {
      body: { orderId, amount, currency, successUrl, cancelUrl, customerEmail, accessToken },
    });
    if (error) throw new Error(error.message || "Payment initiation failed");
    return data;
  } catch (error: any) {
    console.error("Yoco payment error:", error);
    return { success: false, error: error.message };
  }
}

export async function initiatePayPalPayment(
  orderId: string,
  amount: number,
  currency: string,
  returnUrl: string,
  cancelUrl: string,
  customerEmail?: string,
): Promise<PayPalPaymentResult> {
  try {
    const { data, error } = await appClient.functions.invoke<PayPalPaymentResult>("paypal-payment", {
      body: { orderId, amount, currency, returnUrl, cancelUrl, customerEmail },
    });
    if (error) throw new Error(error.message || "Payment initiation failed");
    return data || { success: false, error: "Payment provider returned no result" };
  } catch (error: any) {
    console.error("PayPal payment error:", error);
    return { success: false, error: error.message };
  }
}

export async function capturePayPalPayment(paypalOrderId: string, orderNumber: string): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    const { data, error } = await appClient.functions.invoke<{ success: boolean; status?: string; error?: string }>("paypal-capture", {
      body: { paypalOrderId, orderNumber },
    });
    if (error) throw new Error(error.message || "PayPal capture failed");
    return data || { success: false, error: "PayPal capture returned no result" };
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    return { success: false, error: error.message };
  }
}

// Create order in database
export async function createOrder(
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    includeRooting?: boolean;
  }>,
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  },
  shippingMethod: string,
  shippingCost: number,
  rootingCost: number = 0,
  customerId?: string,
  promoCode?: string,
  promoDiscountZar: number = 0
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    // Route through secure edge function that recomputes prices server-side
    // to prevent client-side price tampering.
    const { data, error } = await appClient.functions.invoke("create-order", {
      body: {
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          includeRooting: i.includeRooting,
        })),
        shippingAddress,
        shippingMethod,
        shippingCost,
        rootingCost,
        promoCode,
      },
    });

    if (error) throw new Error(error.message || "Order creation failed");
    if (!data?.success) throw new Error(data?.error || "Order creation failed");

    return { success: true, orderId: data.orderId, orderNumber: data.orderNumber };
  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, error: error.message };
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  orderId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${MANUS_URL}/functions/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "order_confirmation",
        orderId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send confirmation email");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}

// Send rooting ready notification email
export async function sendRootingReadyEmail(
  orderId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${MANUS_URL}/functions/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "rooting_ready",
        orderId,
        email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send rooting ready email");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Rooting ready email error:", error);
    return { success: false, error: error.message };
  }
}
