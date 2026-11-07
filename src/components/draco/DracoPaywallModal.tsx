import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Camera, BookOpen, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DracoPaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceZar?: number;
  status?: string;
}

const features = [
  { icon: MessageSquare, title: "Full DRACO AI Agronomist chat", detail: "Cultivar, fertiliser, irrigation, pest and disease advice 24/7." },
  { icon: Camera, title: "30 photo diagnosis scans / month", detail: "Upload leaf, stem or fruit photos for instant disease and pest identification." },
  { icon: BookOpen, title: "Curated knowledgebase answers", detail: "DRACO prioritises our admin-maintained growing guides over generic answers." },
];

export function DracoPaywallModal({ open, onOpenChange, priceZar = 199, status }: DracoPaywallModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const subscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/draco/checkout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await response.json().catch(() => ({}));
      const fields = payload?.data?.formFields;
      const actionUrl = payload?.data?.actionUrl;
      if (!response.ok || !fields || !actionUrl) {
        const code = payload?.error?.code;
        setError(code === "DRACO_SIGNIN_REQUIRED"
          ? "Please sign in first — DRACO subscriptions are linked to your account."
          : (payload?.error?.message || "Checkout could not be created. Please try again."));
        setBusy(false);
        return;
      }
      // Submit the signed PayFast subscription form.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = actionUrl;
      Object.entries(fields as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Checkout could not be created. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-emerald-900/40 bg-gradient-to-b from-[#0b2e1f] to-[#123a26] text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <ShieldCheck className="h-6 w-6 text-sahara-gold" />
            Unlock DRACO Pro Agronomist
          </DialogTitle>
          <DialogDescription className="text-emerald-100/80">
            DRACO is a paid-only expert service. No free tier — every answer comes from a real agronomist-grade AI with our own knowledgebase.
            {status ? ` (Payment status: ${status})` : ""}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 my-2">
          {features.map((f) => (
            <li key={f.title} className="flex gap-3 items-start">
              <f.icon className="h-5 w-5 mt-0.5 text-sahara-gold flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-emerald-100/70">{f.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-xl bg-black/20 p-4 text-center">
          <p className="text-3xl font-bold">R{priceZar}<span className="text-sm font-normal text-emerald-100/70">/month</span></p>
          <p className="text-xs text-emerald-100/60 mt-1">Recurring monthly subscription via PayFast. Cancel anytime.</p>
        </div>

        {error && <p className="text-sm text-red-300 bg-red-950/40 rounded-lg p-3">{error}</p>}

        {!user && (
          <p className="text-xs text-emerald-100/70 -mt-1">
            Not signed in yet? <a href="/login" className="underline text-sahara-gold">Sign in</a> — your subscription is linked to your account.
          </p>
        )}

        <Button
          onClick={subscribe}
          disabled={busy}
          className="w-full bg-sahara-gold text-[#12240f] hover:bg-sahara-gold/90 font-semibold text-base py-3 rounded-xl"
        >
          {busy ? "Preparing checkout…" : "Subscribe Now with PayFast"}
        </Button>
        <p className="text-[11px] text-emerald-100/50 text-center">Secure payment processed by PayFast. Access activates automatically after payment.</p>
      </DialogContent>
    </Dialog>
  );
}
