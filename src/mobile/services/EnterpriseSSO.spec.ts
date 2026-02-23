import { Linking } from 'react-native';
import { EnterpriseSSO } from './EnterpriseSSO';
import { ApiClient, setAuthToken, getAuthToken } from './ApiClient';

// Mock ApiClient.exchangeEnterpriseToken
jest.mock('./ApiClient', () => {
  let token: string | null = null;
  return {
    setAuthToken: jest.fn((t: string | null) => { token = t; }),
    getAuthToken: jest.fn(() => token),
    ApiClient: {
      exchangeEnterpriseToken: jest.fn(),
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  (Linking.addEventListener as jest.Mock).mockReset();
  (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
});

describe('EnterpriseSSO', () => {
  it('registers a URL handler via Linking.addEventListener', async () => {
    await EnterpriseSSO.initializeDeepLinkListener();

    expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
  });

  it('ignores non-styx:// URLs', async () => {
    const cb = jest.fn();
    await EnterpriseSSO.initializeDeepLinkListener(cb);

    // Get the handler that was registered
    const handler = (Linking.addEventListener as jest.Mock).mock.calls[0][1];
    await handler({ url: 'https://example.com/foo' });

    expect(ApiClient.exchangeEnterpriseToken).not.toHaveBeenCalled();
    expect(cb).not.toHaveBeenCalled();
  });

  it('extracts token and calls exchangeEnterpriseToken on valid deep link', async () => {
    const cb = jest.fn();
    (ApiClient.exchangeEnterpriseToken as jest.Mock).mockResolvedValueOnce({
      userId: 'ent-user-1',
      token: 'session-jwt',
    });

    await EnterpriseSSO.initializeDeepLinkListener(cb);
    const handler = (Linking.addEventListener as jest.Mock).mock.calls[0][1];
    await handler({ url: 'styx://enterprise/callback?token=ent-tok-abc' });

    expect(ApiClient.exchangeEnterpriseToken).toHaveBeenCalledWith('ent-tok-abc');
    expect(cb).toHaveBeenCalledWith({ success: true, userId: 'ent-user-1' });
  });

  it('calls callback with error on missing token', async () => {
    const cb = jest.fn();
    await EnterpriseSSO.initializeDeepLinkListener(cb);
    const handler = (Linking.addEventListener as jest.Mock).mock.calls[0][1];
    await handler({ url: 'styx://enterprise/callback' });

    expect(cb).toHaveBeenCalledWith({
      success: false,
      error: 'Missing enterprise token',
    });
  });

  it('calls callback with error on API failure', async () => {
    const cb = jest.fn();
    (ApiClient.exchangeEnterpriseToken as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid enterprise token'),
    );

    await EnterpriseSSO.initializeDeepLinkListener(cb);
    const handler = (Linking.addEventListener as jest.Mock).mock.calls[0][1];
    await handler({ url: 'styx://enterprise/callback?token=bad-tok' });

    expect(cb).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid enterprise token',
    });
  });
});
