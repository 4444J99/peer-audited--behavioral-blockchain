/** @jest-environment jsdom */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

import KycPage from './page';

type FetchMock = jest.Mock<Promise<Partial<Response>>, [string, RequestInit?]>;

const baseStatus = {
  userId: 'd1000000-0000-0000-0000-000000000005',
  kycStatus: 'NOT_STARTED',
  ageVerificationStatus: 'NOT_STARTED',
  identityProvider: null,
  identityVerificationId: null,
  identityVerifiedAt: null,
  isKycVerified: false,
  isAgeVerified: false,
};

function jsonResponse(status: number, body: unknown): Partial<Response> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

function selectValidFile() {
  const input = screen.getByLabelText('Identity Document') as HTMLInputElement;
  const file = new File(['passport-bytes'], 'passport.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });
  return input;
}

describe('KYC page', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    (global as unknown as { fetch: unknown }).fetch = fetchMock;
    document.cookie = 'styx_csrf_token=csrf-demo-token';
  });

  it('renders the sign-in gate when the compliance endpoint returns 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Unauthorized' }));

    render(<KycPage />);

    expect(await screen.findByText('Sign in required')).toBeTruthy();
    const login = screen.getByText('Go to Login') as HTMLAnchorElement;
    expect(login.getAttribute('href')).toBe('/login');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/me/compliance',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('loads and displays the verification status badges', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        ...baseStatus,
        kycStatus: 'PENDING',
        ageVerificationStatus: 'VERIFIED',
      }),
    );

    render(<KycPage />);

    expect(await screen.findByText('KYC Identity')).toBeTruthy();
    expect(screen.getByText('PENDING')).toBeTruthy();
    expect(screen.getByText('VERIFIED')).toBeTruthy();
    expect(screen.getByText('Age Verification')).toBeTruthy();
  });

  it('shows the fully-verified panel and hides upload when both checks pass', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        ...baseStatus,
        kycStatus: 'VERIFIED',
        ageVerificationStatus: 'VERIFIED',
        identityProvider: 'MOCK',
        identityVerifiedAt: '2026-07-01T00:00:00.000Z',
        isKycVerified: true,
        isAgeVerified: true,
      }),
    );

    render(<KycPage />);

    expect(await screen.findByText('You are fully verified')).toBeTruthy();
    expect(screen.queryByText('Begin Verification')).toBeNull();
  });

  it('rejects an oversized document with a validation error and keeps the flow idle', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, baseStatus));

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    const input = screen.getByLabelText('Identity Document') as HTMLInputElement;
    const big = new File(['x'], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });

    expect(await screen.findByText('Document exceeds the 10 MB limit.')).toBeTruthy();
    const begin = screen.getByText('Begin Verification').closest('button') as HTMLButtonElement;
    expect(begin.disabled).toBe(true);
  });

  it('rejects an unsupported document type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, baseStatus));

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    const input = screen.getByLabelText('Identity Document') as HTMLInputElement;
    const exe = new File(['x'], 'malware.exe', { type: 'application/octet-stream' });
    fireEvent.change(input, { target: { files: [exe] } });

    expect(
      await screen.findByText('Unsupported document type. Use JPEG, PNG, WebP, or PDF.'),
    ).toBeTruthy();
  });

  it('starts a verification session with the CSRF header and renders mock controls', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/users/me/compliance') {
        return Promise.resolve(jsonResponse(200, baseStatus));
      }
      if (url === '/api/users/me/compliance/identity/start') {
        return Promise.resolve(
          jsonResponse(200, {
            provider: 'MOCK',
            verificationId: 'ivs_mock_abc123',
            status: 'PENDING',
            hostedUrl: null,
            clientSecret: null,
            userId: baseStatus.userId,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { message: 'not found' }));
    });

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    selectValidFile();
    expect(await screen.findByText(/passport\.png/)).toBeTruthy();

    fireEvent.click(screen.getByText('Begin Verification'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/me/compliance/identity/start',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({ 'x-csrf-token': 'csrf-demo-token' }),
        }),
      );
    });

    const startCall = fetchMock.mock.calls.find(
      ([url]) => url === '/api/users/me/compliance/identity/start',
    );
    const body = JSON.parse(String(startCall?.[1]?.body));
    expect(body.mode).toBe('KYC_AND_AGE');
    expect(body.returnUrl).toContain('/kyc');

    expect(await screen.findByText('Approve (Mock)')).toBeTruthy();
    expect(screen.getByText('Reject (Mock)')).toBeTruthy();
  });

  it('completes the mock session and updates the badges to VERIFIED', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/users/me/compliance') {
        return Promise.resolve(jsonResponse(200, baseStatus));
      }
      if (url === '/api/users/me/compliance/identity/start') {
        return Promise.resolve(
          jsonResponse(200, {
            provider: 'MOCK',
            verificationId: 'ivs_mock_abc123',
            status: 'PENDING',
            userId: baseStatus.userId,
          }),
        );
      }
      if (url === '/api/users/me/compliance/identity/mock-complete') {
        return Promise.resolve(
          jsonResponse(200, {
            ...baseStatus,
            kycStatus: 'VERIFIED',
            ageVerificationStatus: 'VERIFIED',
            identityProvider: 'MOCK',
            identityVerifiedAt: '2026-07-30T00:00:00.000Z',
            isKycVerified: true,
            isAgeVerified: true,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { message: 'not found' }));
    });

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    selectValidFile();
    fireEvent.click(screen.getByText('Begin Verification'));
    fireEvent.click(await screen.findByText('Approve (Mock)'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/me/compliance/identity/mock-complete',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByText('You are fully verified')).toBeTruthy();
  });

  it('renders the hosted-provider link for Stripe Identity sessions', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/users/me/compliance') {
        return Promise.resolve(jsonResponse(200, baseStatus));
      }
      if (url === '/api/users/me/compliance/identity/start') {
        return Promise.resolve(
          jsonResponse(200, {
            provider: 'STRIPE_IDENTITY',
            verificationId: 'vs_live_123',
            status: 'PENDING',
            hostedUrl: 'https://verify.stripe.com/session/vs_live_123',
            userId: baseStatus.userId,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { message: 'not found' }));
    });

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    selectValidFile();
    fireEvent.click(screen.getByText('Begin Verification'));

    const hosted = (await screen.findByText(
      'Continue to Secure Document Upload',
    )) as HTMLElement;
    const anchor = hosted.closest('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('https://verify.stripe.com/session/vs_live_123');
    expect(screen.queryByText('Approve (Mock)')).toBeNull();
  });

  it('surfaces API errors from the start endpoint and returns to the selected state', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/users/me/compliance') {
        return Promise.resolve(jsonResponse(200, baseStatus));
      }
      if (url === '/api/users/me/compliance/identity/start') {
        return Promise.resolve(
          jsonResponse(503, { message: 'Identity provider unavailable' }),
        );
      }
      return Promise.resolve(jsonResponse(404, { message: 'not found' }));
    });

    render(<KycPage />);
    await screen.findByText('Upload Identity Document');

    selectValidFile();
    fireEvent.click(screen.getByText('Begin Verification'));

    expect(
      await screen.findByText('API 503: Identity provider unavailable'),
    ).toBeTruthy();
    const begin = screen.getByText('Begin Verification').closest('button') as HTMLButtonElement;
    expect(begin.disabled).toBe(false);
  });
});
