"""Executable double-entry ledger invariant model."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Hashable, Iterable


@dataclass(frozen=True)
class Transaction:
    debit: Hashable
    credit: Hashable
    amount: int

    def validate(self) -> None:
        if not isinstance(self.amount, int):
            raise TypeError("amount must be integer cents")
        if self.amount <= 0:
            raise ValueError("amount must be strictly positive")
        if self.debit == self.credit:
            raise ValueError("debit and credit accounts must differ")


def run_ledger(transactions: Iterable[Transaction]) -> dict[Hashable, int]:
    balances: dict[Hashable, int] = {}
    for transaction in transactions:
        transaction.validate()
        balances[transaction.debit] = balances.get(transaction.debit, 0) + transaction.amount
        balances[transaction.credit] = balances.get(transaction.credit, 0) - transaction.amount
    return balances


def total_balance(transactions: Iterable[Transaction]) -> int:
    return sum(run_ledger(transactions).values())
