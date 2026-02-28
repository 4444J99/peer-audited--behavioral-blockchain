import Link from 'next/link';

export const metadata = {
  title: 'Responsible Use | Styx Protocol',
};

export default function ResponsibleUsePage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-500 text-sm font-bold hover:text-red-400 mb-8 inline-block">
          &larr; Back to Styx
        </Link>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Responsible Use</h1>
        <p className="text-sm text-neutral-500 mb-12">Your well-being matters more than any contract.</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">Our Commitment</h2>
            <p>
              Styx is designed to help people build positive habits through voluntary accountability.
              We take our responsibility seriously: financial commitment devices are powerful tools, and
              power demands safeguards. Every feature we build is evaluated against the question:
              &ldquo;Could this cause harm?&rdquo;
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Healthy Use Guidelines</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-400">
              <li>
                <strong className="text-neutral-300">Stake only what you can afford to lose.</strong>{' '}
                Your financial stake should be meaningful enough to motivate, but never so large that losing
                it would cause financial hardship. If a stake amount feels stressful, it&rsquo;s too high.
              </li>
              <li>
                <strong className="text-neutral-300">Set realistic goals.</strong>{' '}
                Behavioral change is incremental. Start with shorter contract durations and lower stakes.
                Build your integrity score over time. Failure is not a moral judgment &mdash; it&rsquo;s
                information about what&rsquo;s realistic for you right now.
              </li>
              <li>
                <strong className="text-neutral-300">Use grace days when you need them.</strong>{' '}
                Grace days exist because life happens. Using them is not weakness &mdash; it&rsquo;s
                self-awareness. Two per month is your right, not a last resort.
              </li>
              <li>
                <strong className="text-neutral-300">Recovery contracts require extra care.</strong>{' '}
                No-contact recovery contracts deal with emotional situations. If maintaining your contract
                is causing psychological distress, please reach out to a counselor or therapist. Your mental
                health is more important than any contract.
              </li>
              <li>
                <strong className="text-neutral-300">Take breaks between contracts.</strong>{' '}
                The 7-day cool-off period after failure exists for a reason. Use that time to reflect,
                not to immediately re-stake out of frustration.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Built-In Safety Guardrails</h2>
            <p className="mb-3">
              Styx implements automatic protections you cannot override:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong className="text-neutral-300">BMI Floor (18.5):</strong> Weight-loss contracts cannot target underweight goals</li>
              <li><strong className="text-neutral-300">Velocity Cap (2%/week):</strong> Weight-loss rate is limited to prevent starvation-level targets</li>
              <li><strong className="text-neutral-300">Recovery Duration Cap (30 days):</strong> No-contact contracts are limited to 30 days maximum</li>
              <li><strong className="text-neutral-300">Stake Tier Limits:</strong> Your maximum stake is gated by your integrity score history</li>
              <li><strong className="text-neutral-300">Automatic Downscale:</strong> Three strikes trigger automatic stake reduction</li>
              <li><strong className="text-neutral-300">Cool-Off Period:</strong> 7-day mandatory pause after contract failure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Warning Signs</h2>
            <p className="mb-3">
              Please seek support if you experience any of the following:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Staking money you cannot afford to lose</li>
              <li>Feeling anxious, obsessive, or distressed about your contracts</li>
              <li>Using Styx as a substitute for professional medical or psychological treatment</li>
              <li>Creating contracts immediately after failure without reflection</li>
              <li>Hiding your Styx participation from family or partners</li>
              <li>Borrowing money to fund stakes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Styx Is Not a Substitute For</h2>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>Professional therapy or counseling</li>
              <li>Medical treatment for eating disorders or body dysmorphia</li>
              <li>Addiction recovery programs (AA, NA, SMART Recovery)</li>
              <li>Domestic violence support services</li>
              <li>Financial planning or debt counseling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Resources</h2>
            <p className="mb-3">
              If you or someone you know needs help:
            </p>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <strong className="text-neutral-300">National Suicide Prevention Lifeline:</strong>{' '}
                <a href="tel:988" className="text-red-500 hover:text-red-400">988</a> (call or text)
              </li>
              <li>
                <strong className="text-neutral-300">Crisis Text Line:</strong>{' '}
                Text HOME to <span className="text-red-500">741741</span>
              </li>
              <li>
                <strong className="text-neutral-300">SAMHSA National Helpline:</strong>{' '}
                <a href="tel:1-800-662-4357" className="text-red-500 hover:text-red-400">1-800-662-4357</a> (free, 24/7)
              </li>
              <li>
                <strong className="text-neutral-300">National Domestic Violence Hotline:</strong>{' '}
                <a href="tel:1-800-799-7233" className="text-red-500 hover:text-red-400">1-800-799-7233</a>
              </li>
              <li>
                <strong className="text-neutral-300">National Eating Disorders Association:</strong>{' '}
                <a href="tel:1-800-931-2237" className="text-red-500 hover:text-red-400">1-800-931-2237</a>
              </li>
              <li>
                <strong className="text-neutral-300">National Problem Gambling Helpline:</strong>{' '}
                <a href="tel:1-800-522-4700" className="text-red-500 hover:text-red-400">1-800-522-4700</a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact Us</h2>
            <p>
              If you have concerns about your use of Styx or believe the platform is causing harm, contact us at{' '}
              <a href="mailto:safety@styx.protocol" className="text-red-500 hover:text-red-400">safety@styx.protocol</a>.
              We will work with you to pause, modify, or cancel active contracts if your well-being is at risk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
