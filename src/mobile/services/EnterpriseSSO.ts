import { Linking } from 'react-native';
import { ApiClient, setAuthToken } from './ApiClient';

type SSOCallback = (result: { success: boolean; userId?: string; error?: string }) => void;

let onAuthComplete: SSOCallback | null = null;

export class EnterpriseSSO {
  /**
   * Intercepts "styx://enterprise/" deep links to fluidly route corporate employees
   * from internal portals directly into a pre-funded Styx vault.
   */
  static async initializeDeepLinkListener(callback?: SSOCallback): Promise<void> {
    if (callback) {
      onAuthComplete = callback;
    }

    Linking.addEventListener('url', this.handleDeepLink);

    // Check if the app was opened from a cold start via a link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleDeepLink({ url: initialUrl });
    }
  }

  private static async handleDeepLink(event: { url: string }): Promise<void> {
    const { url } = event;
    console.log(`EnterpriseSSO: Intercepted deep link [${url}]`);

    if (!url.startsWith('styx://enterprise/')) {
      return;
    }

    const token = url.split('token=')[1]; // allow-secret
    if (!token) {
      console.warn('EnterpriseSSO: Deep link missing token parameter');
      onAuthComplete?.({ success: false, error: 'Missing enterprise token' });
      return;
    }

    try {
      const result = await ApiClient.exchangeEnterpriseToken(token);
      setAuthToken(result.token); // allow-secret
      console.log(`EnterpriseSSO: Authenticated as ${result.userId}`);
      onAuthComplete?.({ success: true, userId: result.userId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`EnterpriseSSO: Token exchange failed: ${message}`);
      onAuthComplete?.({ success: false, error: message });
    }
  }
}
