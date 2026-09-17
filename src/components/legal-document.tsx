import Link from "next/link";
import { Reveal } from "@/components/animations";
import type { FooterLegalPage } from "@/data/legal-content";

function LegalInline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function LegalBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
        if (isList) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-2 leading-relaxed">
              {lines.map((line, j) => (
                <li key={j}>
                  <LegalInline text={line.replace(/^[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            <LegalInline text={block} />
          </p>
        );
      })}
    </>
  );
}

export function LegalDocument({
  page,
  otherHref,
  otherLabel,
}: {
  page: FooterLegalPage;
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">Legal</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{page.pageTitle}</h1>
        <p className="text-sm text-muted-fg mb-10">Last updated: {page.lastUpdated}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
          {page.sections.map((section, i) => (
            <section key={`${section.heading}-${i}`}>
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">{section.heading}</h2>
              <div className="space-y-3">
                <LegalBody body={section.body} />
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-sm">
          <Link href={otherHref} className="text-primary-400 hover:underline">
            {otherLabel}
          </Link>
          <Link href="/" className="text-muted-fg hover:text-gray-800">
            ← Back to home
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
