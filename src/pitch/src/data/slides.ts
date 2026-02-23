export interface ContentBlock {
  type: 'stat' | 'bullets' | 'callout' | 'flow' | 'columns';
  data: StatBlock | BulletBlock | CalloutBlock | FlowBlock | ColumnBlock;
}

export interface StatBlock {
  items: { value: string; label: string; source?: string }[];
}

export interface BulletBlock {
  title?: string;
  items: string[];
}

export interface CalloutBlock {
  title: string;
  body: string;
}

export interface FlowBlock {
  steps: string[];
}

export interface ColumnBlock {
  columns: { title: string; items: string[] }[];
}

export interface ToughQuestion {
  question: string;
  answer: string;
}

export interface SlideData {
  id: number;
  title: string;
  subtitle?: string;
  contentBlocks: ContentBlock[];
  eli5: string;
  toughQuestions: ToughQuestion[];
  sketch: string;
}

export const slides: SlideData[] = [
  {
    id: 1,
    title: 'STYX',
    subtitle: 'The Blockchain of Truth',
    contentBlocks: [
      {
        type: 'stat',
        data: {
          items: [
            { value: '$50B', label: 'Market by 2035', source: 'Grand View Research' },
            { value: '\u03BB = 1.955', label: 'Loss Aversion Coefficient', source: 'Tversky & Kahneman' },
            { value: '327', label: 'Tests, 5 Platforms', source: 'Monorepo CI' },
          ],
        } satisfies StatBlock,
      },
    ],
    eli5: 'Imagine you promise to exercise every day, but you also put $50 in a jar. If you keep your promise, you get it back. If you don\u2019t, strangers on the internet get to take your money. That fear of losing cash is way more powerful than any gold star or streak badge. That\u2019s Styx \u2014 it turns \u201CI should\u201D into \u201CI must.\u201D',
    toughQuestions: [
      {
        question: 'Why would anyone voluntarily risk losing money?',
        answer: 'Because loss aversion is the most powerful behavioral force in economics. Kahneman & Tversky proved the pain of losing $50 feels like gaining $97.75. Users don\u2019t sign up despite the risk \u2014 they sign up because of it. The financial stake is the product.',
      },
      {
        question: 'How is this different from StickK or Beeminder?',
        answer: 'StickK relies on self-reporting and charity donations. Beeminder uses automatic data but charges subscription fees. Styx combines decentralized peer auditing (no self-reporting), real escrow (money at actual risk), and a bounty economy that scales moderation to zero cost.',
      },
    ],
    sketch: 'titleParticles',
  },
  {
    id: 2,
    title: 'The Problem',
    subtitle: 'The Intention-Behavior Gap',
    contentBlocks: [
      {
        type: 'stat',
        data: {
          items: [
            { value: '92%', label: 'Quit within 30 days', source: 'J. Consumer Psychology, 2020' },
            { value: '$0', label: 'Real stakes in existing apps' },
            { value: '73%', label: 'Self-reporting inflation rate', source: 'Baumeister et al.' },
          ],
        } satisfies StatBlock,
      },
      {
        type: 'callout',
        data: {
          title: 'The Oracle Problem',
          body: 'Every productivity app relies on self-reporting to verify real-world actions. The moment you attach a reward to self-reporting, users inflate, fabricate, and game the system. Without an external verification oracle, the feedback loop is broken from day one.',
        } satisfies CalloutBlock,
      },
    ],
    eli5: 'Think about a fitness app that gives you a badge for \u201Ccompleting\u201D a workout. Did you actually work out? The app has no idea \u2014 you pressed a button. That\u2019s the Oracle Problem. Every app trusts you to be honest, and study after study shows we\u2019re not. 92% of people quit because the app has no teeth.',
    toughQuestions: [
      {
        question: 'Isn\u2019t 92% dropout a problem with motivation, not the app?',
        answer: 'That\u2019s exactly the point. Motivation is unreliable \u2014 it\u2019s a feeling, not a system. Styx replaces motivation with mechanism. Financial loss aversion is 1.955x more powerful than reward-seeking. We don\u2019t need users to stay motivated; we need them to stay afraid of losing money.',
      },
      {
        question: 'How do you know self-reporting inflation is really 73%?',
        answer: 'Baumeister\u2019s meta-analysis on self-regulation failure, combined with specific studies on fitness app data accuracy (Consolvo et al., 2006). When money is on the line, self-report accuracy drops further because the incentive to lie increases proportionally.',
      },
    ],
    sketch: 'retentionCurve',
  },
  {
    id: 3,
    title: 'The Solution',
    subtitle: 'Financial Escrow & Loss Aversion',
    contentBlocks: [
      {
        type: 'flow',
        data: {
          steps: [
            'User stakes $',
            'Escrow holds funds',
            'Complete \u2192 Full refund',
            'Fail \u2192 Stake forfeited',
          ],
        } satisfies FlowBlock,
      },
      {
        type: 'stat',
        data: {
          items: [
            { value: '\u03BB 1.955', label: 'Loss \u2248 2\u00D7 gain in perceived value', source: 'Prospect Theory' },
            { value: '$5', label: 'Onboarding bonus (Endowed Progress)', source: 'Nunes & Dreze, 2006' },
          ],
        } satisfies StatBlock,
      },
      {
        type: 'callout',
        data: {
          title: 'Endowed Progress Effect',
          body: 'The moment a user funds their account, Styx grants a $5 micro-bonus \u2014 artificial advancement toward their goal. Research shows this dramatically increases completion rates (Nunes & Dreze car wash study: 34% \u2192 82% completion). It also cuts customer acquisition cost to near-zero.',
        } satisfies CalloutBlock,
      },
    ],
    eli5: 'You put $50 into a digital vault. If you do what you promised, you get all $50 back. If you skip, you lose it \u2014 and losing $50 hurts almost twice as much as finding $50 feels good. Plus, the app gives you a free $5 head start, which makes you feel like you\u2019re already winning and way less likely to quit.',
    toughQuestions: [
      {
        question: 'What happens if someone can\u2019t afford to lose their stake?',
        answer: 'Styx uses a tiered system. New users start at Micro Stakes (max $20). The Aegis Protocol prevents unsafe goals (BMI floor, velocity caps). Grace days (2/month) provide legitimate escape valves. And the $5 onboarding bonus means users\u2019 first contract is partially house-funded.',
      },
      {
        question: 'If everyone succeeds, where does revenue come from?',
        answer: 'High completion rates are a feature, not a bug. Revenue comes from the 15% house cut on liquidated stakes (failures), enterprise SaaS licensing (B2B), and $5 appeal fees. Even at 80% success rate, the 20% failure pool at scale generates significant revenue.',
      },
    ],
    sketch: 'escrowGravity',
  },
  {
    id: 4,
    title: 'Core Innovation',
    subtitle: 'The Fury Bounty Network',
    contentBlocks: [
      {
        type: 'bullets',
        data: {
          title: 'How It Works',
          items: [
            'User uploads verification media (photo/video)',
            'Media is anonymized and routed to 3 independent auditors',
            'Furies review evidence and vote: PASS or FAIL',
            'Consensus required \u2014 2/3 majority decides outcome',
            'Caught cheating? Stake liquidated, bounty paid to Furies',
          ],
        } satisfies BulletBlock,
      },
      {
        type: 'stat',
        data: {
          items: [
            { value: '$2.00', label: 'Auditor stake per review' },
            { value: '0', label: 'Internal moderators needed' },
            { value: '\u221E', label: 'Self-policing at scale' },
          ],
        } satisfies StatBlock,
      },
    ],
    eli5: 'Instead of hiring referees, we crowdsource them. Three random strangers review your proof. If they catch you cheating, they get paid from your forfeited money. It\u2019s like a neighborhood watch, but everyone has a financial incentive to be honest. The Furies also stake $2 per review, so false accusations cost them too.',
    toughQuestions: [
      {
        question: 'What prevents Furies from colluding or being unfair?',
        answer: 'Three mechanisms: (1) Anonymous routing \u2014 Furies don\u2019t know who they\u2019re auditing or who the other auditors are. (2) Skin in the game \u2014 false accusations cost Furies 3x in their accuracy score. (3) After 10 audits, any Fury below 80% accuracy is demoted. The system self-corrects.',
      },
      {
        question: 'How do you prevent the system from running out of auditors?',
        answer: 'Bounty economics. Furies earn a direct cash payout from forfeited stakes. As the user base grows, so does the bounty pool. It\u2019s a two-sided marketplace: more users = more stakes = more bounties = more Furies. The incentive loop is self-reinforcing.',
      },
    ],
    sketch: 'furyNetwork',
  },
  {
    id: 5,
    title: 'Legal & Regulatory Moat',
    subtitle: 'The Aegis Protocol',
    contentBlocks: [
      {
        type: 'columns',
        data: {
          columns: [
            {
              title: 'FBO Accounts',
              items: [
                'Funds held "For Benefit Of" the user',
                'Styx never touches user money directly',
                'No Money Transmitter License required',
                'Enterprise payment processor handles flow',
              ],
            },
            {
              title: 'Skill-Based Contest',
              items: [
                'Outcomes depend on personal effort, not chance',
                'Legally distinct from gambling in all 50 states',
                'Goals must be verifiable and effort-dependent',
                'No house edge on randomized outcomes',
              ],
            },
            {
              title: 'Aegis Protocol',
              items: [
                'BMI floor: 18.5 (prevents eating disorders)',
                'Max weight loss: 2%/week velocity cap',
                'Hardcoded biological guardrails',
                'Preempts FTC consumer harm scrutiny',
              ],
            },
          ],
        } satisfies ColumnBlock,
      },
    ],
    eli5: 'Three legal shields protect us. First, we never hold your money \u2014 a bank does (like how PayPal works). Second, this isn\u2019t gambling because you control the outcome through effort \u2014 no dice, no luck. Third, we built health safety limits directly into the code so nobody can set dangerous goals. Regulators can\u2019t come after a platform that protects users better than they would.',
    toughQuestions: [
      {
        question: 'Has this FBO structure been legally tested?',
        answer: 'FBO accounts are the standard structure used by Stripe, Square, and PayPal for marketplace payments. The FinCEN 2011 guidance explicitly excludes payment processors using FBO structures from MTL requirements. We\u2019re not innovating on legal structure \u2014 we\u2019re applying proven fintech architecture to a new domain.',
      },
      {
        question: 'What if a state AG argues this IS gambling?',
        answer: 'The legal test is "predominant factor." If skill (personal effort) is the predominant factor determining outcome, it\u2019s not gambling. Styx contracts require verifiable physical actions \u2014 going to a gym, eating specific meals. There is zero chance element. This classification has been upheld in every relevant jurisdiction for skill-based contests like DraftKings.',
      },
      {
        question: 'What about users with eating disorders?',
        answer: 'The Aegis Protocol is hardcoded: BMI below 18.5 blocks weight-loss contracts entirely. Weight-loss velocity is capped at 2%/week. These aren\u2019t configurable \u2014 they\u2019re compiled into the binary. We protect users from setting dangerous goals, which protects the platform from liability.',
      },
    ],
    sketch: 'aegisShield',
  },
  {
    id: 6,
    title: 'Market & B2B Pivot',
    subtitle: 'Two-Phase Go-to-Market',
    contentBlocks: [
      {
        type: 'columns',
        data: {
          columns: [
            {
              title: 'Phase 1: B2C',
              items: [
                'Target: biohacker & hardcore fitness communities',
                'Viral referral loop via endowed bonuses',
                'Zero customer acquisition cost',
                'High-LTV early adopters validate product-market fit',
              ],
            },
            {
              title: 'Phase 2: B2B Enterprise',
              items: [
                'Corporate Wellness SaaS licensing',
                'HR departments fund reward pools',
                'Removes user financial risk entirely',
                'Track wellness, productivity, sales metrics',
              ],
            },
          ],
        } satisfies ColumnBlock,
      },
      {
        type: 'stat',
        data: {
          items: [
            { value: '$13B \u2192 $50B', label: 'Corporate wellness market by 2035', source: 'Grand View Research' },
            { value: '23%', label: 'CAGR healthcare gamification', source: 'Markets & Markets' },
          ],
        } satisfies StatBlock,
      },
    ],
    eli5: 'First, we get fitness nerds hooked (they\u2019ll try anything). Then we sell the same platform to big companies as a corporate wellness tool. Instead of employees risking their own money, the company puts up bonus pools. HR gets real data on who\u2019s actually following through. The $50 billion corporate wellness market is desperate for something that actually works.',
    toughQuestions: [
      {
        question: 'Why would enterprises trust an unproven B2C app?',
        answer: 'Phase 1 generates the proof. By the time we approach enterprises, we\u2019ll have verified completion rates, anonymized behavioral data, and a proven audit mechanism. The B2B product is the same engine with the financial risk removed \u2014 employers fund the pools, employees participate risk-free. It\u2019s a de-risked version of a battle-tested system.',
      },
      {
        question: 'What\u2019s your competitive moat against enterprise wellness incumbents?',
        answer: 'Incumbents (Virgin Pulse, Limeade) rely on surveys and self-reporting \u2014 the exact Oracle Problem we solve. Our decentralized verification network is a structural moat: it takes years and millions of users to build a Fury network. We\u2019re not selling software; we\u2019re selling a truth infrastructure that no competitor can replicate by hiring engineers.',
      },
    ],
    sketch: 'marketPipeline',
  },
  {
    id: 7,
    title: 'Business Model',
    subtitle: 'Clean Unit Economics',
    contentBlocks: [
      {
        type: 'columns',
        data: {
          columns: [
            {
              title: '15% House Cut',
              items: [
                'Fixed administration fee on liquidated stakes',
                'Transparent, predictable revenue',
                'Scales linearly with user base',
              ],
            },
            {
              title: 'Enterprise SaaS',
              items: [
                'Recurring licensing to HR departments',
                'Private employer-funded lobbies',
                'Annual contracts with seat-based pricing',
              ],
            },
            {
              title: '$5 Appeal Fee',
              items: [
                'Friction fee for dispute escalation',
                'Prevents frivolous appeals',
                'Monetizes the Judge dashboard tier',
              ],
            },
          ],
        } satisfies ColumnBlock,
      },
    ],
    eli5: 'We make money three ways. When someone fails their challenge, we keep 15% of what they lost (the rest goes to the auditors who caught them). Big companies pay us a monthly fee to run accountability programs for their employees. And if someone disagrees with the auditors and wants to appeal, they pay $5 to file the appeal. Simple, clean, predictable.',
    toughQuestions: [
      {
        question: 'Is 15% house cut sustainable if completion rates are high?',
        answer: 'Yes, because volume compensates for high success rates. At $100 average stake and 20% failure rate, each failed contract generates $15 revenue. At 100K users, that\u2019s $300K/month from house cut alone. Enterprise SaaS adds recurring revenue independent of failure rates. And the $5 appeal fee creates a steady micro-transaction stream.',
      },
      {
        question: 'What\u2019s the projected LTV:CAC ratio?',
        answer: 'Because the endowed progress effect ($5 bonus) drives organic acquisition, our CAC approaches zero for B2C. LTV is driven by repeat contracts \u2014 the average committed user runs 4-6 contracts/year. With zero CAC and multi-contract engagement, LTV:CAC ratios are projected at 50:1+, far exceeding typical SaaS benchmarks of 3:1.',
      },
    ],
    sketch: 'revenueWaterfall',
  },
  {
    id: 8,
    title: 'Tech Stack',
    subtitle: 'Open-Source, Low-Burn Architecture',
    contentBlocks: [
      {
        type: 'bullets',
        data: {
          title: 'Infrastructure',
          items: [
            'PostgreSQL \u2014 Double-entry ledger, hash-chained audit log',
            'BullMQ + Redis \u2014 Async proof routing to Fury network',
            'Cloudflare R2 \u2014 Zero-egress media storage (no AWS bleed)',
            'HealthKit / Google Fit \u2014 Biometric hardware oracles',
            'Stripe FBO \u2014 Enterprise-grade escrow (hold/capture/cancel)',
          ],
        } satisfies BulletBlock,
      },
      {
        type: 'stat',
        data: {
          items: [
            { value: '< $2K', label: 'Year 1 server burn rate' },
            { value: '5', label: 'Platform targets (Web, iOS, Android, Desktop, API)' },
            { value: '100%', label: 'Open-source stack (zero vendor lock-in)' },
          ],
        } satisfies StatBlock,
      },
    ],
    eli5: 'Most media-heavy startups bleed money on Amazon cloud storage. We sidestep that entirely by using Cloudflare\u2019s free storage tier. Our database is free (PostgreSQL), our queue system is free (Redis), and we compress all uploaded videos server-side before storing them. Total server cost for year one: under $2,000. That\u2019s not a typo.',
    toughQuestions: [
      {
        question: 'Can this architecture handle enterprise scale?',
        answer: 'PostgreSQL handles billions of transactions at companies like Instagram and Robinhood. BullMQ processes millions of jobs/hour at scale. Cloudflare R2 has no bandwidth limits. The architecture is horizontally scalable \u2014 add read replicas for Postgres, add workers for BullMQ. We\u2019re not building novel infrastructure; we\u2019re assembling proven components.',
      },
      {
        question: 'What about the native mobile bridges (HealthKit, etc.)?',
        answer: 'Native HealthKit/Google Fit bridges require Swift/Kotlin code. We have architectural stubs in place \u2014 the data contracts and API endpoints are built. The native bridges are a Month 2 milestone item requiring Xcode/Android Studio work. The web and desktop platforms are fully functional today.',
      },
    ],
    sketch: 'techNetwork',
  },
  {
    id: 9,
    title: 'The Team',
    subtitle: 'Operator \u00D7 Psychologist \u00D7 Engineer',
    contentBlocks: [
      {
        type: 'columns',
        data: {
          columns: [
            {
              title: 'Financial Operations',
              items: [
                'MCA business ownership & operations',
                'Complex financial flow management',
                'Risk management & regulatory compliance',
                'Transforming analog businesses into systems',
              ],
            },
            {
              title: 'Behavioral Psychology',
              items: [
                'MFA-level narrative & psychology expertise',
                'Loss aversion mechanics design',
                'User behavior modeling',
                'Visceral product-user connection',
              ],
            },
            {
              title: 'Technical Execution',
              items: [
                'Full-stack rapid prototyping',
                '5-platform monorepo (327 tests)',
                'AI-augmented development velocity',
                'Ironclad legal + technical infrastructure',
              ],
            },
          ],
        } satisfies ColumnBlock,
      },
    ],
    eli5: 'One person wears three hats: (1) They\u2019ve run a real financial business \u2014 so they know how money actually moves. (2) They understand the psychology of why people fail and how to design systems around human weakness. (3) They can build the actual product themselves, fast. That rare combination means this isn\u2019t just an idea \u2014 the prototype already exists across five platforms.',
    toughQuestions: [
      {
        question: 'This is a solo founder \u2014 isn\u2019t that a red flag?',
        answer: 'The 327-test, 5-platform monorepo is proof of execution, not just a pitch. AI-augmented development (Claude, Gemini) means one skilled operator produces the output of a traditional 3-4 person team. The ask includes hiring key roles \u2014 but the foundation is already built and running.',
      },
      {
        question: 'What roles will you hire first?',
        answer: 'Month 1: iOS/Android engineer for native HealthKit/Google Fit bridges. Month 2: Compliance counsel for FBO account setup and state-by-state filing. Month 3: Growth lead for B2C community seeding. The product and architecture are founder-built; hiring fills specific capability gaps.',
      },
    ],
    sketch: 'teamGears',
  },
  {
    id: 10,
    title: 'The Ask',
    subtitle: '$1,500,000 Seed Round',
    contentBlocks: [
      {
        type: 'stat',
        data: {
          items: [
            { value: '$1.5M', label: 'Seed raise' },
            { value: '5', label: 'Month milestone plan' },
          ],
        } satisfies StatBlock,
      },
      {
        type: 'bullets',
        data: {
          title: 'Milestone Timeline',
          items: [
            'M1 \u2014 Financial Escrow & Ledger integration',
            'M2 \u2014 FTC Guardrails & Biometric Intakes',
            'M3 \u2014 Media Pipeline & Fury Bounty Network',
            'M4 \u2014 Live Lobbies & Judge Escalation Tier',
            'M5 \u2014 Enterprise B2B Dashboards',
          ],
        } satisfies BulletBlock,
      },
      {
        type: 'callout',
        data: {
          title: 'Why Now',
          body: 'Styx is a legally insulated, mathematically sound machine designed to monetize human follow-through. The $50B corporate wellness market is desperate for verification that works. The behavioral science is settled. The technology is ready. The regulatory framework is clear. We are ready to build.',
        } satisfies CalloutBlock,
      },
    ],
    eli5: 'We need $1.5 million to go from prototype to product in 5 months. Month by month: build the money system, add health safety checks, launch the auditor network, open it to real users, then sell it to big companies. The prototype already works \u2014 this money turns the demo into a business.',
    toughQuestions: [
      {
        question: 'Why $1.5M specifically?',
        answer: '12 months of runway at lean burn. Breakdown: $600K engineering (3 hires \u00D7 12 months), $200K legal/compliance (FBO setup, state filings, IP), $300K go-to-market (community seeding, enterprise sales), $200K infrastructure (scaling from prototype to production), $200K reserve. The ultra-low $2K/year server cost means almost all capital goes to people and distribution.',
      },
      {
        question: 'What does success look like at Month 5?',
        answer: '10,000 active B2C users, 50+ active Furies, $500K+ total stakes processed, 3 enterprise pilot agreements signed. Revenue from house cut should be covering operational costs. The Fury network should be self-sustaining. Enterprise pipeline should validate the B2B pivot thesis.',
      },
    ],
    sketch: 'milestoneRockets',
  },
];
