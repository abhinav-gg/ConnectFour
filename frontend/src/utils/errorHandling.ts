/**
 * Frontend utilities for handling API errors with the error code system
 */

import { ErrorCode, getErrorMessage, ErrorResponse } from '@shared/constants/errorCodes';

/**
 * Parse API error response and extract error code
 */
export function parseApiError(response: any): ErrorResponse {
  // If it's already an ErrorResponse
  if (response && typeof response === 'object' && response.code && Object.values(ErrorCode).includes(response.code)) {
    return response as ErrorResponse;
  }
  
  // If it's a string error code
  if (typeof response === 'string' && Object.values(ErrorCode).includes(response as ErrorCode)) {
    return {
      code: response as ErrorCode,
      message: getErrorMessage(response as ErrorCode),
    };
  }
  
  // If it's an object with error property (common API format)
  if (response?.error) {
    const errorString = response.error;
    
    // Check if error contains an error code
    for (const code of Object.values(ErrorCode)) {
      if (errorString.includes(code)) {
        // Extract redirect info if present
        const redirectMatch = errorString.match(/: (.+)$/);
        return {
          code,
          message: getErrorMessage(code),
          ...(redirectMatch && { redirect: redirectMatch[1] }),
        };
      }
    }
    
    // Return the original error message if no code found
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: errorString,
    };
  }
  
  // Fallback for unknown error format
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: getErrorMessage(ErrorCode.UNKNOWN_ERROR),
  };
}

/**
 * Handle API error by redirecting to appropriate page
 */
export function handleApiError(error: ErrorResponse, router: any) {
  switch (error.code) {
    case ErrorCode.ALREADY_IN_GAME:
    case ErrorCode.ALREADY_IN_QUEUE:
      if (error.redirect) {
        router.push(`/game?r=${error.redirect}`);
      } else {
        router.push(`/play/setup?error=${error.code}`);
      }
      break;
    
    case ErrorCode.GAME_NOT_FOUND:
    case ErrorCode.GAME_FINISHED:
    case ErrorCode.GAME_ENDED:
    case ErrorCode.BOT_GAME_ENDED:
      router.push(`/play/setup?error=${error.code}`);
      break;
    
    case ErrorCode.NOT_AUTHENTICATED:
    case ErrorCode.SESSION_EXPIRED:
      router.push('/login');
      break;
    
    default:
      router.push(`/play/setup?error=${error.code}`);
      break;
  }
}

/**
 * Create a URL with error parameter
 */
export function createErrorUrl(basePath: string, errorCode: ErrorCode): string {
  return `${basePath}?error=${errorCode}`;
}