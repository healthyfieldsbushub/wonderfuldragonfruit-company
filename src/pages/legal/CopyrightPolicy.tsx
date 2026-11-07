import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Our Content",
    body: <p>Text, photography, cultivar guides, pricing documents, videos, logos and page layouts on this site are owned by Wonderful Dragon Fruit South Africa or used under licence, and are protected by copyright and trademark law.</p>,
  },
  {
    heading: "2. Permitted Use",
    body: (
      <ul>
        <li>You may view, download and print pages for your own non-commercial reference.</li>
        <li>You may quote short extracts with clear credit and a link to the source page.</li>
        <li>You may not republish, resell, systematically scrape or use our content to train commercial models without written permission.</li>
      </ul>
    ),
  },
  {
    heading: "3. Content You Submit",
    body: <p>You keep ownership of material you upload (photos, reviews, listing details) and grant us a non-exclusive licence to display and promote it on this website and our channels. You confirm you have the right to share it.</p>,
  },
  {
    heading: "4. Reporting Infringement",
    body: (
      <>
        <p>If you believe content on this site infringes your copyright, send us a notice including:</p>
        <ul>
          <li>Your name and contact details.</li>
          <li>A description of the work you say was copied.</li>
          <li>The URL(s) of the infringing content on our site.</li>
          <li>A statement that you hold the rights or are authorised to act, and that the complaint is made in good faith.</li>
        </ul>
        <p>
          Send notices to{" "}
          <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
            admin@proagrisa.co.za
          </a>{" "}
          with the subject line “Copyright notice”.
        </p>
      </>
    ),
  },
  {
    heading: "5. Counter-Notice",
    body: <p>If your content was removed and you believe that was incorrect, you may send a counter-notice with your details and an explanation of why you have the right to use the material.</p>,
  },
  {
    heading: "6. Repeat Infringers",
    body: <p>Accounts or listings that repeatedly infringe the rights of others may be suspended or permanently removed.</p>,
  },
  {
    heading: "7. Permission Requests",
    body: <p>For licensing, media use or reprint requests, contact us with details of the intended use, audience and duration.</p>,
  },
];

export default function CopyrightPolicy() {
  return (
    <LegalPageLayout
      title="Copyright Policy"
      metaTitle="Copyright Policy | Wonderful Dragon Fruit South Africa"
      metaDescription="How Wonderful Dragon Fruit South Africa content may be used, how to license or credit it, and how to submit a copyright infringement notice or counter-notice."
      canonicalUrl="/copyright-policy"
      intro={
        <p>
          This policy explains who owns the content on this website, how you may use it, and how to report
          suspected copyright infringement. The wording below is placeholder content pending legal review.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
