from __future__ import annotations

from fractions import Fraction
from pathlib import Path
import random
import sys
import unittest

import numpy as np
from PIL import Image, ImageEnhance

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from styx_ledger import Transaction, run_ledger, total_balance
from t7_markov import exact_expected_cycles, simulate_cycles
from t9_hamming import hamming_ball_probability, hamming_distance, phash64


class LedgerInvariantTests(unittest.TestCase):
    def test_empty_ledger(self) -> None:
        self.assertEqual(total_balance([]), 0)

    def test_random_valid_sequences(self) -> None:
        random_source = random.Random(444499)
        accounts = ["a", "b", "c", "d", "e"]
        for _ in range(200):
            transactions = []
            for _ in range(random_source.randint(0, 200)):
                debit, credit = random_source.sample(accounts, 2)
                transactions.append(
                    Transaction(debit, credit, random_source.randint(1, 100_000))
                )
            self.assertEqual(sum(run_ledger(transactions).values()), 0)

    def test_guards(self) -> None:
        with self.assertRaises(ValueError):
            run_ledger([Transaction("a", "a", 10)])
        with self.assertRaises(ValueError):
            run_ledger([Transaction("a", "b", 0)])
        with self.assertRaises(TypeError):
            run_ledger([Transaction("a", "b", 1.5)])


class MarkovRepairTests(unittest.TestCase):
    def test_deterministic_threshold_is_seven_cycles(self) -> None:
        self.assertEqual(exact_expected_cycles(Fraction(0)), 7)

    def test_unbiased_reflecting_chain_is_196_cycles(self) -> None:
        self.assertEqual(exact_expected_cycles(Fraction(1, 2)), 196)

    def test_positive_drift_is_finite_when_failure_probability_is_nonzero(self) -> None:
        cycles = exact_expected_cycles(Fraction(4, 5))
        self.assertGreater(cycles, 1_000_000)
        self.assertLess(cycles, 100_000_000_000)

    def test_monte_carlo_matches_exact_for_rho_point_four(self) -> None:
        exact = float(exact_expected_cycles(Fraction(2, 5)))
        simulated = simulate_cycles(0.4, trials=12_000, seed=444499)
        self.assertLess(abs(simulated - exact) / exact, 0.06)

    def test_rho_one_is_infinite(self) -> None:
        with self.assertRaises(ArithmeticError):
            exact_expected_cycles(Fraction(1))


class HammingRepairTests(unittest.TestCase):
    def test_exact_null_probability(self) -> None:
        numerator, denominator, probability = hamming_ball_probability(64, 5)
        self.assertEqual(numerator, 679_121)
        self.assertEqual(denominator, 2**64)
        self.assertAlmostEqual(probability, 3.681522317902641e-14, places=28)

    def test_identical_images_have_zero_distance(self) -> None:
        array = np.tile(np.arange(256, dtype=np.uint8), (256, 1))
        image = Image.fromarray(array, mode="L")
        self.assertEqual(hamming_distance(phash64(image), phash64(image.copy())), 0)

    def test_brightness_change_remains_near(self) -> None:
        array = np.tile(np.arange(256, dtype=np.uint8), (256, 1))
        image = Image.fromarray(array, mode="L")
        brighter = ImageEnhance.Brightness(image).enhance(1.15)
        self.assertLessEqual(hamming_distance(phash64(image), phash64(brighter)), 5)

    def test_unrelated_structures_are_not_identical(self) -> None:
        gradient = Image.fromarray(
            np.tile(np.arange(256, dtype=np.uint8), (256, 1)), mode="L"
        )
        checker = ((np.indices((256, 256)).sum(axis=0) // 16) % 2 * 255).astype(
            np.uint8
        )
        checker_image = Image.fromarray(checker, mode="L")
        self.assertGreater(
            hamming_distance(phash64(gradient), phash64(checker_image)), 5
        )


if __name__ == "__main__":
    unittest.main()
