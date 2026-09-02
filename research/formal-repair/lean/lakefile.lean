import Lake
open Lake DSL

package styxFormalRepair where
  version := v!"0.1.0"

require mathlib from git
  "https://github.com/leanprover-community/mathlib4" @ "v4.30.0"

lean_lib StyxLedger where
  srcDir := "."
