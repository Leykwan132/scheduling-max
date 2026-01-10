import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../client/components/ui/accordion";
import SectionTitle from "./SectionTitle";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  href?: string;
}

export default function FAQ({ faqs }: { faqs: FAQ[] }) {
  return (
    <div className="mx-auto py-24 max-w-3xl px-6 lg:px-8" id="faq">
      <SectionTitle
        title="Frequently Asked Questions"
        description="Everything you need to know about the lifetime deal"
      />

      <Accordion type="single" collapsible className="w-full space-y-4 mt-12">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={`faq-${faq.id}`}
            className="border-border/50 bg-card/30 backdrop-blur hover:bg-card/50 rounded-lg border px-6 py-2 transition-all duration-200"
          >
            <AccordionTrigger className="text-foreground hover:text-red-400 text-left text-base font-semibold leading-7 transition-colors duration-200">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <div className="flex flex-col items-start justify-between gap-4">
                <p className="text-muted-foreground flex-1 text-base leading-7">
                  {faq.answer}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
