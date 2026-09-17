# Node runtime contract

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
