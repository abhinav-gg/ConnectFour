/**
 * Enhanced Logging Utility for ConnectFour Frontend
 * 
 * Provides conditional logging with levels, performance optimizations,
 * and tree-shaking support for production builds.
 * 
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Environment-based conditional logging
 * - Tree-shaking support (logs removed in production builds)
 * - Emoji categorization for easy debugging
 * - Performance monitoring
 * - Structured logging format
 */

import { myConfig } from '@/config/env';

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// Configuration
const LOG_CONFIG = {
  // Current log level - only logs at this level or higher will be shown
  level: myConfig.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  
  // Enable/disable logging entirely
  enabled: myConfig.NODE_ENV !== 'production',
  
  // Enable performance timing
  enableTiming: myConfig.NODE_ENV === 'development',
  
  // Enable stack traces for errors
  enableStackTrace: myConfig.NODE_ENV === 'development',
};

// Internal logging function with conditional compilation
function logInternal(level: LogLevel, category: string, ...args: any[]): void {
  // Early return for performance - this gets tree-shaken in production
  if (!LOG_CONFIG.enabled || level < LOG_CONFIG.level) {
    return;
  }

  const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const levelName = levelNames[level] || 'LOG';
  
  // Create structured log prefix
  const prefix = `[${timestamp}] ${levelName} ${category}`;
  
  // Use appropriate console method based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(prefix, ...args);
      break;
    case LogLevel.INFO:
      console.info(prefix, ...args);
      break;
    case LogLevel.WARN:
      console.warn(prefix, ...args);
      break;
    case LogLevel.ERROR:
      console.error(prefix, ...args);
      if (LOG_CONFIG.enableStackTrace && args[0] instanceof Error) {
        console.error('Stack trace:', args[0].stack);
      }
      break;
    default:
      console.log(prefix, ...args);
  }
}

// Performance timing utilities
const timers = new Map<string, number>();

/**
 * Enhanced logging functions with emoji categorization
 */
export const logger = {
  // General purpose logging (replaces console.log)
  debug: (...args: any[]) => logInternal(LogLevel.DEBUG, '🐛', ...args),
  info: (...args: any[]) => logInternal(LogLevel.INFO, 'ℹ️', ...args),
  warn: (...args: any[]) => logInternal(LogLevel.WARN, '⚠️', ...args),
  error: (...args: any[]) => logInternal(LogLevel.ERROR, '❌', ...args),

  // Categorized logging for different parts of the app
  api: (...args: any[]) => logInternal(LogLevel.INFO, '🌐 API', ...args),
  auth: (...args: any[]) => logInternal(LogLevel.INFO, '🔐 AUTH', ...args),
  game: (...args: any[]) => logInternal(LogLevel.INFO, '🎮 GAME', ...args),
  bot: (...args: any[]) => logInternal(LogLevel.INFO, '🤖 BOT', ...args),
  socket: (...args: any[]) => logInternal(LogLevel.INFO, '🔌 SOCKET', ...args),
  ui: (...args: any[]) => logInternal(LogLevel.DEBUG, '🎨 UI', ...args),
  performance: (...args: any[]) => logInternal(LogLevel.DEBUG, '⚡ PERF', ...args),
  
  // Performance timing
  time: (label: string) => {
    if (LOG_CONFIG.enableTiming) {
      timers.set(label, performance.now());
      logInternal(LogLevel.DEBUG, '⏱️ TIMER', `Started: ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (LOG_CONFIG.enableTiming && timers.has(label)) {
      const startTime = timers.get(label)!;
      const duration = performance.now() - startTime;
      timers.delete(label);
      logInternal(LogLevel.DEBUG, '⏱️ TIMER', `${label}: ${duration.toFixed(2)}ms`);
    }
  },

  // Error logging with additional context
  apiError: (endpoint: string, error: any, context?: any) => {
    logInternal(LogLevel.ERROR, '🌐 API ERROR', `${endpoint}:`, error, context ? { context } : '');
  },

  authError: (action: string, error: any) => {
    logInternal(LogLevel.ERROR, '🔐 AUTH ERROR', `${action}:`, error);
  },

  gameError: (action: string, error: any, gameState?: any) => {
    logInternal(LogLevel.ERROR, '🎮 GAME ERROR', `${action}:`, error, gameState ? { gameState } : '');
  },

  // Development-only logging (completely removed in production)
  dev: (...args: any[]) => {
    if (myConfig.NODE_ENV === 'development') {
      logInternal(LogLevel.DEBUG, '🔧 DEV', ...args);
    }
  },
};

/**
 * Simple printl function for backward compatibility
 * This maintains your current API while providing the enhanced functionality
 */
export const printl = (...args: any[]) => logger.info(...args);

/**
 * Conditional compilation helpers
 * These functions get completely removed in production builds via tree-shaking
 */
export const isDev = myConfig.NODE_ENV === 'development';
export const isProd = myConfig.NODE_ENV === 'production';

// Export for configuration changes (useful for debugging)
export const setLogLevel = (level: LogLevel) => {
  LOG_CONFIG.level = level;
};

export const enableLogging = (enabled: boolean) => {
  LOG_CONFIG.enabled = enabled;
};

// LogLevel is already exported above as part of the enum declaration

/**
 * Usage Examples:
 * 
 * // Basic logging (replaces console.log)
 * printl('Hello world');  // Backward compatible
 * logger.info('Hello world');  // Preferred new way
 * 
 * // Categorized logging
 * logger.api('POST /auth/login', response);
 * logger.auth('User logged in', user);
 * logger.game('Move made', { row, col, player });
 * logger.bot('Bot chose move', move);
 * 
 * // Performance timing
 * logger.time('api-request');
 * // ... do API request
 * logger.timeEnd('api-request');  // Logs: "api-request: 123.45ms"
 * 
 * // Error logging with context
 * logger.apiError('/auth/login', error, { username, timestamp });
 * logger.gameError('invalid-move', error, { gameState, move });
 * 
 * // Development-only logging (removed in production)
 * logger.dev('This only shows in development');
 */