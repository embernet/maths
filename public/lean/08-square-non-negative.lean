-- 08-square-non-negative.lean
-- Companion to https://github.com/embernet/maths
-- For any integer n, n * n ≥ 0

import Mathlib.Tactic
import Mathlib.Data.Int.Order

namespace MathsCompanion

-- Using nlinarith with the hint sq_nonneg n
-- (sq_nonneg says 0 ≤ n^2; nlinarith deduces n*n ≥ 0)
theorem sq_nonneg' (n : Int) : n * n ≥ 0 := by
  nlinarith [sq_nonneg n]

-- Explicit sign split: more instructive
theorem sq_nonneg_explicit (n : Int) : n * n ≥ 0 := by
  rcases le_or_lt 0 n with h | h
  · -- Case: 0 ≤ n (non-negative)
    exact mul_nonneg h h
  · -- Case: n < 0 (negative)
    have hn : -n > 0 := by linarith
    have : n * n = (-n) * (-n) := by ring
    rw [this]
    exact mul_nonneg (le_of_lt hn) (le_of_lt hn)

-- The Mathlib version for reference:
#check Int.mul_self_nonneg
-- Int.mul_self_nonneg : ∀ (a : ℤ), 0 ≤ a * a

-- Works over ℝ too:
theorem sq_nonneg_real (x : Real) : x * x ≥ 0 := by
  nlinarith [sq_nonneg x]

end MathsCompanion
