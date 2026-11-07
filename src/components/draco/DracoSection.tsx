import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Camera, BookOpen, MessageSquare, Sparkles, ShieldCheck } from "lucide-react";
import { DracoChatPanel } from "./DracoChatPanel";
import { DracoPaywallModal } from "./DracoPaywallModal";

interface DracoStatus {
  subscribed: boolean;
  plan?: string;
  priceZar?: number;
  scansUsed?: number;
  scansLimit?: number;
  currentPeriodEnd?: string;
  error?: string;
}

export function DracoSection() {
  const [status, setStatus] = useState<DracoStatus | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/draco/status", { credentials: "include" })
      .then((r) => r.json())
      .then((payload) => { if (!cancelled) setStatus(payload?.data || { subscribed: false, error: "unavailable" }); })
      .catch(() => { if (!cancelled) setStatus({ subscribed: false, error: "unavailable" }); });
    return () => { cancelled = true; };
  }, []);

  const onPaywall = useCallback(() => { setChatOpen(false); setPaywallOpen(true); }, []);

  const subscribed = status?.subscribed === true;

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12" aria-label="DRACO Pro Agronomist">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-[#0b2e1f] via-[#123a26] to-[#0b2e1f] p-6 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sahara-gold/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Paid-only · No free tier · Pro-grade AI
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white flex items-center gap-3">
              <Bot className="h-8 w-8 text-sahara-gold" /> Meet DRACO
              <span className="text-sahara-gold">Pro Agronomist</span>
            </h2>
            <p className="mt-3 text-emerald-100/80 max-w-xl">
              Your 24/7 dragon fruit expert. Photo-diagnose leaf, stem and fruit problems, get cultivar and
              fertiliser advice, and draw on our curated growing knowledgebase — every answer.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-emerald-50">
              <li className="flex items-start gap-2"><Camera className="h-4 w-4 mt-0.5 text-sahara-gold flex-shrink-0" /> 30 photo diagnosis scans per month — pests, disease, deficiencies</li>
              <li className="flex items-start gap-2"><MessageSquare className="h-4 w-4 mt-0.5 text-sahara-gold flex-shrink-0" /> Full AI agronomist chat — cultivation, irrigation, trellising, harvest</li>
              <li className="flex items-start gap-2"><BookOpen className="h-4 w-4 mt-0.5 text-sahara-gold flex-shrink-0" /> Answers prioritised from our admin-curated knowledgebase</li>
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {subscribed ? (
                <Button
                  size="lg"
                  onClick={() => setChatOpen((v) => !v)}
                  className="bg-sahara-gold text-[#12240f] hover:bg-sahara-gold/90 font-semibold rounded-xl px-8 py-3"
                >
                  {chatOpen ? "Close DRACO Chat" : "Open DRACO Chat"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setPaywallOpen(true)}
                  className="bg-sahara-gold text-[#12240f] hover:bg-sahara-gold/90 font-semibold rounded-xl px-8 py-3"
                >
                  <ShieldCheck className="h-5 w-5 mr-2" /> Unlock DRACO Pro Agronomist
                </Button>
              )}
              <p className="text-sm text-emerald-100/70">
                R{status?.priceZar ?? 199}<span className="text-xs">/month</span> · Cancel anytime
                {subscribed && status?.currentPeriodEnd ? (
                  <span className="block text-xs text-emerald-100/50">Active until {new Date(status.currentPeriodEnd).toLocaleDateString()}</span>
                ) : null}
              </p>
            </div>
          </div>

          <div>
            {chatOpen && subscribed ? (
              <DracoChatPanel onClose={() => setChatOpen(false)} onPaywall={onPaywall} />
            ) : (
              <div className="rounded-2xl border border-emerald-900/40 bg-white/5 backdrop-blur-sm p-5 text-emerald-50 space-y-3">
                <p className="font-display font-semibold text-lg text-white">What DRACO can diagnose</p>
                {["Leaf and stem disease (anthracnose, stem rot)", "Pest identification (mites, mealybug, ants)", "Nutrient deficiencies and fertiliser schedules", "Flowering, pollination and fruit-set problems", "Cultivar selection for your climate and market"].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-sahara-gold" /> {item}</p>
                ))}
                {!subscribed && (
                  <p className="text-xs text-emerald-100/60 pt-2 border-t border-emerald-900/40">
                    Subscribe to unlock chat and photo scans. No free tier — every feature is part of the Pro Grower plan.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <DracoPaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />
    </section>
  );
}
