import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Styx Protocol',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-500 text-sm font-bold hover:text-red-400 mb-8 inline-block">
          &larr; Back to Styx
        </Link>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-12">Version 1.0 &mdash; Effective February 27, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using the Styx Protocol (&ldquo;Service&rdquo;), you agree to these Terms of Service (&ldquo;Terms&rdquo;).
              If you do not agree, do not use the Service. You must be at least 18 years old to use Styx.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              Styx is a peer-audited behavioral accountability platform. Users create behavioral contracts (&ldquo;Oaths&rdquo;)
              backed by financial stakes. Compliance is verified through daily attestations, peer review by the Fury network,
              or automated oracles. Stakes are held in escrow and returned upon successful completion, or forfeited upon failure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Beta Program</h2>
            <p>
              Styx is currently in private beta. During the beta period:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-400">
              <li>Financial stakes use test-money mode and no real funds are at risk</li>
              <li>Features may change, be removed, or become temporarily unavailable</li>
              <li>Data may be reset between beta phases with advance notice</li>
              <li>The Service is provided &ldquo;as is&rdquo; without warranty</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the security of your account credentials. You must provide accurate
              information during registration. One account per person. Account sharing is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Behavioral Contracts (Oaths)</h2>
            <p>
              When you create an Oath, you commit to a specific behavioral goal for a defined period. You acknowledge that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-400">
              <li>Stakes are voluntary and you should only stake amounts you can afford to lose</li>
              <li>Failure to meet your commitment may result in forfeiture of your stake</li>
              <li>Peer reviewers (Furies) make verdict decisions; Styx does not guarantee outcomes</li>
              <li>Grace days are limited (2 per month) and do not roll over</li>
              <li>Three missed attestations result in automatic contract failure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Fury Network (Peer Review)</h2>
            <p>
              As a Fury reviewer, you stake your own credibility. False accusations reduce your accuracy score and may
              result in demotion or suspension. Honeypot injections are used to verify reviewer integrity. Your reviews
              are anonymous to the contract holder.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Financial Terms</h2>
            <p>
              All payment processing is handled by Stripe. Funds are held in escrow (For Benefit Of) accounts managed
              by Styx. Styx is not a bank, investment advisor, or gambling platform. Behavioral stakes are structured
              as commitment devices, not wagers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Health and Safety (Aegis Protocol)</h2>
            <p>
              Styx implements health guardrails including BMI floor enforcement (18.5), weekly weight loss velocity caps (2%),
              and mandatory recovery protocol limits (30 days maximum). These guardrails exist for your safety.
              You must not attempt to circumvent them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Submitting fraudulent proofs or attestations</li>
              <li>Colluding with accountability partners to falsely verify compliance</li>
              <li>Creating multiple accounts to circumvent integrity scores or stake limits</li>
              <li>Using Styx for any purpose that could cause harm to yourself or others</li>
              <li>Attempting to exploit the Fury review system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Dispute Resolution</h2>
            <p>
              Users may dispute verdicts through the in-app dispute process. Disputes are reviewed by senior
              Fury reviewers and/or Styx administrators. Dispute decisions are final. Styx reserves the right
              to override verdicts in cases of clear system error or fraud.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Termination</h2>
            <p>
              You may delete your account at any time through the Settings page. Styx may suspend or terminate
              accounts that violate these Terms. Upon termination, active contracts will be resolved and any
              held funds returned or forfeited per contract terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Styx and its operators shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the Service, including
              but not limited to loss of staked funds due to honest contract failure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via email or
              in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Contact</h2>
            <p>
              Questions about these Terms should be directed to{' '}
              <a href="mailto:legal@styx.protocol" className="text-red-500 hover:text-red-400">legal@styx.protocol</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
