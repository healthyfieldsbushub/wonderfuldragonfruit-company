import { useSearchParams } from "react-router-dom";
import { DracoSection } from "@/components/draco/DracoSection";
import { CheckCircle2 } from "lucide-react";

export default function DracoPage() {
  const [params] = useSearchParams();
  const status = params.get("status");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-10">
        {status === "success" ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-emerald-100 mb-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">Payment received.</span> Your DRACO Pro Grower subscription activates as
              soon as PayFast confirms the payment (usually instantly). Refresh this page to open DRACO Chat.
            </p>
          </div>
        ) : null}
        {status === "cancelled" ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-100 mb-6 text-sm">
            Checkout was cancelled — no charge was made. You can subscribe any time below.
          </div>
        ) : null}
      </div>
      <DracoSection />
    </div>
  );
}
