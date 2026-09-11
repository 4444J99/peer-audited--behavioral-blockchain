import Lake
open Lake DSL

package styxFormalRepair where
  version := v!"0.1.0"

@[default_target]
lean_lib StyxLedger where
  srcDir := "."
  roots := #[`StyxLedger]
