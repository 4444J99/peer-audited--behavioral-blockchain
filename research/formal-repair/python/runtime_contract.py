"""Derive the T7 mathematical model parameters from the TypeScript runtime.

This module deliberately parses the implementation rather than duplicating its
constants by hand. A model/runtime mismatch should fail closed in CI.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
HONEYPOT_SOURCE = (
    REPOSITORY_ROOT / "src/api/services/intelligence/honeypot.service.ts"
)
BEHAVIORAL_SOURCE = REPOSITORY_ROOT / "src/shared/libs/behavioral-logic.ts"


@dataclass(frozen=True)
class HoneypotRuntimeContract:
    threshold: int
    correct_bonus: int
    miss_penalty: int
    ceiling: int
    cadence_hours: int


def _extract_integer(pattern: str, text: str, label: str) -> int:
    match = re.search(pattern, text)
    if match is None:
        raise ValueError(f"could not derive {label} from runtime source")
    return int(match.group(1))


def load_runtime_contract() -> HoneypotRuntimeContract:
    honeypot_source = HONEYPOT_SOURCE.read_text(encoding="utf-8")
    behavioral_source = BEHAVIORAL_SOURCE.read_text(encoding="utf-8")

    threshold = _extract_integer(
        r"SHADOW_BAN_THRESHOLD\s*=\s*(\d+)",
        behavioral_source,
        "shadow-ban threshold",
    )
    correct_bonus = _extract_integer(
        r"HONEYPOT_CORRECT_BONUS\s*=\s*(\d+)",
        honeypot_source,
        "correct-vote bonus",
    )
    miss_penalty = _extract_integer(
        r"HONEYPOT_MISS_PENALTY\s*=\s*(\d+)",
        honeypot_source,
        "miss penalty",
    )
    ceiling = _extract_integer(
        r"LEAST\((\d+),\s*integrity_score",
        honeypot_source,
        "integrity-score ceiling",
    )

    if "CronExpression.EVERY_6_HOURS" not in honeypot_source:
        raise ValueError("could not derive six-hour honeypot cadence from runtime source")

    return HoneypotRuntimeContract(
        threshold=threshold,
        correct_bonus=correct_bonus,
        miss_penalty=miss_penalty,
        ceiling=ceiling,
        cadence_hours=6,
    )
