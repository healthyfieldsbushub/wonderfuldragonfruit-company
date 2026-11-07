import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  message?: string;
  productName?: string;
  variant?: "default" | "floating" | "inline";
  className?: string;
  children?: React.ReactNode;
}

const WHATSAPP_NUMBER = "27834474639";

export function WhatsAppButton({ 
  message, 
  productName, 
  variant = "default",
  className,
  children 
}: WhatsAppButtonProps) {
  const defaultMessage = productName 
    ? `Hi! I'm interested in the ${productName} dragon fruit cutting. Can you please provide more information?`
    : "Hi! I'm interested in your dragon fruit cuttings and services. Can you please provide more information?";
  
  const finalMessage = message || defaultMessage;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;

  const handleClick = () => {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group",
          className
        )}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden group-hover:inline-block font-medium">Chat with us</span>
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-2 text-[#25D366] hover:text-[#128C7E] font-medium transition-colors",
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {children || "WhatsApp"}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "bg-[#25D366] hover:bg-[#128C7E] text-white gap-2",
        className
      )}
    >
      <MessageCircle className="h-5 w-5" />
      {children || "Chat on WhatsApp"}
    </Button>
  );
}
