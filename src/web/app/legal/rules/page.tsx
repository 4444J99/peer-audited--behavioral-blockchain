import Link from 'next/link';

export const metadata = {
  title: 'Contest Official Rules | Styx Protocol',
};

export default function ContestRulesPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-500 text-sm font-bold hover:text-red-400 mb-8 inline-block">
          &larr; Back to Styx
        </Link>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Contest Official Rules</h1>
        <p className="text-sm text-neutral-500 mb-12">Version 1.0 &mdash; Effective February 27, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Sponsor</h2>
            <p>
              Styx Protocol (&ldquo;Sponsor&rdquo;) operates a peer-audited behavioral accountability platform.
              Behavioral contracts (&ldquo;Oaths&rdquo;) are skill-based commitment challenges, not sweepstakes
              or games of chance. Outcomes are determined by participant conduct as verified through daily
              attestations and peer review.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Eligibility</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Open to legal residents of the United States (excluding jurisdictions where prohibited)</li>
              <li>Participants must be 18 years of age or older at the time of registration</li>
              <li>Employees and immediate family members of Sponsor are ineligible for monetary stakes</li>
              <li>One account per person; duplicate accounts result in disqualification and forfeiture</li>
              <li>Participants must provide accurate registration information and maintain account security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How Behavioral Contracts Work</h2>
            <p className="mb-3">
              Behavioral contracts are self-initiated, voluntary commitment devices. The participant, not the Sponsor,
              defines the behavioral goal, selects the duration, and chooses the financial stake.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-neutral-400">
              <li>
                <strong className="text-neutral-300">Contract Creation:</strong> Participant selects an oath category
                (Biological, Cognitive, Professional, Creative, Environmental, Character, or Recovery), defines their
                commitment, sets a duration (1&ndash;365 days, 30-day max for Recovery), and stakes a financial amount
                within their tier limit.
              </li>
              <li>
                <strong className="text-neutral-300">Daily Attestation (Recovery):</strong> Recovery contracts require
                daily attestation confirming ongoing compliance. Three missed attestations result in automatic failure.
                Two grace days per month are permitted.
              </li>
              <li>
                <strong className="text-neutral-300">Proof Submission (Other Categories):</strong> Participants submit
                photographic, video, sensor, or text-based proof of compliance for peer review.
              </li>
              <li>
                <strong className="text-neutral-300">Peer Review:</strong> Anonymous peer reviewers (&ldquo;Furies&rdquo;)
                evaluate submitted proofs. A consensus mechanism determines verdict. Reviewers who submit false
                accusations forfeit their own stakes.
              </li>
              <li>
                <strong className="text-neutral-300">Resolution:</strong> Upon successful completion, the participant&rsquo;s
                stake is returned in full. Upon failure or forfeiture, the stake is redistributed per platform policy.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Determination of Results</h2>
            <p>
              Outcomes are determined by the participant&rsquo;s own conduct as assessed through objective verification
              methods (attestations, sensor data, peer review). Styx behavioral contracts are predominantly
              skill-based: success depends on the participant&rsquo;s discipline and follow-through, not chance.
              The Sponsor does not control, influence, or benefit from participant failure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Financial Stakes and Prizes</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Stakes are voluntary commitment deposits, not entry fees for a game of chance</li>
              <li>Stake tiers are determined by participant integrity score, ranging from $0 (restricted) to unlimited (Whale tier)</li>
              <li>During the Phase 1 beta, all stakes use test-money and no real funds are at risk</li>
              <li>All financial processing is handled by Stripe through For Benefit Of (FBO) escrow accounts</li>
              <li>Styx is not a bank, money transmitter, or gambling operator</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Health and Safety Guardrails</h2>
            <p>
              The Aegis Protocol enforces safety limits including a BMI floor of 18.5 for weight-related contracts,
              a 2% weekly weight-loss velocity cap, and a 30-day maximum for recovery contracts. These guardrails
              are mandatory and cannot be overridden by participants.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Dispute Resolution</h2>
            <p>
              Participants may dispute verdicts through the in-app dispute process within 7 days of verdict delivery.
              Disputes are reviewed by senior peer reviewers and/or platform administrators. The Sponsor&rsquo;s
              decision on disputed outcomes is final and binding. Frivolous or bad-faith disputes may result in
              account penalties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Jurisdictional Restrictions</h2>
            <p>
              Styx operates a three-tier geofencing system based on state wagering and contest laws.
              Certain features may be restricted or unavailable in specific jurisdictions. Participants
              are responsible for ensuring their use of Styx complies with local laws. Styx blocks
              access from jurisdictions classified as Tier 3 (prohibited).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Intellectual Property</h2>
            <p>
              Participants retain ownership of all proof media they submit. By submitting proof, participants grant
              Styx a limited, non-exclusive license to store, process, and display submissions solely for the
              purpose of contract verification. All submissions are stored in encrypted, zero-egress storage
              and served only via signed URLs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              The Sponsor is not responsible for: technical malfunctions; lost, late, or misdirected submissions;
              unauthorized access to participant accounts; or any injury, loss, or damage arising from participation.
              Participants acknowledge that behavioral contracts involve voluntary risk and that forfeiture of
              stakes upon failure is an expected outcome of the commitment device mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Privacy</h2>
            <p>
              Participant information is collected and used in accordance with our{' '}
              <Link href="/legal/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link>.
              Proof submissions are not shared publicly. Peer reviewers see only anonymized submissions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Modifications</h2>
            <p>
              The Sponsor reserves the right to modify, suspend, or terminate any behavioral contract category
              or these Official Rules at any time for any reason, including fraud prevention, regulatory
              compliance, or force majeure. Material changes will be communicated via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Governing Law</h2>
            <p>
              These Official Rules are governed by the laws of the State of Delaware, without regard to
              conflict of law provisions. Any disputes shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Contact</h2>
            <p>
              Questions about these Official Rules should be directed to{' '}
              <a href="mailto:legal@styx.protocol" className="text-red-500 hover:text-red-400">legal@styx.protocol</a>.
            </p>
          </section>

          <section className="border-t border-neutral-800 pt-8">
            <h2 className="text-lg font-bold text-white mb-3">Related Policies</h2>
            <ul className="space-y-2">
              <li><Link href="/legal/terms" className="text-red-500 hover:text-red-400">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link></li>
              <li><Link href="/legal/responsible-use" className="text-red-500 hover:text-red-400">Responsible Use</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
