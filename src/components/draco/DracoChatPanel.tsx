import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Send, X } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

interface DracoChatPanelProps {
  onClose: () => void;
  onPaywall: () => void;
}

export function DracoChatPanel({ onClose, onPaywall }: DracoChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to DRACO Pro. Ask me anything about dragon fruit cultivation — cultivars, fertilising, trellising, pests, disease, or upload a photo for diagnosis." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [scansUsed, setScansUsed] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/draco/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content })) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 402 || response.status === 401) { onPaywall(); return; }
      if (!response.ok) throw new Error(payload?.error?.message || "DRACO could not answer. Please try again.");
      if (payload?.data?.usage?.usage?.scans !== undefined) setScansUsed(payload.data.usage.usage.scans);
      setMessages((prev) => [...prev, { role: "assistant", content: payload?.data?.content || "…" }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  };

  const scan = async (file: File) => {
    if (busy) return;
    setMessages((prev) => [...prev, { role: "user", content: `📷 Photo diagnosis: ${file.name}` }]);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("question", "Diagnose this dragon fruit plant photo: identify any disease, pest, or deficiency, and give a treatment plan.");
      const response = await fetch("/api/draco/scan", { method: "POST", credentials: "include", body: form });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 402 || response.status === 401) { onPaywall(); return; }
      if (!response.ok) throw new Error(payload?.error?.message || "The scan could not be completed. Please try again.");
      if (payload?.data?.usage?.usage?.scans !== undefined) setScansUsed(payload.data.usage.usage.scans);
      setMessages((prev) => [...prev, { role: "assistant", content: payload?.data?.content || "…" }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: error instanceof Error ? error.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-[#0b2e1f] to-[#123a26] text-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-black/30">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="font-semibold text-sm">DRACO Pro Agronomist</p>
          {scansUsed !== null && <span className="text-[11px] text-emerald-100/60">{scansUsed}/30 scans this month</span>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div ref={scrollRef} className="max-h-80 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-sahara-gold text-[#12240f]" : "bg-emerald-900/70 text-emerald-50"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-emerald-100/60 animate-pulse">DRACO is thinking…</p>}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-emerald-900/40 bg-black/20">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { void scan(f); e.target.value = ""; } }}
        />
        <Button variant="outline" size="icon" className="border-emerald-700 text-white hover:bg-white/10" onClick={() => fileRef.current?.click()} title="Photo diagnosis scan">
          <Camera className="h-4 w-4" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
          placeholder="Ask DRACO about your dragon fruit orchard…"
          className="bg-white/10 border-emerald-800 text-white placeholder:text-emerald-100/50"
        />
        <Button size="icon" onClick={() => void send()} disabled={busy} className="bg-sahara-gold text-[#12240f] hover:bg-sahara-gold/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
