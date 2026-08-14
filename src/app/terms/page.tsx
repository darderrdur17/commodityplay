import Link from "next/link";
import { Reveal } from "@/components/animations";
import { BRAND_EMAIL_LEGAL, BRAND_LEGAL_NAME, BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: "Terms of Service",
  description: `Terms and conditions for using ${BRAND_NAME}.`,
};

export default function TermsPage() {
  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-fg mb-3">Legal</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-fg mb-10">Last updated: 12 June 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using {BRAND_NAME} (&quot;the Service&quot;), operated by {BRAND_LEGAL_NAME} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              {BRAND_NAME} provides educational content, career resources, and community features related to commodity trading careers. Content is for informational and educational purposes only and does not constitute financial, investment, or trading advice.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">3. Membership Tiers</h2>
            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
              <li><strong>Starter (Free):</strong> Access to free resources including glossary, Chapter A preview, and weekly digest subscription.</li>
              <li><strong>Pro (One-time purchase):</strong> Lifetime access to Pro content including full playbook, resume templates, career roadmap, and interview resources.</li>
              <li><strong>Elite (Subscription):</strong> Monthly access to all Pro content plus Elite features including case studies, Desk Channel, Mentor Connect, and job openings.</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Elite subscriptions renew automatically unless cancelled before the renewal date. Pro purchases are non-refundable except where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">4. Account Registration</h2>
            <p className="leading-relaxed">
              You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorised use.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p className="leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed">
              <li>Share account credentials or resell access to the Service</li>
              <li>Reproduce, distribute, or commercially exploit content without permission</li>
              <li>Use Mentor Connect to solicit commercial services or spam mentors</li>
              <li>Attempt to circumvent tier access controls or payment systems</li>
              <li>Upload malicious code or interfere with the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, trademarks, and materials on the Service are owned by {BRAND_NAME} or its licensors. Your membership grants a personal, non-transferable, non-exclusive licence to access content for your own professional development. Resume templates may be used for your personal job applications only.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">7. Mentor Connect</h2>
            <p className="leading-relaxed">
              Mentor responses are provided anonymously by practitioners on a best-effort basis. They do not constitute professional, legal, or financial advice. We do not guarantee response times or accuracy. Mentor credits are non-transferable and expire according to your membership terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that content will result in employment, trading success, or any specific outcome. Commodity markets involve substantial risk; past performance of practitioners featured in case studies is not indicative of future results.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, {BRAND_NAME} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">10. Termination</h2>
            <p className="leading-relaxed">
              We may suspend or terminate your account for violation of these Terms. You may cancel Elite subscriptions at any time through your account settings or by contacting support. Upon termination, access to paid content ceases except where Pro lifetime access has been purchased.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms are governed by the laws of Singapore. Any disputes shall be resolved in the courts of Singapore, unless mandatory consumer protection laws in your jurisdiction require otherwise.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-3">12. Contact</h2>
            <p className="leading-relaxed">
              Questions about these Terms:{" "}
              <a href={`mailto:${BRAND_EMAIL_LEGAL}`} className="text-primary-400 hover:underline">
                {BRAND_EMAIL_LEGAL}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex gap-4 text-sm">
          <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
          <Link href="/" className="text-muted-fg hover:text-gray-800">← Back to home</Link>
        </div>
      </Reveal>
    </div>
  );
}
