import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { motion } from "framer-motion";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capturePayPalPayment } from "@/lib/api";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");
  const paypalToken = searchParams.get("token");
  const paymentProvider = searchParams.get("provider");
  const [showConfetti, setShowConfetti] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirmed" | "failed">("pending");

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (paymentProvider !== "paypal" || !paypalToken || !orderNumber) return;
    capturePayPalPayment(paypalToken, orderNumber)
      .then((result) => setPaymentStatus(result.success ? "confirmed" : "failed"))
      .catch(() => setPaymentStatus("failed"));
  }, [orderNumber, paymentProvider, paypalToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Header />
      <CartSidebar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-3xl md:text-4xl font-bold mb-4"
            >
              Thank You for Your Order! 🎉
            </motion.h1>

            {/* Order number */}
            {orderNumber && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <p className="text-muted-foreground mb-2">Your order number is</p>
                <p className="text-2xl font-bold text-gradient-sunset">{orderNumber}</p>
              </motion.div>
            )}

            {/* Info cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-2 gap-4 mb-8"
            >
              <div className="glass-card p-6 rounded-xl">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Payment Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  {paymentStatus === "confirmed" ? "Your PayPal payment has been confirmed. " : paymentStatus === "failed" ? "We could not confirm this PayPal payment yet. " : "You'll receive an email confirmation as soon as your payment is verified. "}
                  Orders are only prepared and shipped after successful payment.
                </p>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <Package className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Shipping Updates</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive tracking information once your order ships.
                </p>
              </div>
            </motion.div>

            {/* Order Processing Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mb-8 p-5 border border-amber-200 bg-amber-50 rounded-xl text-left"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" /> Order Processing Notice
              </h3>
              <p className="text-sm text-muted-foreground">
                Please allow 24–48 hours for your order to be processed after receipt of payment has been confirmed. You will receive further updates as your order progresses.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/products">
                <Button className="btn-sunset">
                  Continue Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </motion.div>

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-12 text-center text-sm text-muted-foreground"
            >
              <p>Questions about your order?</p>
              <a
                href="mailto:orders@proagrisa.co.za"
                className="text-primary hover:underline"
              >
                orders@proagrisa.co.za
              </a>
              {" | "}
              <a href="tel:+27834474639" className="text-primary hover:underline">
                +27 83 447 4639
              </a>
            </motion.div>
          </motion.div>

          {/* Confetti effect */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: 0,
                    y: window.innerHeight + 20,
                    rotate: Math.random() * 720 - 360,
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    delay: Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: ["#D35400", "#B8860B", "#2C1810", "#27ae60", "#3498db"][
                      Math.floor(Math.random() * 5)
                    ],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderSuccess;
