import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  acceptAll,
  applyConsent,
  ALL_GRANTED,
  DEFAULT_DENIED,
  hasDecided,
  rejectAll,
  type ConsentChoices,
} from "@/lib/consent";

/**
 * GDPR/POPIA-friendly cookie banner wired to Google Consent Mode v2.
 * Defaults to denied; only fires updates after explicit user action.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>(DEFAULT_DENIED);

  useEffect(() => {
    if (!hasDecided()) setVisible(true);
    const open = () => {
      setShowPrefs(true);
      setVisible(true);
    };
    window.addEventListener("consent:open", open);
    return () => window.removeEventListener("consent:open", open);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };
  const handleRejectAll = () => {
    rejectAll();
    setVisible(false);
  };
  const handleSave = () => {
    applyConsent(choices);
    setVisible(false);
  };

  const toggle = (key: keyof ConsentChoices) => (val: boolean) =>
    setChoices((prev) => ({ ...prev, [key]: val ? "granted" : "denied" }));

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 backdrop-blur-sm shadow-lg"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        {!showPrefs ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-foreground max-w-3xl">
              <p className="font-semibold mb-1">We value your privacy</p>
              <p className="text-muted-foreground">
                We use cookies to analyze site traffic and improve your experience. You can accept all,
                reject non-essential, or customize your choices. See our{" "}
                <Link to="/cookie-policy" className="underline underline-offset-2 hover:text-primary">
                  Cookie Policy
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-primary">
                  Privacy Policy
                </Link>
                .
              </p>

            </div>
            <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowPrefs(true)}>
                Preferences
              </Button>
              <Button variant="outline" size="sm" onClick={handleRejectAll}>
                Reject all
              </Button>
              <Button size="sm" onClick={handleAcceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-foreground">Cookie preferences</h2>
              <p className="text-sm text-muted-foreground">
                Essential cookies are always on. Toggle the rest to control how Google Analytics and ads behave.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PrefRow label="Essential" description="Required for security and core site features." checked disabled />
              <PrefRow
                label="Analytics"
                description="Google Analytics traffic measurement (anonymized IP)."
                checked={choices.analytics_storage === "granted"}
                onChange={toggle("analytics_storage")}
              />
              <PrefRow
                label="Advertising storage"
                description="Allows ad cookies for measurement and remarketing."
                checked={choices.ad_storage === "granted"}
                onChange={(v) => {
                  setChoices((p) => ({
                    ...p,
                    ad_storage: v ? "granted" : "denied",
                    ad_user_data: v ? "granted" : "denied",
                  }));
                }}
              />
              <PrefRow
                label="Ad personalization"
                description="Personalized ads based on your activity."
                checked={choices.ad_personalization === "granted"}
                onChange={toggle("ad_personalization")}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setChoices(DEFAULT_DENIED); }}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleRejectAll}>
                Reject all
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setChoices(ALL_GRANTED); }}>
                Select all
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrefRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

/** Programmatically reopen the banner (e.g. from a footer "Cookie settings" link). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("consent:open"));
}
