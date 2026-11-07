import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQSchema } from './FAQSchema';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  /** Section heading (visible H2). */
  title?: string;
  /** Optional supporting copy under the heading. */
  description?: string;
  /** Q&A pairs — also emitted as FAQPage JSON-LD for Google rich results. */
  faqs: FAQItem[];
  /** Constrain width / spacing — default is centered max-w-3xl. */
  className?: string;
}

/**
 * Visible FAQ accordion + matching FAQPage structured data.
 * Use on pages where Q&A meaningfully helps the user AND ranks for
 * long-tail "people also ask" queries.
 */
export function FAQSection({
  title = 'Frequently Asked Questions',
  description,
  faqs,
  className = '',
}: FAQSectionProps) {
  if (!faqs.length) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className={`container mx-auto px-4 py-12 max-w-3xl ${className}`}
    >
      <FAQSchema faqs={faqs} />
      <header className="mb-6 text-center">
        <h2
          id="faq-heading"
          className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3"
        >
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground text-base md:text-lg">{description}</p>
        )}
      </header>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-medium text-base md:text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/90 leading-relaxed text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
