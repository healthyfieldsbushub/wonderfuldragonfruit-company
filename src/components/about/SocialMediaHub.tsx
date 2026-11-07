import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Social media icons as SVG components
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const mainChannels = [
  {
    name: "Wonderful Dragon Fruit South Africa Botswana",
    platform: "Facebook",
    icon: FacebookIcon,
    url: "https://web.facebook.com/profile.php?id=61576398743933",
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    name: "Wonderful Dragonfruit",
    platform: "Instagram",
    icon: InstagramIcon,
    url: "https://www.instagram.com/wonderfuldragonfruit",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90"
  },
  {
    name: "Wonderful Dragonfruit",
    platform: "TikTok",
    icon: TikTokIcon,
    url: "https://www.tiktok.com/@wonderfuldragonfruit",
    color: "bg-black hover:bg-gray-900"
  },
  {
    name: "Wonderful Dragonfruit",
    platform: "Pinterest",
    icon: PinterestIcon,
    url: "https://za.pinterest.com/wonderfuldragonfruitcoza/",
    color: "bg-red-600 hover:bg-red-700"
  },
  {
    name: "Healthy Fields DFSA",
    platform: "YouTube",
    icon: YouTubeIcon,
    url: "https://www.youtube.com/@HealthyFieldsDFSAWonderful",
    color: "bg-red-500 hover:bg-red-600"
  }
];

const facebookPages = [
  { id: "61574523521887", name: "DFSA Network 1" },
  { id: "61575872566106", name: "DFSA Network 2" },
  { id: "100044523314915", name: "DFSA Network 3" },
  { id: "100064007344653", name: "DFSA Network 4" },
  { id: "100039440456039", name: "DFSA Network 5" },
  { id: "100057177770852", name: "DFSA Network 6" },
  { id: "100068569008434", name: "DFSA Network 7" },
  { id: "100080629868983", name: "DFSA Network 8" },
  { id: "100057195981969", name: "DFSA Network 9" },
  { id: "100057294555647", name: "DFSA Network 10" }
];

export const SocialMediaHub = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Follow <span className="text-gradient-tropical">Wonderful Dragonfruit</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay connected with DFSA and the Wonderful Dragonfruit network across all our social media channels.
          </p>
        </motion.div>

        {/* Main Channels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 max-w-4xl mx-auto">
          {mainChannels.map((channel, index) => (
            <motion.a
              key={channel.platform}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${channel.color} text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <channel.icon />
              <span className="text-xs font-medium text-center">{channel.platform}</span>
            </motion.a>
          ))}
        </div>

        {/* Facebook Network */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="glass-card max-w-4xl mx-auto">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <FacebookIcon />
                DFSA Facebook Network
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join our community across multiple Facebook pages for regional updates and farmer connections.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {facebookPages.map((page, index) => (
                  <a
                    key={page.id}
                    href={`https://web.facebook.com/profile.php?id=${page.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-all duration-300"
                  >
                    <FacebookIcon />
                    Page {index + 1}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
