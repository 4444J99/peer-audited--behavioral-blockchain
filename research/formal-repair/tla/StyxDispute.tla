------------------------------ MODULE StyxDispute ------------------------------
EXTENDS Naturals, TLC

CONSTANT MaxEscalations

States ==
  {"FEE_AUTHORIZED_PENDING_REVIEW",
   "IN_REVIEW",
   "ESCALATED",
   "RESOLVED_UPHELD",
   "RESOLVED_OVERTURNED"}

Terminal ==
  {"RESOLVED_UPHELD", "RESOLVED_OVERTURNED"}

VARIABLES status, escalations, feeAction

vars == <<status, escalations, feeAction>>

Init ==
  /\ status = "FEE_AUTHORIZED_PENDING_REVIEW"
  /\ escalations = 0
  /\ feeAction = "none"

Review ==
  /\ status = "FEE_AUTHORIZED_PENDING_REVIEW"
  /\ status' = "IN_REVIEW"
  /\ UNCHANGED <<escalations, feeAction>>

Uphold ==
  /\ status \in {"IN_REVIEW", "ESCALATED"}
  /\ status' = "RESOLVED_UPHELD"
  /\ feeAction' = "capture"
  /\ UNCHANGED escalations

Overturn ==
  /\ status \in {"IN_REVIEW", "ESCALATED"}
  /\ status' = "RESOLVED_OVERTURNED"
  /\ feeAction' = "cancel"
  /\ UNCHANGED escalations

Escalate ==
  /\ status = "IN_REVIEW"
  /\ escalations < MaxEscalations
  /\ status' = "ESCALATED"
  /\ escalations' = escalations + 1
  /\ UNCHANGED feeAction

ReReview ==
  /\ status = "ESCALATED"
  /\ status' = "IN_REVIEW"
  /\ UNCHANGED <<escalations, feeAction>>

Next ==
  Review \/ Uphold \/ Overturn \/ Escalate \/ ReReview

Resolve ==
  Uphold \/ Overturn

Spec ==
  Init /\ [][Next]_vars /\ WF_vars(Resolve)

TypeOK ==
  /\ status \in States
  /\ escalations \in 0..MaxEscalations
  /\ feeAction \in {"none", "capture", "cancel"}

FinancialConsistency ==
  /\ (status = "RESOLVED_UPHELD" => feeAction = "capture")
  /\ (status = "RESOLVED_OVERTURNED" => feeAction = "cancel")
  /\ (status \notin Terminal => feeAction = "none")

EventuallyResolved ==
  <> (status \in Terminal)

=============================================================================
