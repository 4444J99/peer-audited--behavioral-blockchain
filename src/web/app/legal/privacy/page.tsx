import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Styx Protocol',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-500 text-sm font-bold hover:text-red-400 mb-8 inline-block">
          &larr; Back to Styx
        </Link>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-12">Version 1.0 &mdash; Effective February 27, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">Account information:</strong> Email address, hashed password, date of birth (optional)</li>
              <li><strong className="text-neutral-200">Behavioral data:</strong> Contract details, attestation records, proof submissions, streak data</li>
              <li><strong className="text-neutral-200">Financial data:</strong> Stripe customer ID, transaction history (payment details are processed and stored by Stripe, not by Styx)</li>
              <li><strong className="text-neutral-200">Review data:</strong> Fury audit verdicts, accuracy scores, honeypot results</li>
              <li><strong className="text-neutral-200">Technical data:</strong> IP address (for geofencing), device type, app version</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Operating the behavioral contract and peer review system</li>
              <li>Processing financial stakes through Stripe escrow</li>
              <li>Calculating and maintaining your integrity score</li>
              <li>Enforcing health guardrails (Aegis Protocol)</li>
              <li>Geofencing compliance for jurisdictional restrictions</li>
              <li>Detecting fraud and ensuring review integrity</li>
              <li>Sending notifications about contracts, attestations, and verdicts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Data Storage and Security</h2>
            <p>
              Your data is stored in PostgreSQL databases with encryption at rest. All API communication uses HTTPS.
              Proof media files are stored in Cloudflare R2 with zero-egress architecture &mdash; files are served only via
              time-limited signed URLs and never leave the storage provider unnecessarily.
            </p>
            <p className="mt-2">
              Passwords are hashed using bcrypt. Authentication uses HttpOnly cookies with CSRF protection.
              All financial data is append-only with a hash-chained audit log (Truth Log).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Peer Review Privacy</h2>
            <p>
              When your proof is submitted for Fury review, reviewers see the proof content but <strong className="text-neutral-200">not
              your identity</strong>. Reviews are anonymized. Your proof media is accessible only via signed URLs that
              expire after the review period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Enterprise (B2B) Data</h2>
            <p>
              If your employer uses Styx Enterprise, aggregated and anonymized behavioral metrics may be shared
              with your organization. Individual contract details, proof content, and personal attestations
              are never shared with your employer. Anonymization uses a salted hash to prevent re-identification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">Stripe:</strong> Payment processing and escrow management</li>
              <li><strong className="text-neutral-200">Cloudflare R2:</strong> Proof media storage</li>
              <li><strong className="text-neutral-200">Google Gemini:</strong> AI features (goal ethics screening, grill-me, ELI5) &mdash; no personal data is sent to AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Data Retention</h2>
            <p>
              Account data is retained while your account is active. The Truth Log (hash-chained audit trail)
              is append-only and retained permanently for financial integrity verification. Upon account deletion,
              personal identifiers are removed but anonymized audit records are retained for compliance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">Access:</strong> View your data through the Profile and Settings pages</li>
              <li><strong className="text-neutral-200">Deletion:</strong> Request account deletion through Settings (GDPR Article 17)</li>
              <li><strong className="text-neutral-200">Export:</strong> Request a copy of your data by contacting us</li>
              <li><strong className="text-neutral-200">Correction:</strong> Update your information through your profile</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Cookies</h2>
            <p>
              Styx uses essential cookies only: an HttpOnly authentication cookie (<code className="text-red-400">styx_auth_token</code>),
              a CSRF protection cookie (<code className="text-red-400">styx_csrf_token</code>), and SSE stream tickets.
              We do not use tracking cookies, analytics cookies, or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Children&rsquo;s Privacy</h2>
            <p>
              Styx is not intended for anyone under 18 years of age. We do not knowingly collect personal
              information from minors. If we discover that a user is under 18, their account will be
              terminated and associated data deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We will notify you of material changes via email or in-app notification at least 14 days
              before they take effect. The current version is always available at this URL.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Contact</h2>
            <p>
              For privacy inquiries, contact{' '}
              <a href="mailto:privacy@styx.protocol" className="text-red-500 hover:text-red-400">privacy@styx.protocol</a>.
            </p>
          </section>

          <section className="border-t border-neutral-800 pt-8">
            <h2 className="text-lg font-bold text-white mb-3">Related Policies</h2>
            <ul className="space-y-2">
              <li><Link href="/legal/terms" className="text-red-500 hover:text-red-400">Terms of Service</Link></li>
              <li><Link href="/legal/rules" className="text-red-500 hover:text-red-400">Contest Official Rules</Link></li>
              <li><Link href="/legal/responsible-use" className="text-red-500 hover:text-red-400">Responsible Use</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
