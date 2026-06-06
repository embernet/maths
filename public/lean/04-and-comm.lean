-- 04-and-comm.lean
-- Companion to https://github.com/embernet/maths
-- Conjunction is commutative: p ∧ q → q ∧ p

import Mathlib.Tactic

namespace MathsCompanion

-- Tactic-style proof using intro and exact
theorem and_comm (p q : Prop) : p ∧ q → q ∧ p := by
  intro h
  exact ⟨h.2, h.1⟩

-- Term-style proof (functions and pairs)
theorem and_comm' (p q : Prop) : p ∧ q → q ∧ p :=
  fun h => ⟨h.2, h.1⟩

-- Using constructor to split the conjunction goal
theorem and_comm'' (p q : Prop) : p ∧ q → q ∧ p := by
  intro h
  constructor
  · exact h.2
  · exact h.1

-- Bonus: if-and-only-if version
theorem and_comm_iff (p q : Prop) : p ∧ q ↔ q ∧ p :=
  ⟨fun h => ⟨h.2, h.1⟩, fun h => ⟨h.2, h.1⟩⟩

end MathsCompanion
