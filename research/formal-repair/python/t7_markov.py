"""Exact and simulated honeypot-score hitting times for Styx T7.

The code-defined restricted condition is score < threshold. With threshold=20
and step=5, the absorbing scores are 0, 5, 10, and 15. The upper score clamp at
100 is modeled exactly as a sticky/reflecting boundary.
"""
from __future__ import annotations

from fractions import Fraction
import random
from typing import Iterable


def _solve_linear_system(
    coefficients: list[list[Fraction]], constants: list[Fraction]
) -> list[Fraction]:
    """Gauss-Jordan elimination over exact rational numbers."""
    size = len(constants)
    augmented = [row[:] + [constant] for row, constant in zip(coefficients, constants)]
    for column in range(size):
        pivot = next(
            (row for row in range(column, size) if augmented[row][column] != 0),
            None,
        )
        if pivot is None:
            raise ArithmeticError("singular system; expected hitting time may be infinite")
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            if factor:
                augmented[row] = [
                    current - factor * pivot_value
                    for current, pivot_value in zip(augmented[row], augmented[column])
                ]
    return [augmented[index][-1] for index in range(size)]


def exact_expected_cycles(
    rho: Fraction | float | str,
    *,
    start: int = 50,
    threshold: int = 20,
    step: int = 5,
    ceiling: int = 100,
) -> Fraction:
    """Return E[tau] for first score strictly below threshold.

    When rho == 1, absorption is impossible and the expectation is infinite;
    this function raises ArithmeticError rather than returning a fake number.
    """
    probability_up = rho if isinstance(rho, Fraction) else Fraction(str(rho))
    if not (0 <= probability_up <= 1):
        raise ValueError("rho must be in [0, 1]")
    if probability_up == 1:
        raise ArithmeticError("absorption is impossible when rho == 1")
    if start < threshold:
        return Fraction(0)

    states = list(range(threshold, ceiling + 1, step))
    index = {score: position for position, score in enumerate(states)}
    size = len(states)
    coefficients = [
        [Fraction(int(row == column)) for column in range(size)]
        for row in range(size)
    ]
    constants = [Fraction(1) for _ in range(size)]
    probability_down = 1 - probability_up

    for score in states:
        row = index[score]
        up = min(ceiling, score + step)
        down = max(0, score - step)
        if up >= threshold:
            coefficients[row][index[up]] -= probability_up
        if down >= threshold:
            coefficients[row][index[down]] -= probability_down

    solution = _solve_linear_system(coefficients, constants)
    return solution[index[start]]


def simulate_cycles(
    rho: float,
    *,
    trials: int = 10_000,
    seed: int = 444499,
    start: int = 50,
    threshold: int = 20,
    step: int = 5,
    ceiling: int = 100,
    max_cycles: int = 2_000_000,
) -> float:
    """Monte Carlo estimate; raises if a trial exceeds max_cycles."""
    if not (0 <= rho < 1):
        raise ValueError("simulation requires 0 <= rho < 1")
    random_source = random.Random(seed)
    total_cycles = 0
    for _ in range(trials):
        score = start
        cycles = 0
        while score >= threshold:
            cycles += 1
            if cycles > max_cycles:
                raise RuntimeError("trial exceeded max_cycles")
            score += step if random_source.random() < rho else -step
            score = max(0, min(ceiling, score))
        total_cycles += cycles
    return total_cycles / trials


def reference_table(
    rhos: Iterable[Fraction] = (
        Fraction(0),
        Fraction(1, 5),
        Fraction(2, 5),
        Fraction(1, 2),
        Fraction(3, 5),
    )
) -> list[tuple[Fraction, Fraction]]:
    return [(rho, exact_expected_cycles(rho)) for rho in rhos]


if __name__ == "__main__":
    for rho, cycles in reference_table():
        print(f"rho={float(rho):.1f}: exact cycles={float(cycles):.6g} ({cycles})")
