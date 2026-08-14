import Link from "next/link";
import { Reveal } from "@/components/animations";
import { BRAND_EMAIL_PRIVACY, BRAND_LEGAL_NAME, BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND_NAME} collects, uses, and protects your personal data.`,
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">Legal</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-fg mb-10">Last updated: 12 June 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">1. Who We Are</h2>
            <p className="leading-relaxed">
              {BRAND_LEGAL_NAME} (&quot;{BRAND_NAME}&quot;, &quot;we&quot;, &quot;us&quot;) operates the {BRAND_NAME} website and mobile application. We are the data controller for personal data collected through the Service. Contact:{" "}
              <a href={`mailto:${BRAND_EMAIL_PRIVACY}`} className="text-primary-400 hover:underline">
                {BRAND_EMAIL_PRIVACY}
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">2. Data We Collect</h2>
            <p className="leading-relaxed mb-2">We collect the following categories of personal data:</p>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Account data:</strong> Name, email address, password (hashed), membership tier, track preference, and persona quiz results.</li>
              <li><strong>Payment data:</strong> Processed by Stripe — we receive transaction IDs and subscription status, not full card numbers.</li>
              <li><strong>Usage data:</strong> Chapter progress, quiz results, mentor questions, and pages visited.</li>
              <li><strong>Communications:</strong> Emails you send us and weekly digest subscription preferences.</li>
              <li><strong>Waitlist data:</strong> Email, name, track preference, and GDPR consent timestamp.</li>
              <li><strong>Technical data:</strong> IP address, browser type, and device information via standard server logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li>Provide and personalise the Service (tier access, persona-based recommendations)</li>
              <li>Process payments and manage subscriptions via Stripe</li>
              <li>Send the Email Digest and onboarding emails (with your consent)</li>
              <li>Route Mentor Connect questions to practitioners anonymously</li>
              <li>Notify waitlist members when the job board launches</li>
              <li>Improve the Service through aggregated analytics</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">4. Legal Basis (GDPR)</h2>
            <p className="leading-relaxed mb-2">For users in the EEA/UK, we process data on the following bases:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li><strong>Contract:</strong> Account and payment data to deliver the Service you purchased</li>
              <li><strong>Consent:</strong> Marketing emails, waitlist, and optional public sharing of mentor Q&amp;As</li>
              <li><strong>Legitimate interest:</strong> Service improvement, fraud prevention, and security</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">5. Data Sharing</h2>
            <p className="leading-relaxed mb-2">We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
              <li><strong>Vercel / Neon:</strong> Hosting and database infrastructure</li>
              <li><strong>Resend:</strong> Transactional and digest email delivery</li>
              <li><strong>Google:</strong> Optional OAuth sign-in (if you choose it)</li>
            </ul>
            <p className="leading-relaxed mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              Account data is retained while your account is active and for up to 24 months after deletion for legal and accounting purposes. Payment records are kept for 7 years as required by Singapore tax law. Waitlist entries are retained until the job board launches or you unsubscribe.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="leading-relaxed mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Access a copy of your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Withdraw consent for marketing emails</li>
              <li>Export your data in a portable format</li>
              <li>Object to processing based on legitimate interest</li>
            </ul>
            <p className="leading-relaxed mt-3">
              To exercise these rights, email{" "}
              <a href={`mailto:${BRAND_EMAIL_PRIVACY}`} className="text-primary-400 hover:underline">
                {BRAND_EMAIL_PRIVACY}
              </a>
              . We respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p className="leading-relaxed">
              We use essential cookies for authentication (session management via NextAuth). We do not use third-party advertising cookies. Analytics, if enabled, use privacy-friendly tools that do not track individuals across sites.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">9. Security</h2>
            <p className="leading-relaxed">
              Passwords are hashed with bcrypt. All traffic is encrypted via HTTPS. Database access is restricted to application servers. We conduct regular reviews of our security practices but cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">10. International Transfers</h2>
            <p className="leading-relaxed">
              Data may be processed in Singapore, the United States (Vercel/Stripe infrastructure), and other countries where our service providers operate. We ensure appropriate safeguards (Standard Contractual Clauses) for EEA data transfers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">11. Children</h2>
            <p className="leading-relaxed">
              The Service is not directed at individuals under 18. We do not knowingly collect data from minors. Contact us if you believe a minor has created an account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">12. Changes</h2>
            <p className="leading-relaxed">
              We may update this policy periodically. Material changes will be notified via email or a prominent notice on the Service. Continued use after changes constitutes acceptance.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-sm">
          <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
          <Link href="/" className="text-muted-fg hover:text-gray-800">← Back to home</Link>
        </div>
      </Reveal>
    </div>
  );
}
