import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-950 px-6 py-8 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-black text-black">S</span>
          </div>
          <span className="font-semibold text-neutral-400">Styx Protocol</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/legal/terms" className="hover:text-neutral-300 transition-colors">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="hover:text-neutral-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/legal/rules" className="hover:text-neutral-300 transition-colors">
            Contest Rules
          </Link>
          <Link href="/legal/responsible-use" className="hover:text-neutral-300 transition-colors">
            Responsible Use
          </Link>
        </nav>

        <span className="text-neutral-600">&copy; {new Date().getFullYear()} Styx Protocol</span>
      </div>
    </footer>
  );
}
