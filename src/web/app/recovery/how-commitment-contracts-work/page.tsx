'use client';

import Link from 'next/link';

export default function CommitmentContractsGuide() {
  return (
    <div className="min-h-screen bg-black text-white font-sans p-8 md:p-16">
      <article className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <span className="text-red-500 text-sm font-bold uppercase tracking-widest">Behavioral Science</span>
          <h1 className="text-4xl font-black tracking-tight">How Commitment Contracts Work — And Why They Beat Willpower</h1>
          <p className="text-neutral-400 text-lg">Commitment contracts are one of the most effective tools in behavioral economics. Here is the science behind why they work and how to use them effectively.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-500 border-b border-neutral-800 pb-6">
            <span>7 min read</span>
            <span>Updated July 2026</span>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">What Is a Commitment Contract?</h2>
          <p className="text-neutral-300 leading-relaxed">
            A commitment contract is a binding agreement you make with yourself — or with another party — that imposes a
            pre-defined cost if you fail to follow through on a stated behavior. The key insight is that the cost is
            specified in advance, when you are rational, not in the moment of temptation when your willpower is depleted.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            The economist Thomas Schelling first described this mechanism in 1960, noting that people often voluntarily
            restrict their own future choices to overcome self-control problems. Odysseus tying himself to the mast is
            the classic example: pre-commitment to prevent future weakness.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">The Science: Why Commitment Contracts Work</h2>
          <p className="text-neutral-300 leading-relaxed">
            Three mechanisms make commitment contracts effective:
          </p>
          <ul className="space-y-4 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">1.</span>
              <div>
                <strong>Loss aversion.</strong> The pain of losing something you already own is approximately twice as powerful as
                the pleasure of gaining the same thing. When you stake your own money, the cost of failure is psychologically
                magnified — making you work harder to avoid the loss than you would to achieve a gain of the same size.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">2.</span>
              <div>
                <strong>Implementation intentions.</strong> Commitment contracts force you to specify exactly when, where, and how
                you will perform a behavior. This specificity — "I will submit proof of no-contact every day at 8 PM" — is far
                more effective than vague intentions like "I will try to stay no-contact."
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">3.</span>
              <div>
                <strong>External verification.</strong> When someone else checks your compliance, you cannot rationalize away a
                failure. The commitment is real because someone impartial judges the outcome.
              </div>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">What Makes a Good Commitment Contract?</h2>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Specific and verifiable:</strong> "I will not contact [person] for 30 days" is good. "I will be better" is not.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Meaningful stake:</strong> The cost of failure must be real enough that you would not willingly pay it.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Third-party enforcement:</strong> Self-administered contracts are too easy to break. An external judge — human or automated — prevents self-deception.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Safety override:</strong> No contract should prevent you from acting in a genuine emergency. Safety always comes first.</span>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Common Pitfalls</h2>
          <ul className="space-y-3 text-neutral-300">
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Too ambitious:</strong> Starting with a 90-day contract when you have never completed 7 days. Build up gradually.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Too vague:</strong> Failing to define what counts as compliance and what counts as violation. Edge cases will be judged against you.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500 mt-1">&#x2022;</span>
              <span><strong>Unrealistic verification:</strong> Choosing proof requirements you cannot realistically produce (e.g., daily video when you work in a sensitive environment).</span>
            </li>
          </ul>
        </section>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-lg">Create Your First Commitment Contract</h3>
          <p className="text-neutral-400 text-sm">
            Styx makes it easy to create, fund, and verify commitment contracts. Choose your terms, stake test money, and
            submit proof. A Fury verifies your compliance. No more lying to yourself.
          </p>
          <Link
            href="/register?source=commitment-contracts"
            className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all"
          >
            Start Your Contract
          </Link>
        </div>
      </article>
    </div>
  );
}
