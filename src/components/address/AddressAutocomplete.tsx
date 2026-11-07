import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export interface AddressSelection {
  placeId: string;
  lat?: string;
  lon?: string;
  formattedAddress: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

interface Props {
  onAddressSelected: (selection: AddressSelection) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  placeId: string;
  description: string;
  lat?: string;
  lon?: string;
}

// GEO address pickup: the customer types a few characters and picks a verified
// South African address; the server resolves it into street/city/province/postal
// fields so manual typing errors can't break shipping rates.
export const AddressAutocomplete = ({ onAddressSelected, label = "Address Lookup", placeholder = "Start typing your address, e.g. 877 Pretorius Street, Pretoria", className = "" }: Props) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (value: string) => {
    setInput(value);
    setOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/functions/address-autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: value.trim() }),
        });
        const payload = await response.json();
        const data = payload?.data ?? payload ?? {};
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setOpen(false);
    setInput(suggestion.description);
    setSuggestions([]);
    try {
      const response = await fetch("/api/functions/address-place-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: suggestion.placeId, lat: suggestion.lat, lon: suggestion.lon }),
      });
      const payload = await response.json();
      const details = payload?.data ?? payload ?? {};
      onAddressSelected({
        placeId: suggestion.placeId,
        lat: suggestion.lat,
        lon: suggestion.lon,
        formattedAddress: details.formattedAddress || suggestion.description,
        street: details.street,
        city: details.city,
        province: details.province,
        postalCode: details.postalCode,
        country: details.country,
      });
    } catch {
      onAddressSelected({ placeId: suggestion.placeId, lat: suggestion.lat, lon: suggestion.lon, formattedAddress: suggestion.description });
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="block text-sm font-medium mb-1.5">
        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {label}</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-popover py-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="inline-flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>{suggestion.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
