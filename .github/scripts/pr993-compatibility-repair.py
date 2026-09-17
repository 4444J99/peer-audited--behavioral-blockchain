"""Temporary deterministic PR 993 repair; standard library only, no commands or credentials.

Run against the fixed input tree in both the validation and publication jobs.
The publisher recomputes these edits rather than trusting executable artifact content.
"""
import json
import re
from pathlib import Path

NODE_RANGE = '>=24.15.0 <25'
NEST_VERSION = '12.0.3'


def write(path, content):
    path = Path(path)
    if not path.exists() or path.read_text() != content:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        print(path.as_posix())


def write_json(path, value):
    write(path, json.dumps(value, indent=2) + '\n')


def main():
    root = json.loads(Path('package.json').read_text())
    assert root['packageManager'] == 'npm@10.8.2'
    assert root['engines']['node'] == '>=22.13.0'
    assert root['overrides']['@nestjs/platform-express'] == '11.1.26'
    assert root['overrides']['@nestjs/testing'] == '11.1.26'
    assert root['overrides']['postcss'] == '8.5.15'
    root['engines']['node'] = NODE_RANGE
    root['scripts']['validate:runtime'] = 'node scripts/validation/runtime-contract.mjs'
    root['scripts']['test:runtime'] = 'node --test scripts/validation/runtime-contract.test.mjs'
    root['devDependencies']['semver'] = '^7.7.2'
    for name in ['@nestjs/common', '@nestjs/core']:
        root['devDependencies'][name] = NEST_VERSION
    for name in ['@nestjs/common', '@nestjs/core', '@nestjs/platform-express', '@nestjs/testing']:
        root['overrides'][name] = NEST_VERSION
    root['overrides']['postcss'] = '8.5.28'
    root['overrides']['multer'] = '2.3.0'
    write_json('package.json', root)

    for path in sorted([*Path('src').glob('*/package.json'), *Path('packages').glob('*/package.json')]):
        package = json.loads(path.read_text())
        if package.get('engines', {}).get('node'):
            package['engines']['node'] = NODE_RANGE
        if path.as_posix() == 'src/api/package.json':
            assert package['dependencies']['@nestjs/platform-express'] == '12.0.1'
            assert package['devDependencies']['@nestjs/testing'] == '12.0.1'
            for name in ['@nestjs/common', '@nestjs/core']:
                package['dependencies'][name] = '^' + NEST_VERSION
            package['dependencies']['@nestjs/platform-express'] = NEST_VERSION
            package['devDependencies']['@nestjs/testing'] = NEST_VERSION
        write_json(path, package)

    write('.node-version', '24\n')
    if Path('.nvmrc').exists():
        assert Path('.nvmrc').read_text().strip() in ['22', '24', 'v22', 'v24']
        write('.nvmrc', '24\n')

    for path in sorted(Path('.github/workflows').glob('*.yml')):
        if path.name.startswith('pr-993-'):
            continue
        source = path.read_text()
        source = re.sub(r'(?m)^(\s*)node-version: \[22\]\s*$', r'\1node-version: [24]', source)
        source = re.sub(r'(?m)^(\s*)node-version: (?:22|24\.x|\x2724\x27)\s*$', r'\1node-version-file: .node-version', source)
        if path.name == 'ci.yml':
            marker = 'permissions:\n  contents: read\n'
            assert source.count(marker) == 1
            source = source.replace(marker, marker + '\nenv:\n  npm_config_engine_strict: "true"\n', 1)
            old_install = '          npx --yes "npm@${npm_version}" ci\n'
            assert source.count(old_install) == 1
            source = source.replace(old_install, '          npm install --global "npm@${npm_version}" --ignore-scripts\n          npm ci --strict-peer-deps\n')
            marker = '      - name: Turbo Cache\n'
            assert source.count(marker) == 1
            source = source.replace(marker, '      - name: Validate runtime policy and regression tests\n        run: |\n          npm run validate:runtime\n          npm run test:runtime\n\n' + marker)
        if path.name == 'dependency-contract.yml':
            source = source.replace("      - '.github/workflows/dependency-contract.yml'", "      - '.github/workflows/**'\n      - '.node-version'\n      - '.nvmrc'\n      - 'render.yaml'\n      - '**/Dockerfile'\n      - 'src/mobile/**'\n      - 'src/test-harness/**'\n      - 'scripts/validation/runtime-contract*'")
            source = source.replace('          # Node 24 satisfies pre-existing API engine requirements; see issue #997.\n', '          # Canonical release line for CI and deployment definitions.\n')
            for old in ['22.13.0', '22.12.0']:
                source = source.replace(old, '24.15.0')
            marker = '      - name: Check the Expo SDK dependency contract\n'
            assert source.count(marker) == 1
            source = source.replace(marker, '      - name: Verify runtime contract and regression tests\n        run: |\n          npm run validate:runtime\n          npm run test:runtime\n' + marker)
            marker = '      - name: Verify mobile types and tests\n'
            assert source.count(marker) == 1
            source = source.split(marker)[0] + '''      - name: Verify mobile and harness independently
        run: |
          status=0
          npm run lint --workspace @styx/mobile || status=1
          npm run test --workspace @styx/mobile -- --runInBand || status=1
          npm run lint --workspace @styx/test-harness || status=1
          npm run test --workspace @styx/test-harness || status=1
          git diff --exit-code -- package.json package-lock.json src/api/package.json src/mobile/package.json src/test-harness/package.json || status=1
          printf 'Checked head: `%s`; aggregate validation exit: `%s`\\n' "$(git rev-parse HEAD)" "$status" >> "$GITHUB_STEP_SUMMARY"
          exit "$status"
'''
        write(path, source)

    for file in ['.config/docker/Dockerfile', 'src/api/Dockerfile', 'src/web/Dockerfile']:
        path = Path(file)
        source = path.read_text()
        assert 'FROM node:22-alpine' in source
        write(path, source.replace('FROM node:22-alpine', 'FROM node:24-alpine'))

    path = Path('render.yaml')
    source = path.read_text()
    source, count = re.subn(r'(key: NODE_VERSION\n\s*value: )"22"', r'\1"24"', source)
    assert count == 2
    source = source.replace('supported Node 22 LTS', 'supported Node 24 LTS')
    old = 'buildCommand: npm install --include=dev && '
    assert source.count(old) == 2
    source = source.replace(old, 'buildCommand: npx --yes npm@10.8.2 ci --include=dev --engine-strict --strict-peer-deps && npm run validate:runtime && ')
    write(path, source)

    doc = Path('docs/architecture/node-runtime-contract.md')
    assert not doc.exists()
    write(doc, '''# Node runtime contract

The supported repository runtime is **Node 24.15 or newer within the 24.x LTS
line**. `.node-version` selects that release line; the root, API, mobile, and
existing package engine declarations enforce `>=24.15.0 <25`.

The API dependency graph already required Node 24. The higher development floor
also accommodates the Nest 12 CLI's schematics. CI, release/promotion jobs,
Docker base images, and both Render Blueprint services select Node 24. Render
builds use the committed lockfile and repository npm 10.8.2 with strict engine
and peer checks, rather than resolving a new graph with `npm install`.

Run `npm run validate:runtime` and `npm run test:runtime` before changing any
runtime selector. The guard rejects drift in CI matrices, setup-node inputs,
container definitions, engine declarations, and both Render service definitions.
Historical audit documents are evidence of their original dates, not runtime
configuration, and are not rewritten.

Mobile retains the Expo SDK 57 React/React DOM 19.2.3 pair. Its Jest resolver pins
both packages and their subpaths to the mobile workspace so a hoisted testing
library cannot select the independent web workspace's newer React dispatcher.
The dependency workflow also checks Expo's installed compatibility contract and
the test harness's actual YAML resolution, and runs both workspaces even when
one fails. Existing coverage and audit thresholds remain enforcing.

Repository configuration and CI evidence do not by themselves prove an external
Render service has synchronized its Blueprint or completed deployment. Deployment
receipts must identify the actual accepted revision and runtime independently.
''')


if __name__ == '__main__':
    main()
