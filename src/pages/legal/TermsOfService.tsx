import { LegalPageLayout, type LegalSection } from "@/components/legal/LegalPageLayout";

const SECTIONS: LegalSection[] = [
  {
    heading: "1. Acceptance of These Terms",
    body: <p>By using this website, placing an order or booking a service, you agree to these Terms of Service. If you do not agree, please do not use the website.</p>,
  },
  {
    heading: "2. Who We Are",
    body: <p>Wonderful Dragon Fruit South Africa (DFSA), operated by Healthy Fields, supplies dragon fruit cuttings, rooted plants, commercial farm packages, algae cultures, fermentation supplies, training, consultations and related services in South Africa and internationally.</p>,
  },
  {
    heading: "3. Orders, Quotations and Pricing",
    body: (
      <>
        <p>Prices are quoted in South African Rand (ZAR) unless stated otherwise.</p>
        <ul>
          <li>Orders are confirmed once payment has cleared.</li>
          <li>Stock levels are dynamic; we may propose a like-for-like cultivar substitution with your consent.</li>
          <li>Quotations are valid for the period stated on the document.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "4. Payment",
    body: <p>Payments are handled by our third-party payment providers (including PayFast, PayPal and Yoco). Orders are only prepared and dispatched once payment is verified as successful by the provider and confirmed on our side.</p>,
  },
  {
    heading: "5. Shipping, Delivery and Export Documents",
    body: (
      <>
        <p>
          Domestic and cross-border deliveries are handled by our courier partners. Shipping is always
          quoted and charged separately on every order — <strong>we do not offer free shipping at any
          order value, ever.</strong>
        </p>
        <p>
          Cross-border shipments may require phytosanitary and inspection documentation at additional
          cost, and import permits are the buyer's responsibility.
        </p>
      </>
    ),
  },
  {
    heading: "6. Plant Material and Growing Results",
    body: <p>Plants are living products. We inspect material before dispatch, but growth outcomes depend on climate, soil, irrigation and management, and cannot be guaranteed.</p>,
  },
  {
    heading: "7. Returns, Refunds and Replacements",
    body: (
      <>
        <p>
          <strong>DFSA does not offer cash refunds on any product or service.</strong>
        </p>
        <p>
          Claims for damaged or non-viable plants must be lodged within 7 days of receipt with
          photographic evidence. Approved claims are resolved by replacement or store credit at our
          discretion. Custom commercial orders are non-refundable once propagation has begun.
          Consultations, training and memberships are non-refundable once delivered or consumed.
        </p>
      </>
    ),
  },
  {
    heading: "8. Services, Training and Memberships",
    body: <p>Consultations, training and association memberships are confirmed on payment. Cancellations more than 7 days before the scheduled date receive a full credit; later cancellations may incur a fee. Services already delivered are not refundable and not creditable.</p>,
  },
  {
    heading: "9. Acceptable Use of the Website",
    body: <p>You may not misuse the site, attempt unauthorised access, scrape content at scale, or submit unlawful or misleading content. See our Community Guidelines for content standards.</p>,
  },
  {
    heading: "10. Intellectual Property",
    body: <p>Website content, photography, guides and branding belong to Wonderful Dragon Fruit South Africa or its licensors and may not be reproduced without permission. See our Copyright Policy.</p>,
  },
  {
    heading: "11. Limitation of Liability",
    body: <p>To the extent permitted by law, our liability is limited to the amount paid for the affected order or service. We are not liable for indirect or consequential loss, including lost harvests or profits.</p>,
  },
  {
    heading: "12. Governing Law and Disputes",
    body: <p>These terms are governed by the laws of the Republic of South Africa. Disputes are referred first to good-faith negotiation, then mediation, before litigation in a competent South African court.</p>,
  },
  {
    heading: "13. Changes and Contact",
    body: (
      <p>
        We may update these terms; the current version always appears on this page. Questions:{" "}
        <a href="mailto:orders@proagrisa.co.za" className="text-primary underline underline-offset-4">
          orders@proagrisa.co.za
        </a>
        .
      </p>
    ),
  },
];

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      metaTitle="Terms of Service | Wonderful Dragon Fruit South Africa"
      metaDescription="The terms governing orders, payments, delivery, services and website use for Wonderful Dragon Fruit South Africa customers in Africa and worldwide."
      canonicalUrl="/terms-of-service"
      intro={
        <p>
          These Terms of Service govern your use of this website and the supply of dragon fruit plants,
          cuttings, commercial packages, training and consulting services by Wonderful Dragon Fruit South Africa.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
