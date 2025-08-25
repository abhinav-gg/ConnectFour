/**
 * Evaluation color utilities for Connect 4 analysis
 * Handles mapping evaluation numbers to colors and display text
 * 
 * EVALUATION SEMANTICS:
 * - Positive values: Current player (to move) is winning
 * - Negative values: Current player (to move) is losing  
 * - Zero: Draw position
 * - -1000: Invalid/Full column
 */

export type EvaluationColor = "red" | "yellow" | "gray"

/**
 * Get the color for an evaluation number
 * @param evaluation Raw evaluation number (-43 to 43, -1000 for invalid/full)
 * @returns Color type for the evaluation
 */
export function getEvaluationColor(evaluation: number): EvaluationColor {
  if (evaluation === -1000) {
    return "gray" // Full column or invalid
  } else if (evaluation === 0) {
    return "gray" // Draw
  } else if (evaluation > 0) {
    return "yellow" // Yellow/second player winning
  } else {
    return "red" // Red/first player winning
  }
}

/**
 * Get the display text for an evaluation number
 * @param evaluation Raw evaluation number (-43 to 43, -1000 for invalid/full)
 * @returns Formatted display text (M41, DRAW, FULL, etc.)
 */
export function getEvaluationText(evaluation: number): string {
  if (evaluation === -1000) {
    return "FULL"
  } else if (evaluation === 0) {
    return "DRAW"
  } else {
    const absEval = Math.abs(evaluation)
    return `M${absEval}`
  }
}

/**
 * Get Tailwind CSS classes for evaluation badge background
 * @param evaluation Raw evaluation number (-43 to 43, -1000 for invalid/full)
 * @returns Tailwind CSS classes for badge styling
 */
export function getEvaluationBadgeClasses(evaluation: number): string {
  console.log("getEvaluationBadgeClasses called with evaluation:", evaluation)
  
  if (evaluation === -1000 || evaluation === 0) {
    console.log("Returning gray badge classes")
    return "bg-gray-600 text-white"
  } else if (evaluation > 0) {
    console.log("Returning yellow badge classes (positive evaluation)")
    return "bg-brand-accent-yellow text-white" // Changed to white text
  } else {
    console.log("Returning red badge classes (negative evaluation)")
    return "bg-brand-accent-red text-white"
  }
}

/**
 * Get Tailwind CSS classes for column analysis background
 * @param evaluation Raw evaluation number (-43 to 43, -1000 for invalid/full)
 * @returns Tailwind CSS classes for column background
 */
export function getEvaluationBackgroundClasses(evaluation: number): string {
  const color = getEvaluationColor(evaluation)
  switch (color) {
    case "red":
      return "bg-brand-accent-red"
    case "yellow":
      return "bg-brand-accent-yellow"
    case "gray":
      return "bg-brand-text-muted"
    default:
      return "bg-brand-text-muted"
  }
}