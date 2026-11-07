/**
 * Central social media configuration for Wonderful Dragon Fruit South Africa.
 *
 * Used by:
 *  - Site footer (home screen bottom)   -> src/components/layout/SiteFooter.tsx
 *  - Admin social media manager         -> src/pages/admin/AdminSocial.tsx
 *  - Share buttons (products/catalogues)-> src/components/ui/share-buttons.tsx
 *
 * WhatsApp share uses wa.me deep links; Facebook share uses the sharer.php
 * endpoint so no Facebook App ID is required.
 */

export interface SocialPage {
  /** Display name of the page */
  name: string;
  /** Canonical URL users are directed to */
  url: string;
  /** Optional shorter handle shown next to the name */
  username?: string;
  /** Group for display: "network" | "regional" | "personal" */
  group: "network" | "regional" | "personal";
}

export const FACEBOOK_PAGES: SocialPage[] = [
  {
    name: "DFSA Members Network",
    url: "https://www.facebook.com/DFSAMembersNetwork",
    username: "@DFSAMembersNetwork",
    group: "network",
  },
  {
    name: "Dragon Fruit Worldwide South Africa Plant Supply",
    url: "https://www.facebook.com/DragonFruitPlantsSouthAfrica",
    username: "@DragonFruitPlantsSouthAfrica",
    group: "network",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit DFSA",
    url: "https://www.facebook.com/WonderfulDragonFruitDFSA",
    username: "@WonderfulDragonFruitDFSA",
    group: "network",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit Botswana",
    url: "https://www.facebook.com/DragonFruitBotswana",
    username: "@DragonFruitBotswana",
    group: "regional",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit Malawi",
    url: "https://www.facebook.com/DragonFruitMalawi",
    username: "@DragonFruitMalawi",
    group: "regional",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit Mozambique",
    url: "https://www.facebook.com/DragonFruitMozambique",
    username: "@DragonFruitMozambique",
    group: "regional",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit Namibia",
    url: "https://www.facebook.com/DragonFruitNamibia",
    username: "@DragonFruitNamibia",
    group: "regional",
  },
  {
    name: "ProAgriSA Wonderful Dragon Fruit Zimbabwe",
    url: "https://www.facebook.com/DragonFruitZimbabwe",
    username: "@DragonFruitZimbabwe",
    group: "regional",
  },
  {
    name: "Max van Heerden (Cornelius DFSA)",
    url: "https://www.facebook.com/MaxVanHeerdenDFSA",
    username: "@MaxVanHeerdenDFSA",
    group: "personal",
  },
];

/** Site-wide WhatsApp number used for share + contact deep links. */
const WHATSAPP_NUMBER = "27834474639";

/** Build a wa.me deep link with a prefilled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Build a Facebook share URL for any content (product, catalogue, page). */
function facebookShareLink(url: string, quote?: string): string {
  const u = new URL("https://www.facebook.com/sharer/sharer.php");
  u.searchParams.set("u", url);
  if (quote) u.searchParams.set("quote", quote);
  return u.toString();
}

/** Group label helper for admin/footer rendering. */
export const SOCIAL_GROUP_LABELS: Record<SocialPage["group"], string> = {
  network: "Network Pages",
  regional: "Regional Pages",
  personal: "Personal Profile",
};
