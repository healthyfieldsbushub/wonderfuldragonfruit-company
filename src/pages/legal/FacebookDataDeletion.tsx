import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. What Data We Receive From Facebook",
    body: <p>If you interact with us through Facebook or Instagram — for example by logging in with Facebook or messaging our page — we may receive your name, profile picture, email address and message history, subject to the permissions you granted.</p>,
  },
  {
    heading: "2. Remove Our App From Facebook",
    body: (
      <ul>
        <li>Open Facebook and go to <strong>Settings &amp; Privacy → Settings</strong>.</li>
        <li>Select <strong>Apps and Websites</strong>.</li>
        <li>Find <strong>Wonderful Dragon Fruit South Africa</strong> in the list.</li>
        <li>Click <strong>Remove</strong> and tick the option to delete related posts and activity.</li>
      </ul>
    ),
  },
  {
    heading: "3. Request Deletion Directly From Us",
    body: (
      <>
        <p>To have the data we hold deleted, email us with the details below:</p>
        <ul>
          <li>
            Send to{" "}
            <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
              admin@proagrisa.co.za
            </a>
          </li>
          <li>Subject line: <strong>Facebook Data Deletion Request</strong></li>
          <li>Include the Facebook name and email address linked to your account.</li>
          <li>Optionally state whether you also want order or enquiry records removed.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "4. What Happens Next",
    body: <p>We acknowledge requests within 5 business days and complete verified deletions within 30 days. We will confirm by email once your data has been removed from our systems and, where applicable, from our service providers.</p>,
  },
  {
    heading: "5. Data We May Have to Keep",
    body: <p>We may retain limited records where the law requires it — for example invoices, tax records and export documentation — or where needed to resolve a dispute. Retained records are not used for marketing.</p>,
  },
  {
    heading: "6. Related Policies",
    body: (
      <p>
        See our{" "}
        <a href="/privacy-policy" className="text-primary underline underline-offset-4">Privacy Policy</a> for the
        full picture of how we handle personal information.
      </p>
    ),
  },
];

export default function FacebookDataDeletion() {
  return (
    <LegalPageLayout
      title="Facebook Data Deletion Instructions"
      metaTitle="Facebook Data Deletion Instructions | Wonderful Dragon Fruit South Africa"
      metaDescription="Step-by-step instructions to remove Wonderful Dragon Fruit South Africa from your Facebook account and request deletion of the data we received through Facebook."
      canonicalUrl="/data-deletion"
      intro={
        <p>
          If you connected to Wonderful Dragon Fruit South Africa through Facebook or Instagram, this page explains how to
          disconnect and how to request deletion of the data we received. The wording below is placeholder
          content pending review.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
