-- 12-binomial-theorem-base-case.lean
-- Companion to https://github.com/embernet/maths
-- (x + y)^2 = x^2 + 2xy + y^2 by ring; and the general binomial theorem (add_pow)

import Mathlib.Tactic
import Mathlib.RingTheory.Binomial

namespace MathsCompanion

-- The binomial square: closed by ring in one line
theorem sq_sum (x y : ℤ) : (x + y) ^ 2 = x ^ 2 + 2 * x * y + y ^ 2 := by
  ring

-- Works for any commutative ring:
theorem sq_sum_comm_ring {R : Type*} [CommRing R] (x y : R) :
    (x + y) ^ 2 = x ^ 2 + 2 * x * y + y ^ 2 := by
  ring

-- Cube expansion, also by ring:
theorem cube_sum (x y : ℤ) :
    (x + y) ^ 3 = x ^ 3 + 3 * x ^ 2 * y + 3 * x * y ^ 2 + y ^ 3 := by
  ring

-- The general binomial theorem is add_pow in Mathlib:
-- add_pow (x y : R) (n : ℕ) :
--   (x + y) ^ n = ∑ k in Finset.range (n + 1), x ^ k * y ^ (n - k) * n.choose k
-- This holds for any CommSemiring R.
-- (Note: confirm the exact form with #check — the exponent order x^k * y^(n-k)
--  vs x^(n-k) * y^k may differ from your textbook convention.)
#check add_pow
-- add_pow : ∀ {R : Type u_1} [inst : CommSemiring R] (x y : R) (n : ℕ),
--   (x + y) ^ n = ∑ k ∈ Finset.range (n + 1), x ^ k * y ^ (n - k) * ↑(n.choose k)

-- Recovering the base case n = 2 from add_pow:
example (x y : ℤ) :
    (x + y) ^ 2 = ∑ k in Finset.range 3, x ^ k * y ^ (2 - k) * (Nat.choose 2 k) := by
  rw [add_pow]

end MathsCompanion
