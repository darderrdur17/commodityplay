"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FooterNewsletter } from "@/components/footer-newsletter";
import { ContactModal } from "@/components/landing/contact-modal";
import { FOOTER_BOTTOM_SAFE_PADDING } from "@/lib/layout-constants";
import { BRAND_NAME, BRAND_EMAIL_HELLO } from "@/lib/brand";
import { attachmentHref } from "@/lib/content/attachments";
import type { FooterGuidePublic } from "@/lib/content/accessors";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function buildContentsLinks(guides: {
  career: FooterGuidePublic | null;
  sales: FooterGuidePublic | null;
}): FooterLink[] {
  const links: FooterLink[] = [
    { label: "Overview", href: "/" },
    { label: "Full Playbook", href: "/playbook" },
  ];

  if (guides.career?.assetId) {
    links.push({
      label: "Career Guide",
      href: attachmentHref(`/api/content/assets/${guides.career.assetId}`, "view-only"),
      external: true,
    });
  }

  if (guides.sales?.assetId) {
    links.push({
      label: "Sales Guide",
      href: attachmentHref(`/api/content/assets/${guides.sales.assetId}`, "view-only"),
      external: true,
    });
  }

  return links;
}

const COMMUNITY_LINKS: FooterLink[] = [
    { label: "Mentor Connect", href: "/mentor-connect" },
    { label: "Desk Channel", href: "/desk-channel" },
    { label: "Weekly Note", href: "/starter-pack" },
  { label: "Job Board Waitlist", href: "/waitlist" },
  { label: "FAQ", href: "/faq" },
];

const ACCESS_LINKS: FooterLink[] = [
  { label: "Resource Library", href: "/library" },
  { label: "Team Licenses", href: `mailto:${BRAND_EMAIL_HELLO}` },
  { label: "Sign Up", href: "/signup" },
  { label: "Login", href: "/login" },
  { label: "Contact Us", href: "#contact" },
];

export function Footer({
  footerGuides = { career: null, sales: null },
}: {
  footerGuides?: { career: FooterGuidePublic | null; sales: FooterGuidePublic | null };
}) {
  const [contactOpen, setContactOpen] = useState(false);

  const footerLinks = {
    Contents: buildContentsLinks(footerGuides),
    Community: COMMUNITY_LINKS,
    Access: ACCESS_LINKS,
  };

  return (
    <footer className="bg-[#0a0f1a] text-white border-t border-white/10 pt-16">
      <div className="w-full max-w-none px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1fr] gap-9 lg:gap-[52px] pb-14 border-b border-white/10">
          <div>
            <Logo variant="footer" href="/" className="mb-6 sm:mb-8" priority />
            <p className="text-[14.5px] text-white leading-[1.8] max-w-[320px]">
              The definitive guide on commodity trading — for professionals breaking in, and for
              vendors selling into the industry.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 mb-5 mt-1.5">
                {section}
              </p>
              <ul>
                {links.map((link) => (
                  <li key={link.label} className="border-b border-white/10 last:border-b-0">
                    {link.href === "#contact" ? (
                      <button
                        type="button"
                        onClick={() => setContactOpen(true)}
                        className="block w-full text-left py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </button>
                    ) : link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="block py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="block py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FooterNewsletter variant="dark" />

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
