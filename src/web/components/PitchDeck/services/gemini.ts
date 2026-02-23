const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiRequest<T>(path: string, body: Record<string, string>): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('styx_token') || 'dev-mock-jwt-token-alpha-omega' // allow-secret
    : 'dev-mock-jwt-token-alpha-omega'; // allow-secret

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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
