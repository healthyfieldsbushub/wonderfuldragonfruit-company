import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ExternalLink } from "lucide-react";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const facebookPages = [
  { id: "61589209614070", name: "Botswana" },
  { id: "61565301583319", name: "Namibia" },
  { id: "61564586858163", name: "Zimbabwe" },
  { id: "61571339863052", name: "DFSA Hub" },
  { id: "61563159332764", name: "Members Network" },
  { id: "61564791460426", name: "Zambia" },
  { id: "61560728786177", name: "Mozambique" },
  { id: "61562992080499", name: "Malawi" },
];

const platforms = [
  {
    label: "TikTok",
    handle: "@maxvanheerden_proagrisa",
    url: "https://www.tiktok.com/@maxvanheerden_proagrisa",
    icon: TikTokIcon,
    color: "bg-black hover:bg-gray-900 text-white",
  },
  {
    label: "Instagram",
    handle: "@wonderful_dragon_fruit_dfsa",
    url: "https://www.instagram.com/wonderful_dragon_fruit_dfsa",
    icon: InstagramIcon,
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white",
  },
  {
    label: "LinkedIn",
    handle: "Cornelius Andrias van Heerden",
    url: "https://www.linkedin.com/in/cornelius-andrias-van-heerden-10b18a350/",
    icon: LinkedInIcon,
    color: "bg-[#0A66C2] hover:bg-[#0856a8] text-white",
  },
  {
    label: "YouTube",
    handle: "@CorneliusAndriasVanHeerden",
    url: "https://www.youtube.com/@CorneliusAndriasVanHeerden",
    icon: YouTubeIcon,
    color: "bg-red-600 hover:bg-red-700 text-white",
  },
  {
    label: "X (Twitter)",
    handle: "@HealthyFieldssa",
    url: "https://x.com/HealthyFieldssa",
    icon: XIcon,
    color: "bg-black hover:bg-gray-900 text-white",
  },
];

export const ConnectWithUs = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Connect With{" "}
            <span className="text-gradient-tropical">Proagrisa Wonderful Dragon Fruit South Africa</span>
          </h2>
          <p className="text-muted-foreground">
            Stay connected across our social platforms and regional Facebook networks for
            farming insights, updates and the latest dragon fruit production news from across Africa.
          </p>
        </motion.div>

        {/* Official website */}
        <div className="max-w-4xl mx-auto mb-8">
          <a
            href="https://www.wonderfuldragonfruit.company/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-background hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Official Website</p>
                <p className="font-semibold">wonderfuldragonfruit.company</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>

        {/* Social platforms */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-10">
          {platforms.map((p, i) => (
            <motion.a
              key={p.label}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`${p.color} rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg`}
            >
              <p.icon />
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-[10px] opacity-80 text-center break-all">{p.handle}</span>
            </motion.a>
          ))}
        </div>

        {/* Facebook Regional Network */}
        <Card className="glass-card max-w-5xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
              <FacebookIcon />
              Proagrisa Facebook Regional Network
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Follow our country-specific Facebook pages for localised dragon fruit farming updates.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {facebookPages.map((page) => (
                <a
                  key={page.id}
                  href={`https://web.facebook.com/profile.php?id=${page.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white text-xs font-medium transition-all"
                >
                  <FacebookIcon />
                  <span className="truncate">{page.name}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
