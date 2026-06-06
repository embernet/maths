-- 03-add-zero.lean
-- Companion to https://github.com/embernet/maths
-- n + 0 = n: a one-line rfl proof from the definition of Nat.add

import Mathlib.Tactic

namespace MathsCompanion

-- The main theorem: n + 0 = n
-- rfl works because Nat.add is defined recursively on the second argument,
-- and the base case is exactly: Nat.add n 0 := n.
theorem add_zero' (n : Nat) : n + 0 = n := rfl

-- Tactic-mode version (identical result, more explicit style)
theorem add_zero_tactic (n : Nat) : n + 0 = n := by
  rfl

-- The Mathlib version is Nat.add_zero; we can check it exists:
#check @Nat.add_zero
-- Nat.add_zero : ∀ (n : ℕ), n + 0 = n

end MathsCompanion
