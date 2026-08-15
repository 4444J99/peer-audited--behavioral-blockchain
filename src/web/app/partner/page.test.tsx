import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../../services/api-client', () => ({
  api: {
    getPartnerInvitations: jest.fn().mockResolvedValue([]),
    getPartnerships: jest.fn().mockResolvedValue([]),
    acceptPartnerInvitation: jest.fn(),
    respondToPartnerInvite: jest.fn(),
    cosignAttestation: jest.fn(),
    vetoRecoveryBreak: jest.fn(),
    getAccountabilityStatus: jest.fn(),
    getPartnerCheckIns: jest.fn(),
    completePartnerCheckIn: jest.fn(),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'partner-1', email: 'partner@styx.io', integrity_score: 80, role: 'USER' },
    token: 'mock-token', // allow-secret
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

import PartnerPage, {
  CheckInThread,
  InvitationCard,
  PartnershipCard,
  supportsVeto,
} from './page';

const invitation = {
  id: 'ap-1',
  contract_id: 'contract-1',
  partner_user_id: 'partner-1',
  partner_email: 'partner@styx.io',
  status: 'PENDING',
  invited_at: '2026-08-01T00:00:00Z',
  accepted_at: null,
  oath_category: 'RECOVERY_NOCONTACT',
  stake_amount: '150.00',
  owner_email: 'owner@styx.io',
};

const partnership = {
  id: 'ap-2',
  contract_id: 'contract-2',
  status: 'ACTIVE',
  accepted_at: '2026-08-02T00:00:00Z',
  oath_category: 'RECOVERY_NOCONTACT',
  stake_amount: '150.00',
  ends_at: '2026-09-01T00:00:00Z',
  contract_status: 'ACTIVE',
  owner_email: 'owner@styx.io',
};

const noop = () => undefined;

describe('Partner page', () => {
  it('renders its own loading state while the two lists are in flight', () => {
    const html = renderToStaticMarkup(<PartnerPage />);

    expect(html).toContain('Loading partner activity');
    expect(html).toContain('animate-spin');
  });
});

describe('InvitationCard', () => {
  const render = (busy = false) =>
    renderToStaticMarkup(
      <InvitationCard invitation={invitation} busy={busy} onAccept={noop} onDecline={noop} />,
    );

  it('names the inviting owner, the oath, and the stake at risk', () => {
    const html = render();

    expect(html).toContain('owner@styx.io');
    expect(html).toContain('RECOVERY NOCONTACT');
    expect(html).toContain('$150.00');
  });

  it('offers both a decision and its opposite', () => {
    const html = render();

    expect(html).toContain('ACCEPT');
    expect(html).toContain('DECLINE');
  });

  it('disables both decisions while one is in flight', () => {
    const html = render(true);

    expect(html.match(/disabled=""/g)?.length).toBe(2);
  });
});

describe('PartnershipCard', () => {
  const render = (overrides: Partial<React.ComponentProps<typeof PartnershipCard>> = {}) =>
    renderToStaticMarkup(
      <PartnershipCard
        partnership={partnership}
        busy={false}
        expanded={false}
        status={null}
        checkIns={[]}
        draft=""
        onToggle={noop}
        onCosign={noop}
        onVeto={noop}
        onDraftChange={noop}
        onCompleteCheckIn={noop}
        {...overrides}
      />,
    );

  it('surfaces the co-sign action on the contract the partner can reach', () => {
    expect(render()).toContain('CO-SIGN ATTESTATION');
  });

  it('surfaces the veto only on recovery contracts', () => {
    expect(render()).toContain('VETO PENDING BREAK');
    expect(
      render({ partnership: { ...partnership, oath_category: 'BIOLOGICAL_WEIGHT' } }),
    ).not.toContain('VETO PENDING BREAK');
  });

  it('keeps the partner ledger and check-in thread behind the history toggle', () => {
    const collapsed = render();
    expect(collapsed).toContain('SHOW HISTORY');
    expect(collapsed).not.toContain('Partner Ledger');

    const open = render({
      expanded: true,
      status: {
        partners: [{ email: 'partner@styx.io', status: 'ACTIVE', partner_user_id: 'partner-1' }],
        history: [
          {
            id: 'evt-1',
            contract_id: 'contract-2',
            actor_id: 'partner-1',
            event_type: 'INVITE_ACCEPTED',
            payload: null,
            created_at: '2026-08-02T00:00:00Z',
          },
        ],
      },
    });
    expect(open).toContain('HIDE HISTORY');
    expect(open).toContain('Partner Ledger');
    expect(open).toContain('INVITE ACCEPTED');
    expect(open).toContain('Check-In History');
  });
});

describe('CheckInThread', () => {
  const scheduled = {
    id: 'chk-1',
    contractId: 'contract-2',
    partnerId: 'partner-1',
    type: 'SCHEDULED' as const,
    status: 'PENDING' as const,
    scheduledAt: '2026-08-03T00:00:00Z',
  };

  it('offers the compose box only when a check-in is still PENDING', () => {
    const pending = renderToStaticMarkup(
      <CheckInThread
        checkIns={[scheduled]}
        draft="holding steady"
        busy={false}
        onDraftChange={noop}
        onComplete={noop}
      />,
    );
    expect(pending).toContain('COMPLETE CHECK-IN');

    const done = renderToStaticMarkup(
      <CheckInThread
        checkIns={[{ ...scheduled, status: 'COMPLETED', message: 'held the line' }]}
        draft=""
        busy={false}
        onDraftChange={noop}
        onComplete={noop}
      />,
    );
    expect(done).not.toContain('COMPLETE CHECK-IN');
    expect(done).toContain('held the line');
  });

  it('reports an empty thread instead of rendering nothing', () => {
    const html = renderToStaticMarkup(
      <CheckInThread
        checkIns={[]}
        draft=""
        busy={false}
        onDraftChange={noop}
        onComplete={noop}
      />,
    );

    expect(html).toContain('No check-ins scheduled yet.');
  });
});

describe('supportsVeto', () => {
  it('is true only for the recovery stream, which is the only one with a break timelock', () => {
    expect(supportsVeto('RECOVERY_NOCONTACT')).toBe(true);
    expect(supportsVeto('RECOVERY_SOBRIETY')).toBe(true);
    expect(supportsVeto('BIOLOGICAL_WEIGHT')).toBe(false);
    expect(supportsVeto('DEEP_WORK_FOCUS')).toBe(false);
  });
});
