import dynamic from 'next/dynamic';

// Dynamically import the P5 wrapper so it never runs on the Next.js server
// where the 'window' object doesn't exist.
export const DynamicP5Background = dynamic(
  () => import('./P5Wrapper'),
  { ssr: false }
);
