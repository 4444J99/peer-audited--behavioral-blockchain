export interface PushMessage {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  status: 'SENT' | 'FAILED' | 'UNREGISTERED';
  providerResult?: string;
  errorMessage?: string;
}

export interface PushProvider {
  readonly name: string;
  send(message: PushMessage): Promise<PushResult>;
}
