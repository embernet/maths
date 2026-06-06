-- 11-sum-of-first-n.lean
-- Companion to https://github.com/embernet/maths
-- Gauss sum: 2 * (0 + 1 + ... + n) = n * (n + 1)

import Mathlib.Tactic
import Mathlib.Algebra.BigOperators.Group.Finset

namespace MathsCompanion

open Finset

-- Main theorem: 2 * (∑ i in range (n+1), i) = n * (n + 1)
theorem gauss_sum (n : Nat) :
    2 * (∑ i in range (n + 1), i) = n * (n + 1) := by
  induction n with
  | zero => simp
  | succ k ih =>
    rw [sum_range_succ]
    ring_nf
    linarith

-- Alternative with explicit ring step
theorem gauss_sum' (n : Nat) :
    2 * (∑ i in range (n + 1), i) = n * (n + 1) := by
  induction n with
  | zero => rfl
  | succ k ih =>
    rw [sum_range_succ, Nat.mul_add, ih]
    ring

-- Mathlib has this directly:
#check Finset.sum_range_id_mul_two
-- Finset.sum_range_id_mul_two : ∀ (n : ℕ), (∑ i in Finset.range n, i) * 2 = n * (n - 1)
-- (Note: check the exact statement — Mathlib uses a slightly different indexing
--  convention. Use exact? if you need the precise form.)

-- Gauss sum as a corollary (computing an example):
#eval 2 * (Finset.range 11 |>.sum id)   -- should be 110 = 10 * 11

end MathsCompanion
