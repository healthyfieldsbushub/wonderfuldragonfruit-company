import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/consent/CookieConsentBanner";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. What Cookies Are",
    body: <p>Cookies are small text files stored on your device that help a website remember your actions and preferences, and help owners understand how the site is used.</p>,
  },
  {
    heading: "2. Categories We Use",
    body: (
      <ul>
        <li><strong>Essential</strong> — sign-in, cart contents, security and load balancing. Always active.</li>
        <li><strong>Analytics</strong> — Google Analytics traffic measurement, set only with your consent.</li>
        <li><strong>Advertising storage</strong> — measurement and remarketing cookies, set only with your consent.</li>
        <li><strong>Ad personalisation</strong> — tailoring adverts to your interests, set only with your consent.</li>
      </ul>
    ),
  },
  {
    heading: "3. Consent Mode",
    body: <p>Analytics and advertising storage default to “denied” until you make a choice in the cookie banner. Your decision is stored locally in your browser and forwarded to Google Consent Mode v2.</p>,
  },
  {
    heading: "4. Third-Party Cookies",
    body: <p>Third parties such as Google Analytics, Google Tag Manager, our payment provider and embedded social or video content may set their own cookies under their own policies.</p>,
  },
  {
    heading: "5. Managing Your Choices",
    body: (
      <>
        <p>You can change your preferences at any time:</p>
        <ul>
          <li>Use the cookie settings panel on this site (button below).</li>
          <li>Clear or block cookies in your browser settings.</li>
          <li>Use browser privacy or tracking-protection modes.</li>
        </ul>
        <Button size="sm" onClick={openCookieSettings} className="mt-1">
          Open cookie settings
        </Button>
      </>
    ),
  },
  {
    heading: "6. Retention",
    body: <p>Session cookies expire when you close your browser. Persistent cookies may last from a few days up to 24 months, depending on their purpose.</p>,
  },
  {
    heading: "7. Contact",
    body: (
      <p>
        Cookie questions:{" "}
        <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
          admin@proagrisa.co.za
        </a>
        .
      </p>
    ),
  },
];

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      metaTitle="Cookie Policy | Wonderful Dragon Fruit South Africa"
      metaDescription="Which cookies Wonderful Dragon Fruit South Africa uses, why we use them, and how to accept, reject or change your cookie preferences at any time."
      canonicalUrl="/cookie-policy"
      intro={
        <p>
          This Cookie Policy explains the cookies and similar technologies used on this website, what each
          category does, and how to control them. The wording below is placeholder content pending legal
          review.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
