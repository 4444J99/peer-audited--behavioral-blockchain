import React from 'react';
import { parseSupportTraceMessage } from '../../utils/support-trace';

type Props = {
  value: string | null | undefined;
  messageClassName?: string;
  traceClassName?: string;
  containerClassName?: string;
  traceLabel?: string;
};

export function SupportTraceMessage({
  value,
  messageClassName = 'text-sm text-neutral-400',
  traceClassName = 'text-xs text-neutral-500 font-mono',
  containerClassName = 'space-y-1',
  traceLabel = 'Support trace ID',
}: Props) {
  if (!value) {
    return null;
  }

  const parsed = parseSupportTraceMessage(value);

  return (
    <div className={containerClassName}>
      <p className={messageClassName}>{parsed.message}</p>
      {parsed.traceId ? (
        <p className={traceClassName}>
          {traceLabel}: {parsed.traceId}
        </p>
      ) : null}
    </div>
  );
}

export default SupportTraceMessage;
