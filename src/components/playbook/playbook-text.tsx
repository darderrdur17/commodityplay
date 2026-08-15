import React from "react";
import Link from "next/link";

/** Render playbook copy — `**term**` markers become colored glossary links. */
export function PlaybookText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Link
            key={i}
            href={`/glossary?q=${encodeURIComponent(part.trim())}`}
            className="font-bold text-primary-400 hover:text-primary-800 hover:underline underline-offset-2"
          >
            {part}
          </Link>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}
