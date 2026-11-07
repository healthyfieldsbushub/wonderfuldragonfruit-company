import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Persistent back button shown at the top of every page.
 * Returns to the previous page; falls back to Home if there is no history
 * (e.g. the user landed directly via a search result or shared link).
 */
export function BackButton({ label = "Back", className = "" }: { label?: string; className?: string }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`mb-4 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground ${className}`}
      onClick={() => {
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate("/");
        }
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
