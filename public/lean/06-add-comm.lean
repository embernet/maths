-- 06-add-comm.lean
-- Companion to https://github.com/embernet/maths
-- Addition is commutative: m + n = n + m, proved by compound induction

import Mathlib.Tactic

namespace MathsCompanion

-- Auxiliary: m + (n + 1) = (m + n) + 1  (this is Nat.add_succ, proved by rfl)
theorem add_succ' (m n : Nat) : m + n.succ = (m + n).succ := rfl

-- We need zero_add as a stepping stone
theorem zero_add' (n : Nat) : 0 + n = n := by
  induction n with
  | zero      => rfl
  | succ k ih => simp [Nat.add_succ, ih]

-- Main theorem: addition is commutative
theorem add_comm' (m n : Nat) : m + n = n + m := by
  induction n with
  | zero =>
    -- Goal: m + 0 = 0 + m
    simp [zero_add', Nat.add_zero]
  | succ k ih =>
    -- Goal: m + (k + 1) = (k + 1) + m
    -- ih : m + k = k + m
    rw [Nat.add_succ, ih, Nat.succ_add]

-- The Mathlib version:
#check @Nat.add_comm
-- Nat.add_comm : ∀ (n m : ℕ), n + m = m + n

end MathsCompanion
