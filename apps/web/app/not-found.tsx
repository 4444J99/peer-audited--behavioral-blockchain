import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-black text-red-600/20">404</div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Page Not Found</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            This path does not exist on the Styx truth ledger.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
