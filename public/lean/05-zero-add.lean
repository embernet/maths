-- 05-zero-add.lean
-- Companion to https://github.com/embernet/maths
-- 0 + n = n: the first induction proof (rfl cannot close this one)

import Mathlib.Tactic

namespace MathsCompanion

-- Using simp with the inductive hypothesis
theorem zero_add' (n : Nat) : 0 + n = n := by
  induction n with
  | zero      => rfl
  | succ k ih => simp [Nat.add_succ, ih]

-- Explicit rw version: shows each step clearly
theorem zero_add_rw (n : Nat) : 0 + n = n := by
  induction n with
  | zero      => rfl
  | succ k ih =>
    rw [Nat.add_succ]
    rw [ih]

-- The Mathlib version:
#check @Nat.zero_add
-- Nat.zero_add : ∀ (n : ℕ), 0 + n = n

end MathsCompanion
