import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseSupportTraceMessage } from '../utils/support-trace';

type Props = {
  value: string | null | undefined;
  messageStyle?: any;
  traceStyle?: any;
  containerStyle?: any;
  traceLabel?: string;
};

export function SupportTraceErrorBanner({
  value,
  messageStyle,
  traceStyle,
  containerStyle,
  traceLabel = 'Support trace ID',
}: Props) {
  if (!value) {
    return null;
  }

  const parsed = parseSupportTraceMessage(value);

  return (
    <View style={containerStyle}>
      <Text style={messageStyle}>{parsed.message}</Text>
      {parsed.traceId ? (
        <Text style={[styles.traceText, traceStyle]}>
          {traceLabel}: {parsed.traceId}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  traceText: {
    color: '#888',
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'left',
  },
});

export default SupportTraceErrorBanner;
