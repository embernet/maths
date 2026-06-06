-- 14-monotone-convergence.lean
-- Companion to https://github.com/embernet/maths
-- A bounded monotone sequence of reals converges (to its supremum)

import Mathlib.Tactic
import Mathlib.Topology.Algebra.Order.LiminfLimsup
import Mathlib.Order.BoundedOrder

namespace MathsCompanion

-- A monotone bounded-above sequence a : ℕ → ℝ converges to sup(range a).
-- The key Mathlib lemma is tendsto_atTop_ciSup.
-- (If this name has changed, use exact? or search mathlib4_docs for
--  "monotone convergence" or "tendsto_atTop".)
theorem monotone_convergence
    (a : ℕ → ℝ)
    (hmono : Monotone a)
    (hbdd : BddAbove (Set.range a)) :
    ∃ L : ℝ, Filter.Tendsto a Filter.atTop (nhds L) := by
  exact ⟨iSup (fun n => a n), tendsto_atTop_ciSup hmono hbdd⟩

-- The decreasing (antitone) case: converges to infimum
theorem antitone_convergence
    (a : ℕ → ℝ)
    (hanti : Antitone a)
    (hbdd : BddBelow (Set.range a)) :
    ∃ L : ℝ, Filter.Tendsto a Filter.atTop (nhds L) := by
  exact ⟨iInf (fun n => a n), tendsto_atTop_ciInf hanti hbdd⟩

-- Reference: the Mathlib lemma we are using
#check @tendsto_atTop_ciSup
-- tendsto_atTop_ciSup :
--   Monotone f → BddAbove (Set.range f) →
--   Filter.Tendsto f Filter.atTop (nhds (⨆ i, f i))

-- Example: the sequence 1 - 1/(n+1) is monotone and bounded, converges to 1
example : Filter.Tendsto (fun n : ℕ => 1 - 1 / (n + 1 : ℝ)) Filter.atTop (nhds 1) := by
  have : Filter.Tendsto (fun n : ℕ => 1 - 1 / (n + 1 : ℝ)) Filter.atTop (nhds (1 - 0)) := by
    apply Filter.Tendsto.const_sub
    simp_rw [div_eq_mul_inv]
    apply Filter.Tendsto.const_mul_atTop_nhds_zero
    · norm_num
    · exact tendsto_inv_atTop_zero.comp (tendsto_natCast_atTop_atTop.add tendsto_const_nhds)
  simpa using this

end MathsCompanion
