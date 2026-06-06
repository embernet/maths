-- 13-fermat-little.lean
-- Companion to https://github.com/embernet/maths
-- Fermat's little theorem: a^p = a in ZMod p (for prime p)

import Mathlib.Tactic
import Mathlib.Data.ZMod.Basic
import Mathlib.FieldTheory.Finite.Basic

namespace MathsCompanion

-- Fermat's little theorem in ZMod p.
-- For any prime p and any a : ZMod p, a^p = a.
-- The Mathlib lemma is ZMod.pow_card.
-- (If this name has changed, use `exact?` or search mathlib4_docs.)
example (p : ℕ) [hp : Fact p.Prime] (a : ZMod p) : a ^ p = a :=
  ZMod.pow_card a

-- Classical form: p ∣ a^p - a for any integer a
theorem fermat_little_int (p : ℕ) (hp : p.Prime) (a : ℤ) : (p : ℤ) ∣ a ^ p - a := by
  have hzmod : (a : ZMod p) ^ p = a := by
    haveI : Fact p.Prime := ⟨hp⟩
    exact ZMod.pow_card a
  rw [show a ^ p - a = a ^ p + (-1) * a by ring]
  have : (↑(a ^ p + (-1) * a) : ZMod p) = 0 := by push_cast; simp [hzmod]
  exact_mod_cast (ZMod.intCast_zmod_eq_zero_iff_dvd _ p).mp this

-- The multiplicative form: a^(p-1) = 1 when a ≠ 0 in ZMod p
-- (equivalently, a is a unit in ZMod p when p is prime and p ∤ a)
-- Mathlib has ZMod.units_pow_card_sub_one_eq_one or similar.
-- Use #check or exact? to find the current name:
#check ZMod.pow_card
-- ZMod.pow_card : ∀ {p : ℕ} [inst : Fact (Nat.Prime p)] (x : ZMod p), x ^ p = x

end MathsCompanion
