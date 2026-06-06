-- 10-infinitude-of-primes.lean
-- Companion to https://github.com/embernet/maths
-- Euclid's proof: there are infinitely many primes

import Mathlib.Tactic
import Mathlib.Data.Nat.Prime.Basic
import Mathlib.Data.Nat.Factorial.Basic

namespace MathsCompanion

-- For any n, there exists a prime p > n.
-- This is Euclid's argument: consider n! + 1.
theorem euclid_infinitely_many_primes (n : Nat) : ∃ p, n < p ∧ Nat.Prime p := by
  -- n! + 1 is positive (needed to get a prime factor)
  have hM_pos : 0 < n.factorial + 1 := Nat.succ_pos _
  -- n! + 1 has a prime factor p
  obtain ⟨p, hp_prime, hp_dvd⟩ :=
    Nat.exists_prime_and_dvd (Nat.pos_iff_ne_zero.mp hM_pos)
  refine ⟨p, ?_, hp_prime⟩
  -- Show p > n by contradiction: if p ≤ n then p ∣ n! and p ∣ 1, impossible
  by_contra h_le
  push_neg at h_le
  -- p ≤ n implies p ∣ n!
  have hp_dvd_fact : p ∣ n.factorial :=
    hp_prime.dvd_factorial.mpr (Nat.lt_succ_of_le (Nat.le_of_succ_le_succ h_le))
  -- p divides (n! + 1) - n! = 1
  have hp_dvd_one : p ∣ 1 := by
    have h := Nat.dvd_sub' hp_dvd hp_dvd_fact
    simpa [Nat.add_sub_cancel] using h
  -- But a prime is > 1, so it cannot divide 1
  exact absurd (Nat.le_of_dvd Nat.one_pos hp_dvd_one) (Nat.not_succ_le_self 1 ∘ Nat.lt_of_lt_pred hp_prime.one_lt)

-- Mathlib's canonical version (the set of primes is infinite):
#check Nat.infinite_setOf_prime
-- Set.Infinite {p | Nat.Prime p}

-- Mathlib also has:
#check Nat.exists_infinite_primes
-- Nat.exists_infinite_primes : ∀ (n : ℕ), ∃ p, n ≤ p ∧ Nat.Prime p

end MathsCompanion
