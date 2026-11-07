import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Be Respectful",
    body: <p>Treat other growers, buyers and staff with courtesy. Disagree with ideas, not people. Harassment, hate speech, threats and personal attacks are not allowed.</p>,
  },
  {
    heading: "2. Keep It Accurate",
    body: <p>Do not post misleading yield claims, fake reviews, unverified health claims or false cultivar identifications. Share sources where you can.</p>,
  },
  {
    heading: "3. No Spam or Unauthorised Selling",
    body: (
      <ul>
        <li>No repetitive promotional posting, referral spam or bulk messaging.</li>
        <li>No unsolicited advertising in reviews, comments or directory listings.</li>
        <li>Business listings must describe a real, operating business.</li>
      </ul>
    ),
  },
  {
    heading: "4. Respect Privacy",
    body: <p>Do not post other people's personal information, private messages, contact details or farm locations without their permission.</p>,
  },
  {
    heading: "5. Prohibited Content",
    body: (
      <ul>
        <li>Illegal activity, including trade in prohibited plant material or uncertified cross-border shipments.</li>
        <li>Sexually explicit, violent or exploitative content.</li>
        <li>Malware, phishing links or attempts to compromise the site.</li>
        <li>Content that infringes someone else's copyright or trademark.</li>
      </ul>
    ),
  },
  {
    heading: "6. Reporting a Problem",
    body: (
      <p>
        Report content that breaks these guidelines to{" "}
        <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
          admin@proagrisa.co.za
        </a>
        . Include a link and a short description.
      </p>
    ),
  },
  {
    heading: "7. Enforcement",
    body: <p>Depending on severity we may edit or remove content, issue a warning, suspend a listing or account, or report unlawful activity to authorities. Serious or repeated breaches may result in permanent removal.</p>,
  },
  {
    heading: "8. Appeals",
    body: <p>If you believe we acted in error, reply to the enforcement notice within 14 days and we will review the decision.</p>,
  },
];

export default function CommunityGuidelines() {
  return (
    <LegalPageLayout
      title="Community Guidelines"
      metaTitle="Community Guidelines | Wonderful Dragon Fruit South Africa"
      metaDescription="The standards for reviews, comments, business listings and community participation on the Wonderful Dragon Fruit South Africa website, plus how to report violations."
      canonicalUrl="/community-guidelines"
      intro={
        <p>
          These guidelines set out how we expect visitors, members and listed businesses to behave in reviews,
          comments, directory listings and other community spaces on this website. The wording below is
          placeholder content pending review.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
