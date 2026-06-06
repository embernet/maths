-- 07-divides-trans.lean
-- Companion to https://github.com/embernet/maths
-- Divisibility is transitive: a ∣ b ∧ b ∣ c → a ∣ c

import Mathlib.Tactic

namespace MathsCompanion

-- Main proof using obtain to destructure existentials
theorem dvd_trans' (a b c : Nat) (h1 : a ∣ b) (h2 : b ∣ c) : a ∣ c := by
  obtain ⟨k, hk⟩ := h1   -- b = a * k
  obtain ⟨j, hj⟩ := h2   -- c = b * j
  exact ⟨k * j, by rw [hj, hk, Nat.mul_assoc]⟩

-- Alternative using `use` tactic
theorem dvd_trans'' (a b c : Nat) (h1 : a ∣ b) (h2 : b ∣ c) : a ∣ c := by
  obtain ⟨k, hk⟩ := h1
  obtain ⟨j, hj⟩ := h2
  use k * j
  rw [hj, hk, Nat.mul_assoc]

-- Reflexivity of divisibility (every number divides itself)
theorem dvd_refl' (a : Nat) : a ∣ a :=
  ⟨1, by simp⟩

-- The Mathlib version:
#check @dvd_trans
-- dvd_trans : ∀ {α : Type u_1} [inst : Trans (· ∣ ·) (· ∣ ·) (· ∣ ·)] {a b c : α},
--   a ∣ b → b ∣ c → a ∣ c

end MathsCompanion
