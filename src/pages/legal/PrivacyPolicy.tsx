import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Information We Collect",
    body: (
      <>
        <p>We collect information you give us directly and information collected automatically:</p>
        <ul>
          <li>Account and contact details (name, email address, phone number, delivery address).</li>
          <li>Order, quotation and payment records (payments are processed by our payment provider; we do not store card numbers).</li>
          <li>Messages you send us by email, contact form or WhatsApp.</li>
          <li>Technical data such as device type, browser, approximate location and pages viewed.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "2. How We Use Your Information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>Process orders, rooting services, bookings and deliveries.</li>
          <li>Provide customer support and respond to enquiries.</li>
          <li>Send service updates and, where you have opted in, marketing communications.</li>
          <li>Improve the website, our catalogue and our growing guidance.</li>
          <li>Meet legal, tax and export-documentation obligations.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "3. Legal Basis for Processing",
    body: (
      <p>
        Depending on your location we rely on performance of a contract, our legitimate
        interests, your consent, or compliance with a legal obligation. Where consent is the basis, you may
        withdraw it at any time.
      </p>
    ),
  },
  {
    heading: "4. Cookies and Analytics",
    body: (
      <p>
        We use cookies and similar technologies for essential site functions and, with your
        consent, for analytics and advertising measurement. See our{" "}
        <a href="/cookie-policy" className="text-primary underline underline-offset-4">Cookie Policy</a> for detail
        and controls.
      </p>
    ),
  },
  {
    heading: "5. Sharing Your Information",
    body: (
      <>
        <p>We share personal information only as needed with:</p>
        <ul>
          <li>Payment providers, to process transactions.</li>
          <li>Courier and logistics partners, to deliver plants and packages.</li>
          <li>Email, hosting and analytics service providers acting on our instructions.</li>
          <li>Authorities where we are legally required to do so.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    heading: "6. International Transfers",
    body: (
      <p>
        We supply customers across Africa and internationally, so your information may be
        processed in countries other than your own. Where this happens we take reasonable steps to ensure an
        appropriate level of protection.
      </p>
    ),
  },
  {
    heading: "7. Data Retention",
    body: (
      <p>
        We keep personal information only as long as needed for the purposes described above, or
        as required by law (for example, tax and export records). Marketing contact details are removed on
        request.
      </p>
    ),
  },
  {
    heading: "8. Your Rights",
    body: (
      <>
        <p>Subject to applicable law, you may request to:</p>
        <ul>
          <li>Access a copy of the personal information we hold about you.</li>
          <li>Correct information that is inaccurate or incomplete.</li>
          <li>Delete your information where we have no ongoing lawful reason to keep it.</li>
          <li>Object to or restrict certain processing, including direct marketing.</li>
        </ul>
        <p>
          To exercise a right, email{" "}
          <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
            admin@proagrisa.co.za
          </a>
          .
        </p>
      </>
    ),
  },
  {
    heading: "9. Security",
    body: (
      <p>
        We use encrypted connections, access controls and reputable service providers to protect
        personal information. No system is perfectly secure, so please use a strong, unique password for your
        account.
      </p>
    ),
  },
  {
    heading: "10. Children",
    body: (
      <p>Our services are intended for adults and business buyers. We do not knowingly collect information from children.</p>
    ),
  },
  {
    heading: "11. Changes to This Policy",
    body: <p>We may update this policy from time to time. Material changes will be posted on this page with a new date.</p>,
  },
  {
    heading: "12. Contact Us",
    body: (
      <p>
        Privacy questions or requests:{" "}
        <a href="mailto:admin@proagrisa.co.za" className="text-primary underline underline-offset-4">
          admin@proagrisa.co.za
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      metaTitle="Privacy Policy | Wonderful Dragon Fruit South Africa"
      metaDescription="How Wonderful Dragon Fruit South Africa collects, uses, shares and protects personal information, and how you can access, correct or delete your data."
      canonicalUrl="/privacy-policy"
      intro={
        <p>
          This Privacy Policy explains how Wonderful Dragon Fruit South Africa handles personal information collected through
          this website, our orders and quotations, and our customer support channels. The wording below is
          placeholder content pending legal review.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
