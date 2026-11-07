import { useState } from "react";
import { Facebook, Twitter, Linkedin, Link2, Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string; // path or absolute URL
  title: string;
  description?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  label?: string;
}

const SITE_ORIGIN = "https://www.wonderfuldragonfruit.company";

function buildAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      // ignore
    }
  }
  return `${SITE_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function ShareButtons({
  url,
  title,
  description,
  className,
  size = "icon",
  label = "Share:",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = buildAbsoluteUrl(url);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(description ? `${title} — ${description}` : title);

  const targets = [
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: Facebook,
      className: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      Icon: MessageCircle,
      className: "hover:bg-[#25D366] hover:text-white hover:border-[#25D366]",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Twitter,
      className: "hover:bg-foreground hover:text-background",
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: Linkedin,
      className: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
    },
    {
      name: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: Send,
      className: "hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]",
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: description, url: shareUrl });
      } catch {
        // user cancelled
      }
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && (navigator as any).share;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && <span className="text-sm font-medium text-muted-foreground mr-1">{label}</span>}
      {targets.map(({ name, href, Icon, className: iconClass }) => (
        <Button
          key={name}
          asChild
          variant="outline"
          size={size}
          className={cn("transition-colors", iconClass)}
          aria-label={`Share on ${name}`}
        >
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleCopy}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
      {canNativeShare && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="md:hidden"
        >
          More…
        </Button>
      )}
    </div>
  );
}
