import Link from 'next/link';
import ComplianceArtifactTable from '../../../components/legal/ComplianceArtifactTable';

export const metadata = {
  title: 'Compliance Artifact Register | Styx Protocol',
};

export default function ComplianceArtifactsPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-500 text-sm font-bold hover:text-red-400 mb-8 inline-block">
          &larr; Back to Styx
        </Link>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Compliance Artifact Register</h1>
        <p className="text-sm text-neutral-500 mb-12">
          The legal artifacts that gate a Styx production release, and the digests currently on record.
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">What this page is</h2>
            <p className="mb-3">
              Styx will not deploy to production unless every required compliance artifact is on record,
              unexpired, and hash-matched against the document it claims to be. That check runs in the
              release pipeline before any service is deployed. This page publishes the same register the
              gate reads, so the claim can be verified from outside rather than taken on trust.
            </p>
            <p>
              Each entry below names the source document in the Styx repository and the SHA-256 digest
              recorded against it. Hashing the source document yourself and comparing it to the digest
              shown here reproduces exactly what the release gate does.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Artifacts on record</h2>
            <ComplianceArtifactTable />
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">How the gate decides</h2>
            <p className="mb-3">The release is blocked if any of the following is true for a required artifact:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>No active version is on record</li>
              <li>The recorded version or content hash is incomplete</li>
              <li>The recorded expiration date has passed</li>
              <li>The source document&rsquo;s computed digest does not match the recorded hash</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">What a missing signature means</h2>
            <p>
              A signature field reading &ldquo;Awaiting counsel signature&rdquo; means the artifact exists
              but no outside counsel has signed the version on record. Styx treats that as an unmet release
              condition, not as a formality — the gate blocks a production deploy in that state rather than
              deploying and disclosing later.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p>
              Questions about the artifacts on this register should be directed to{' '}
              <a href="mailto:legal@styx.protocol" className="text-red-500 hover:text-red-400">legal@styx.protocol</a>.
            </p>
          </section>

          <section className="border-t border-neutral-800 pt-8">
            <h2 className="text-lg font-bold text-white mb-3">Related Policies</h2>
            <ul className="space-y-2">
              <li><Link href="/legal/terms" className="text-red-500 hover:text-red-400">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link></li>
              <li><Link href="/legal/rules" className="text-red-500 hover:text-red-400">Contest Official Rules</Link></li>
              <li><Link href="/legal/responsible-use" className="text-red-500 hover:text-red-400">Responsible Use</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
