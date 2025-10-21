/**
 * Centralized error codes for the Connect Four application
 * These codes are used across frontend and backend to ensure consistent error handling
 */

export const ShortcodeGameLink = (shortcode: string) => `/game?room=${shortcode}`;

export enum ErrorCode {
  // Game-related errors
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  GAME_FINISHED = 'GAME_FINISHED',
  GAME_ENDED = 'GAME_ENDED',
  BOT_GAME_ENDED = 'BOT_GAME_ENDED',
  
  // User state errors
  ALREADY_IN_GAME = 'ALREADY_IN_GAME',
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  CANNOT_LEAVE_ACTIVE_GAME = 'CANNOT_LEAVE_ACTIVE_GAME',
  
  // Connection and network errors
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Authentication errors
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation errors
  INVALID_GAME_MODE = 'INVALID_GAME_MODE',
  INVALID_TIME_CONTROL = 'INVALID_TIME_CONTROL',
  INVALID_MOVE = 'INVALID_MOVE',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

/**
 * User-friendly error messages mapped to error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Game-related errors
  [ErrorCode.GAME_NOT_FOUND]: 'The game you were trying to join no longer exists or has ended.',
  [ErrorCode.GAME_FINISHED]: 'That game has already finished. You can start a new game below.',
  [ErrorCode.GAME_ENDED]: 'This game has ended. Please start a new game.',
  [ErrorCode.BOT_GAME_ENDED]: 'Bot games end automatically when players disconnect. Please start a new game.',
  
  // User state errors
  [ErrorCode.ALREADY_IN_GAME]: 'You are already in another game. Please finish that game first.',
  [ErrorCode.ALREADY_IN_QUEUE]: 'You are already waiting for a game in the matchmaking queue.',
  [ErrorCode.CANNOT_LEAVE_ACTIVE_GAME]: 'You cannot leave the queue while in an active game. Please finish or resign from your current game first.',
  
  // Connection and network errors
  [ErrorCode.CONNECTION_ERROR]: 'Connection error occurred. Please try again.',
  [ErrorCode.WEBSOCKET_ERROR]: 'Real-time connection error. Please refresh the page.',
  [ErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  
  // Authentication errors
  [ErrorCode.NOT_AUTHENTICATED]: 'You need to be logged in to perform this action.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  
  // Validation errors
  [ErrorCode.INVALID_GAME_MODE]: 'Invalid game mode selected. Please choose a valid option.',
  [ErrorCode.INVALID_TIME_CONTROL]: 'Invalid time control settings. Please check your configuration.',
  [ErrorCode.INVALID_MOVE]: 'Invalid move. Please try a different column.',
  [ErrorCode.NOT_YOUR_TURN]: 'It\'s not your turn to move.',
  
  // Generic errors
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.OPERATION_FAILED]: 'The operation failed. Please try again.',
};

/**
 * Utility function to get error message from error code
 */
export function getErrorMessage(errorCode: ErrorCode | string): string {
  if (typeof errorCode === 'string' && errorCode in ErrorCode) {
    return ErrorMessages[errorCode as ErrorCode];
  }
  return ErrorMessages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Type for error responses that include both code and message
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: string;
  redirect?: string;
}

/**
 * Utility function to create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode, 
  details?: string, 
  redirect?: string
): ErrorResponse {
  return {
    code,
    message: ErrorMessages[code],
    ...(details && { details }),
    ...(redirect && { redirect }),
  };
}