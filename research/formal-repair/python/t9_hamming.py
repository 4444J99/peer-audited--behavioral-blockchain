"""Exact Hamming null probability and a DCT-based 64-bit perceptual hash."""
from __future__ import annotations

from dataclasses import dataclass
from math import comb
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image
from scipy.fft import dctn


def hamming_ball_probability(bits: int = 64, threshold: int = 5) -> tuple[int, int, float]:
    """P[Hamming distance < threshold] for independent uniform bit strings."""
    if not (0 <= threshold <= bits + 1):
        raise ValueError("threshold must be in [0, bits+1]")
    numerator = sum(comb(bits, distance) for distance in range(threshold))
    denominator = 1 << bits
    return numerator, denominator, numerator / denominator


def phash64(image: Image.Image | str | Path) -> int:
    """Return a 64-bit DCT perceptual hash.

    The median excludes the DC coefficient while all 64 low-frequency
    coefficients contribute output bits.
    """
    if not isinstance(image, Image.Image):
        image = Image.open(image)
    grayscale = image.convert("L").resize((32, 32), Image.Resampling.LANCZOS)
    pixels = np.asarray(grayscale, dtype=np.float64)
    coefficients = dctn(pixels, type=2, norm="ortho")
    low_frequency = coefficients[:8, :8].copy()
    median = float(np.median(low_frequency.reshape(-1)[1:]))
    bits = (low_frequency > median).reshape(-1)
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return value


def hamming_distance(left: int, right: int) -> int:
    return (left ^ right).bit_count()


@dataclass(frozen=True)
class LabeledPair:
    left: Path
    right: Path
    is_duplicate: bool


def evaluate_pairs(pairs: Iterable[LabeledPair], threshold: int) -> dict[str, float | int]:
    true_positive = false_positive = true_negative = false_negative = 0
    distances: list[int] = []
    for pair in pairs:
        distance = hamming_distance(phash64(pair.left), phash64(pair.right))
        distances.append(distance)
        predicted_duplicate = distance < threshold
        if pair.is_duplicate and predicted_duplicate:
            true_positive += 1
        elif pair.is_duplicate:
            false_negative += 1
        elif predicted_duplicate:
            false_positive += 1
        else:
            true_negative += 1
    precision = (
        true_positive / (true_positive + false_positive)
        if true_positive + false_positive
        else 0.0
    )
    recall = (
        true_positive / (true_positive + false_negative)
        if true_positive + false_negative
        else 0.0
    )
    return {
        "threshold": threshold,
        "tp": true_positive,
        "fp": false_positive,
        "tn": true_negative,
        "fn": false_negative,
        "precision": precision,
        "recall": recall,
        "mean_distance": float(np.mean(distances)) if distances else 0.0,
    }


if __name__ == "__main__":
    numerator, denominator, probability = hamming_ball_probability()
    print(f"{numerator}/{denominator} = {probability:.16e}")
