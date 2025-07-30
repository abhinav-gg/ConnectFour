// Types for game components
export interface TimerHandle {
  start: () => void
  pause: () => void
  reset: () => void
  setTime: (seconds: number) => void
  increase: (seconds: number) => void
  decrease: (seconds: number) => void
}

export interface ScoreBarHandle {
  setRatio: (ratio: number) => void
  animatedScoreRatio: any // Expose the motion value for debugging
}
