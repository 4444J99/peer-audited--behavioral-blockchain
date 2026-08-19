import Link from 'next/link';
import PitchDeck from '../../components/PitchDeck/PitchDeck';

export default function PitchPage() {
  return (
    <>
      <div className="fixed right-4 top-4 z-50">
        <Link href="/tour" className="rounded-full border border-white/30 bg-black/80 px-4 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white hover:text-black">
          STYX TOUR
        </Link>
      </div>
      <PitchDeck />
    </>
  );
}
