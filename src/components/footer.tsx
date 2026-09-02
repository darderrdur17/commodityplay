"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FooterNewsletter } from "@/components/footer-newsletter";
import { ContactModal } from "@/components/landing/contact-modal";
import { FOOTER_BOTTOM_SAFE_PADDING } from "@/lib/layout-constants";
import { BRAND_NAME } from "@/lib/brand";
import type { FooterLinkItem, SiteFooterContent } from "@/data/footer-content";

interface Props {
  content: SiteFooterContent;
}

const COLUMN_HEADINGS: Record<keyof SiteFooterContent["columns"], string> = {
  contents: "Contents",
  community: "Community",
  access: "Access",
};

export function Footer({ content }: Props) {
  const [contactOpen, setContactOpen] = useState(false);

  function renderLink(link: FooterLinkItem) {
    const className =
      "block w-full text-left py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors";

    if (link.action === "contact" || link.href === "#contact") {
      return (
        <button type="button" onClick={() => setContactOpen(true)} className={className}>
          {link.label}
        </button>
      );
    }

    if (link.action === "mailto" || link.href.startsWith("mailto:")) {
      return (
        <a href={link.href} className={className.replace("text-left", "")}>
          {link.label}
        </a>
      );
    }

    return (
      <Link href={link.href} className={className.replace("text-left", "")}>
        {link.label}
      </Link>
    );
  }

  return (
    <footer className="bg-[#0a0f1a] text-white border-t border-white/10 pt-16">
      <div className="w-full max-w-none px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1fr] gap-9 lg:gap-[52px] pb-14 border-b border-white/10">
          <div>
            <Logo variant="footer" href="/" className="mb-6 sm:mb-8" priority />
            <p className="text-[14.5px] text-white leading-[1.8] max-w-[320px]">{content.blurb}</p>
          </div>

          {(Object.keys(COLUMN_HEADINGS) as (keyof SiteFooterContent["columns"])[]).map((key) => (
            <div key={key}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 mb-5 mt-1.5">
                {COLUMN_HEADINGS[key]}
              </p>
              <ul>
                {content.columns[key].map((link) => (
                  <li key={`${key}-${link.label}`} className="border-b border-white/10 last:border-b-0">
                    {renderLink(link)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FooterNewsletter variant="dark" copy={content.newsletter} />

        <div
          className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-white/10"
          style={{ paddingBottom: `max(26px, ${FOOTER_BOTTOM_SAFE_PADDING})` }}
        >
          <p className="text-[13px] text-white/60">
            © 2026. {BRAND_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-[18px] text-[13px]">
            <Link
              href="/privacy"
              className="text-white/60 underline decoration-white/20 underline-offset-[3px] hover:text-white hover:decoration-white/40 transition-colors"
            >
              Privacy
            </Link>
            <span className="text-white/20">·</span>
            <Link
              href="/terms"
              className="text-white/60 underline decoration-white/20 underline-offset-[3px] hover:text-white hover:decoration-white/40 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </footer>
  );
}
