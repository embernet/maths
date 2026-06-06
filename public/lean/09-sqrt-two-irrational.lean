-- 09-sqrt-two-irrational.lean
-- Companion to https://github.com/embernet/maths
-- √2 is irrational: the classical parity-and-descent proof in Lean 4

import Mathlib.Tactic
import Mathlib.Data.Real.Irrational
import Mathlib.Data.Int.GCD

namespace MathsCompanion

-- The direct statement using Mathlib's Irrational predicate.
-- irrational_sqrt_two is the canonical Mathlib lemma.
-- (If this name has changed in your Mathlib version, use `exact?`
--  or search https://leanprover-community.github.io/mathlib4_docs)
theorem sqrt_two_irrational' : Irrational (Real.sqrt 2) :=
  irrational_sqrt_two

-- Pedagogical lemma: the key step in the classical proof
-- If 2 divides n^2 (over ℤ), then 2 divides n.
-- This uses the fact that 2 is prime.
lemma two_dvd_of_sq {n : Int} (h : 2 ∣ n ^ 2) : 2 ∣ n := by
  have hp : Prime (2 : Int) := by decide
  exact hp.dvd_of_dvd_pow h

-- Consequence: if 2 divides n^2 and 2 divides n, then 4 divides n^2.
lemma four_dvd_of_two_dvd_sq {n : Int} (hn : 2 ∣ n) : 4 ∣ n ^ 2 := by
  obtain ⟨k, hk⟩ := hn
  exact ⟨k ^ 2, by rw [hk]; ring⟩

-- The full classical proof structure (sketch):
-- Assume p^2 = 2 * q^2, gcd(p,q) = 1.
-- Step 1: 2 ∣ p^2, so 2 ∣ p (by two_dvd_of_sq).
-- Step 2: 4 ∣ p^2 (by four_dvd_of_two_dvd_sq), so 2 ∣ q^2, so 2 ∣ q.
-- Step 3: 2 ∣ gcd(p,q) = 1 — contradiction.
-- The full formalisation uses Nat.Coprime; see irrational_sqrt_two in Mathlib.

#check irrational_sqrt_two
-- irrational_sqrt_two : Irrational (√2)

end MathsCompanion
