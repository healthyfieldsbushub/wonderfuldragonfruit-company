import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initiatePayFastPayment, initiateYocoPayment } from "@/lib/api";
import { appClient } from "@/integrations/manus/client";

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

interface DonationModalProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function DonationModal({ trigger, className }: DonationModalProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  // PayFast temporarily deactivated - using Yoco only
  const [paymentMethod, setPaymentMethod] = useState<"payfast" | "yoco">("yoco");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleDonate = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      toast.error("Minimum donation is R10");
      return;
    }
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Create the donation record through the secure server function
      // (anonymous clients can no longer write to orders directly).
      const { data: donationData, error: donationError } = await appClient.functions.invoke<{
        success?: boolean;
        orderId?: string;
        orderNumber?: string;
      }>("donation-create", {
        body: { amount: effectiveAmount, email, name: name || "" },
      });

      if (donationError || !donationData?.success) {
        console.error("Failed to create donation record:", donationError);
        toast.error("Could not start the donation. Please try again.");
        return;
      }

      const donationId = donationData.orderId as string;
      const donationOrderNumber = donationData.orderNumber as string;

      const returnUrl = `${window.location.origin}/order-success?order=${donationOrderNumber}&type=donation`;
      const cancelUrl = `${window.location.origin}`;

      let paymentResult;
      if (paymentMethod === "payfast") {
        paymentResult = await initiatePayFastPayment(
          donationId,
          effectiveAmount,
          `DFSA Donation - Thank you!`,
          email,
          name || "Donor",
          returnUrl,
          cancelUrl
        );
      } else {
        paymentResult = await initiateYocoPayment(
          donationId,
          effectiveAmount,
          "ZAR",
          returnUrl,
          cancelUrl,
          email
        );
      }

      if (!paymentResult.success || !paymentResult.redirectUrl) {
        throw new Error(paymentResult.error || "Payment initiation failed");
      }

      window.location.href = paymentResult.redirectUrl;
    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error(error.message || "Failed to process donation");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className={`bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white ${className}`}>
            <Heart className="h-4 w-4 mr-2 fill-current" />
            Donate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
            Support Our Mission
          </DialogTitle>
          <DialogDescription>
            Your donation helps us empower dragon fruit farmers across Africa with training, resources, and market access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preset amounts */}
          <div className="space-y-2">
            <Label>Select Amount</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset && !customAmount ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                  className={amount === preset && !customAmount ? "bg-primary" : ""}
                >
                  R{preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="customAmount">Or Enter Custom Amount (ZAR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
              <Input
                id="customAmount"
                type="number"
                min="10"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Donor info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name (Optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment method - PayFast temporarily deactivated */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary bg-primary/5">
              <CreditCard className="h-4 w-4 text-[#00A8E8]" />
              <div>
                <span className="font-bold text-[#00A8E8]">Yoco</span>
                <p className="text-xs text-muted-foreground">Visa, Mastercard with 3D Secure</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Your Donation</span>
              <span className="text-2xl font-bold text-pink-600">
                {formatPrice(effectiveAmount || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              100% of your donation goes directly to supporting dragon fruit farmers
            </p>
          </div>

          <Button
            onClick={handleDonate}
            disabled={loading || !email || effectiveAmount < 10}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2 fill-current" />
                Donate {formatPrice(effectiveAmount || 0)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
