import { BRAND_EMAIL_LEGAL, BRAND_EMAIL_PRIVACY, BRAND_LEGAL_NAME, BRAND_NAME } from "@/lib/brand";

export interface LegalSection {
  heading: string;
  body: string;
}

export interface FooterLegalPage {
  /** Footer bar label (e.g. Privacy, Terms of Use). */
  label: string;
  /** Footer href — keep `/privacy` or `/terms` unless you intentionally change the URL. */
  href: string;
  pageTitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export interface FooterLegalPages {
  privacy: FooterLegalPage;
  terms: FooterLegalPage;
}

export const DEFAULT_PRIVACY_PAGE: FooterLegalPage = {
  label: "Privacy",
  href: "/privacy",
  pageTitle: "Privacy Policy",
  lastUpdated: "12 June 2025",
  sections: [
    {
      heading: "1. Who We Are",
      body: `${BRAND_LEGAL_NAME} ("${BRAND_NAME}", "we", "us") operates the ${BRAND_NAME} website and mobile application. We are the data controller for personal data collected through the Service. Contact: ${BRAND_EMAIL_PRIVACY}`,
    },
    {
      heading: "2. Data We Collect",
      body: `We collect the following categories of personal data:\n\n- **Account data:** Name, email address, password (hashed), membership tier, track preference, and persona quiz results.\n- **Payment data:** Processed by Stripe — we receive transaction IDs and subscription status, not full card numbers.\n- **Usage data:** Chapter progress, quiz results, mentor questions, and pages visited.\n- **Communications:** Emails you send us and weekly digest subscription preferences.\n- **Waitlist data:** Email, name, track preference, and GDPR consent timestamp.\n- **Technical data:** IP address, browser type, and device information via standard server logs.`,
    },
    {
      heading: "3. How We Use Your Data",
      body: `- Provide and personalise the Service (tier access, persona-based recommendations)\n- Process payments and manage subscriptions via Stripe\n- Send the Email Digest and onboarding emails (with your consent)\n- Route Mentor Connect questions to practitioners anonymously\n- Notify waitlist members when the job board launches\n- Improve the Service through aggregated analytics\n- Comply with legal obligations`,
    },
    {
      heading: "4. Legal Basis (GDPR)",
      body: `For users in the EEA/UK, we process data on the following bases:\n\n- **Contract:** Account and payment data to deliver the Service you purchased\n- **Consent:** Marketing emails, waitlist, and optional public sharing of mentor Q&As\n- **Legitimate interest:** Service improvement, fraud prevention, and security`,
    },
    {
      heading: "5. Data Sharing",
      body: `We share data only with:\n\n- **Stripe:** Payment processing (PCI-DSS compliant)\n- **Vercel / Neon:** Hosting and database infrastructure\n- **Resend:** Transactional and digest email delivery\n- **Google:** Optional OAuth sign-in (if you choose it)\n\nWe do not sell your personal data to third parties.`,
    },
    {
      heading: "6. Data Retention",
      body: `Account data is retained while your account is active and for up to 24 months after deletion for legal and accounting purposes. Payment records are kept for 7 years as required by Singapore tax law. Waitlist entries are retained until the job board launches or you unsubscribe.`,
    },
    {
      heading: "7. Your Rights",
      body: `Depending on your location, you may have the right to:\n\n- Access a copy of your personal data\n- Correct inaccurate data\n- Delete your account and associated data\n- Withdraw consent for marketing emails\n- Export your data in a portable format\n- Object to processing based on legitimate interest\n\nTo exercise these rights, email ${BRAND_EMAIL_PRIVACY}. We respond within 30 days.`,
    },
    {
      heading: "8. Cookies",
      body: `We use essential cookies for authentication (session management via NextAuth). We do not use third-party advertising cookies. Analytics, if enabled, use privacy-friendly tools that do not track individuals across sites.`,
    },
    {
      heading: "9. Security",
      body: `Passwords are hashed with bcrypt. All traffic is encrypted via HTTPS. Database access is restricted to application servers. We conduct regular reviews of our security practices but cannot guarantee absolute security.`,
    },
    {
      heading: "10. International Transfers",
      body: `Data may be processed in Singapore, the United States (Vercel/Stripe infrastructure), and other countries where our service providers operate. We ensure appropriate safeguards (Standard Contractual Clauses) for EEA data transfers.`,
    },
    {
      heading: "11. Children",
      body: `The Service is not directed at individuals under 18. We do not knowingly collect data from minors. Contact us if you believe a minor has created an account.`,
    },
    {
      heading: "12. Changes",
      body: `We may update this policy periodically. Material changes will be notified via email or a prominent notice on the Service. Continued use after changes constitutes acceptance.`,
    },
  ],
};

export const DEFAULT_TERMS_PAGE: FooterLegalPage = {
  label: "Terms",
  href: "/terms",
  pageTitle: "Terms of Service",
  lastUpdated: "12 June 2025",
  sections: [
    {
      heading: "1. Agreement to Terms",
      body: `By accessing or using ${BRAND_NAME} ("the Service"), operated by ${BRAND_LEGAL_NAME} ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.`,
    },
    {
      heading: "2. Description of Service",
      body: `${BRAND_NAME} provides educational content, career resources, and community features related to commodity trading careers. Content is for informational and educational purposes only and does not constitute financial, investment, or trading advice.`,
    },
    {
      heading: "3. Membership Tiers",
      body: `- **Starter (Free):** Access to free resources including glossary, Chapter A preview, and weekly digest subscription.\n- **Pro (One-time purchase):** Lifetime access to Pro content including full playbook, resume templates, career roadmap, and interview resources.\n- **Elite (Subscription):** Monthly access to all Pro content plus Elite features including case studies, Desk Channel, Mentor Connect, and job openings.\n\nElite subscriptions renew automatically unless cancelled before the renewal date. Pro purchases are non-refundable except where required by applicable law.`,
    },
    {
      heading: "4. Account Registration",
      body: `You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorised use.`,
    },
    {
      heading: "5. Acceptable Use",
      body: `You agree not to:\n\n- Share account credentials or resell access to the Service\n- Reproduce, distribute, or commercially exploit content without permission\n- Use Mentor Connect to solicit commercial services or spam mentors\n- Attempt to circumvent tier access controls or payment systems\n- Upload malicious code or interfere with the Service`,
    },
    {
      heading: "6. Intellectual Property",
      body: `All content, trademarks, and materials on the Service are owned by ${BRAND_NAME} or its licensors. Your membership grants a personal, non-transferable, non-exclusive licence to access content for your own professional development. Resume templates may be used for your personal job applications only.`,
    },
    {
      heading: "7. Mentor Connect",
      body: `Mentor responses are provided anonymously by practitioners on a best-effort basis. They do not constitute professional, legal, or financial advice. We do not guarantee response times or accuracy. Mentor credits are non-transferable and expire according to your membership terms.`,
    },
    {
      heading: "8. Disclaimer of Warranties",
      body: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that content will result in employment, trading success, or any specific outcome. Commodity markets involve substantial risk; past performance of practitioners featured in case studies is not indicative of future results.`,
    },
    {
      heading: "9. Limitation of Liability",
      body: `To the maximum extent permitted by law, ${BRAND_NAME} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.`,
    },
    {
      heading: "10. Termination",
      body: `We may suspend or terminate your account for violation of these Terms. You may cancel Elite subscriptions at any time through your account settings or by contacting support. Upon termination, access to paid content ceases except where Pro lifetime access has been purchased.`,
    },
    {
      heading: "11. Governing Law",
      body: `These Terms are governed by the laws of Singapore. Any disputes shall be resolved in the courts of Singapore, unless mandatory consumer protection laws in your jurisdiction require otherwise.`,
    },
    {
      heading: "12. Contact",
      body: `Questions about these Terms: ${BRAND_EMAIL_LEGAL}`,
    },
  ],
};

export const DEFAULT_LEGAL_PAGES: FooterLegalPages = {
  privacy: DEFAULT_PRIVACY_PAGE,
  terms: DEFAULT_TERMS_PAGE,
};

function normalizeLegalPage(saved: Partial<FooterLegalPage> | undefined, fallback: FooterLegalPage): FooterLegalPage {
  const sections = Array.isArray(saved?.sections)
    ? saved.sections
        .map((section) => ({
          heading: section?.heading?.trim() ?? "",
          body: section?.body?.trim() ?? "",
        }))
        .filter((section) => section.heading || section.body)
    : [];
  return {
    label: saved?.label?.trim() || fallback.label,
    href: saved?.href?.trim() || fallback.href,
    pageTitle: saved?.pageTitle?.trim() || fallback.pageTitle,
    lastUpdated: saved?.lastUpdated?.trim() || fallback.lastUpdated,
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

export function normalizeLegalPages(saved?: Partial<FooterLegalPages> | null): FooterLegalPages {
  return {
    privacy: normalizeLegalPage(saved?.privacy, DEFAULT_PRIVACY_PAGE),
    terms: normalizeLegalPage(saved?.terms, DEFAULT_TERMS_PAGE),
  };
}
