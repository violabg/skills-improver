/**
 * Centralized Logger Service
 *
 * Provides consistent logging across the application with:
 * - Environment-aware verbosity (verbose in dev, structured in prod)
 * - Contextual metadata for debugging
 * - Type-safe log levels
 *
 * Usage:
 * ```ts
 * import { logger } from "@/lib/services/logger";
 *
 * logger.info("User logged in", { userId: "123" });
 * logger.error("Failed to fetch data", { error, endpoint });
 * logger.warn("Deprecated API called", { api: "/old-endpoint" });
 * logger.debug("Processing item", { itemId }); // Only in development
 * ```
 */

// ============================================================================
// Types
// ============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Minimum log level to output (debug < info < warn < error)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production, only log warnings and errors
// In development, log everything
const MIN_LOG_LEVEL: LogLevel = isDevelopment ? "debug" : "warn";

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format error for logging
 */
function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

/**
 * Format log entry for development (human-readable)
 */
function formatForDev(entry: LogEntry): string {
  const { level, message, context, stack } = entry;

  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m", // green
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";

  const coloredLevel = `${levelColors[level]}[${level.toUpperCase()}]${reset}`;
  const timestamp = new Date().toLocaleTimeString();

  let output = `${timestamp} ${coloredLevel} ${message}`;

  if (context && Object.keys(context).length > 0) {
    // Filter out error objects for cleaner display
    const displayContext = { ...context };
    if (displayContext.error instanceof Error) {
      displayContext.error = displayContext.error.message;
    }
    output += `\n  Context: ${JSON.stringify(displayContext, null, 2)}`;
  }

  if (stack) {
    output += `\n  Stack: ${stack}`;
  }

  return output;
}

/**
 * Format log entry for production (JSON for log aggregators)
 */
function formatForProd(entry: LogEntry): string {
  return JSON.stringify(entry);
}

// ============================================================================
// Logger Implementation
// ============================================================================

function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Suppress logs during tests
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  // Extract error details if present
  if (context?.error) {
    const errorInfo = formatError(context.error);
    entry.stack = errorInfo.stack;
    context = {
      ...context,
      errorMessage: errorInfo.message,
    };
    delete context.error;
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  const formatted = isDevelopment ? formatForDev(entry) : formatForProd(entry);

  // Use appropriate console method
  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "debug":
      console.debug(formatted);
      break;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const logger = {
  /**
   * Debug-level logging (development only)
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    log("debug", message, context);
  },

  /**
   * Info-level logging
   * Use for general operational messages
   */
  info(message: string, context?: LogContext): void {
    log("info", message, context);
  },

  /**
   * Warning-level logging
   * Use for potentially problematic situations
   */
  warn(message: string, context?: LogContext): void {
    log("warn", message, context);
  },

  /**
   * Error-level logging
   * Use for error conditions that need attention
   */
  error(message: string, context?: LogContext): void {
    log("error", message, context);
  },

  /**
   * Log with explicit level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    log(level, message, context);
  },
};

// ============================================================================
// Specialized Loggers
// ============================================================================

/**
 * Create a scoped logger with automatic context prefix
 */
export function createScopedLogger(scope: string) {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(`[${scope}] ${message}`, context);
    },
    info(message: string, context?: LogContext): void {
      logger.info(`[${scope}] ${message}`, context);
    },
    warn(message: string, context?: LogContext): void {
      logger.warn(`[${scope}] ${message}`, context);
    },
    error(message: string, context?: LogContext): void {
      logger.error(`[${scope}] ${message}`, context);
    },
  };
}

// Pre-configured scoped loggers for common areas
export const aiLogger = createScopedLogger("AI");
export const dbLogger = createScopedLogger("DB");
export const authLogger = createScopedLogger("Auth");
export const storageLogger = createScopedLogger("Storage");

export default logger;
