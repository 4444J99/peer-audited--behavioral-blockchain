const API_BASE =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return '';
}

async function apiRequest<T>(path: string, body: Record<string, string>): Promise<T> {
  const csrfToken = readCookie('styx_csrf_token');

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const callGemini = async (prompt: string, isJson: boolean = false): Promise<string> => {
  // Route through the Styx API which uses the real Gemini 2.5 Flash endpoint
  if (isJson) {
    const data = await apiRequest<{ questions: string[] }>('/ai/grill-me', { slideContent: prompt });
    return JSON.stringify(data.questions);
  }
  const data = await apiRequest<{ explanation: string }>('/ai/eli5', { text: prompt });
  return data.explanation;
};
