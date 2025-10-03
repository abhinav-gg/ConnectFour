import { logger, printl } from './logger';

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
  logger.debug("Evaluation:", evaluation);
  if (evaluation === -1000 || Math.abs(evaluation) === 9999) {
    return "gray" // Full column or invalid
  } else if (evaluation === 0) {
    return "gray" // Draw
  } else if (evaluation > 0) {
    return "red" // red player winning
  } else {
    return "yellow" // yellow player winning
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
  } else if (Math.abs(evaluation) === 9999) {
    return "-"
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
  if (evaluation === -1000 || evaluation === 0  || Math.abs(evaluation) === 9999) {
    return "bg-gray-600 text-white"
  } else if (evaluation > 0) {
    return "bg-brand-accent-red text-white" // Changed to white text
  } else {
    return "bg-brand-accent-yellow text-white"
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


export function playableEvaluation(evaluation: number): boolean {
  return evaluation !== -1000 && Math.abs(evaluation) !== 9999
}