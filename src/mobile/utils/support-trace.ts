const REQUEST_ID_SUFFIX_RE = /\s*\[request_id:\s*([^\]]+)\]\s*$/i;

export interface SupportTraceMessage {
  message: string;
  traceId: string | null;
}

export function parseSupportTraceMessage(input: string | null | undefined): SupportTraceMessage {
  if (!input) {
    return { message: '', traceId: null };
  }

  const trimmed = input.trim();
  const match = trimmed.match(REQUEST_ID_SUFFIX_RE);
  if (!match) {
    return { message: trimmed, traceId: null };
  }

  return {
    message: trimmed.replace(REQUEST_ID_SUFFIX_RE, '').trim(),
    traceId: match[1].trim(),
  };
}
