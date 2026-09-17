"""Temporary exact-input API repair. Standard library only; no dependency code.

The publisher reruns these reviewed edits from the input commit, never from an
artifact. Original Git blob hashes prevent edits to concurrently changed sources.
"""
import hashlib
import json
import re
from pathlib import Path

REPAIRS = {
    'services/escrow/dispute.service.ts': ('b3f5e491ccb46ff7289fcf9d59acc751e5eb730f', ['EscrowProvider']),
    'src/common/guards/app-throttler.guard.ts': ('f1c6bbf25977e3fe4b93b836769b4f2282ff8c9a', ['ThrottlerModuleOptions']),
    'src/modules/admin/admin.scheduler.ts': ('f80d173bfd22c3e5262cbe86b1a91669ff6c4da0', ['EscrowProvider']),
    'src/modules/admin/user-moderation.controller.ts': ('09ef90ae5d3a754daa3cf606c0f19db15a28bf8d', ['ContentType']),
    'src/modules/b2b/b2b.controller.ts': ('d2c450f6bf2ad2408a255e5405ddb3c90018a32b', ['CreateCohortDto', 'UpdateCohortDto']),
    'src/modules/compliance/attestation.controller.ts': ('8c30ab70b6aa526103f060cd764e9c610bcb2745', ['AppAttestAssertion', 'AppAttestRegistration', 'PlayIntegrityVerdict']),
    'src/modules/compliance/compliance.controller.ts': ('4dffbce0a19166787c6f61880b186accbffcb370', ['RawBodyRequest', 'Request', 'Response']),
    'src/modules/contracts/contracts.service.ts': ('c5b74d5c2b1763e7d3a4f45e2ad68fa955df6597', ['EscrowProvider']),
    'src/modules/contracts/fitbit-webhook.controller.ts': ('8eb6a0b0fa6746ba9e5dbe416c44ae4950a41888', ['RawBodyRequest', 'Response']),
    'src/modules/fury/fury.controller.ts': ('b5f6c473e07b30fabd067e5b959dfb2f6361a859', ['FileCounterClaimDto', 'AdjudicateCounterClaimDto']),
    'src/modules/marketing/beta-waitlist.service.ts': ('533627dc0cd3f06889eff525cc499abb270bfdc7', ['BetaWaitlistNotifier']),
    'src/modules/oracles/oracles.controller.ts': ('5f3e68110c3fb3010610e658ec2dc8a2b84f7cde', ['HealthKitSampleMetadata']),
    'src/modules/pay/dto.ts': ('ac2b78f70876ce25b80e3941f9add2140e71b65d', ['MeteredEventType']),
    'src/modules/pay/pay.service.ts': ('fb7ec054450abe7353581d4bf9804ba4f65659cc', ['EscrowProvider']),
    'src/modules/payments/payments.controller.ts': ('3c1d38117834a5bf378fd60ab05dba2a47ad748d', ['RawBodyRequest', 'Request', 'Response']),
    'src/modules/payments/settlement.worker.ts': ('336faf19d62396bb16f9cfc81636aafa817c5936', ['EscrowProvider']),
}

for relative, (expected_sha, names) in REPAIRS.items():
    path = Path('src/api') / relative
    raw = path.read_bytes()
    actual = hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest()
    assert actual == expected_sha, (str(path), 'Source changed; re-review before editing')
    found = {name: 0 for name in names}
    def replace_import(match):
        content = match.group(0)
        for name in names:
            content, count = re.subn(r'(?<![\w])' + re.escape(name) + r'(?=\s*[,}])', 'type ' + name, content)
            found[name] += count
        return content
    updated = re.sub(r'\bimport\s*\{[^}]*\}\s*from\s*[\x27\x22][^\x27\x22]+[\x27\x22]', replace_import, raw.decode())
    assert all(count == 1 for count in found.values()), (str(path), found)
    path.write_text(updated)
    print(path.as_posix())

path = Path('src/api/package.json')
package = json.loads(path.read_text())
assert package['scripts']['test'] == 'jest --coverage --forceExit'
package['scripts']['test'] = 'node scripts/run-jest.cjs --coverage --forceExit'
path.write_text(json.dumps(package, indent=2) + '\n')
print(path.as_posix())
