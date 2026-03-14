/**
 * Error Handling & Logging System
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_SESSION_NOT_FOUND = 'AUTH_SESSION_NOT_FOUND',

  // Validation
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PASSWORD = 'VALIDATION_INVALID_PASSWORD',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',

  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_NO_INTERNET = 'NETWORK_NO_INTERNET',

  // Database
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',

  // Business Logic
  RECIPIENT_NOT_FOUND = 'RECIPIENT_NOT_FOUND',
  LETTER_NOT_FOUND = 'LETTER_NOT_FOUND',
  LETTER_ALREADY_REVEALED = 'LETTER_ALREADY_REVEALED',
  RECIPIENT_NOT_VERIFIED = 'RECIPIENT_NOT_VERIFIED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  VERIFICATION_ATTEMPTS_EXCEEDED = 'VERIFICATION_ATTEMPTS_EXCEEDED',

  // Server
  SERVER_ERROR = 'SERVER_ERROR',
  SERVER_MAINTENANCE = 'SERVER_MAINTENANCE',
  SERVER_RESOURCE_EXHAUSTED = 'SERVER_RESOURCE_EXHAUSTED',

  // Other
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class ApplicationError extends Error implements AppError {
  code: ErrorCode;
  userMessage: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp: Date;
  context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string = '',
    options?: {
      details?: Record<string, unknown>;
      statusCode?: number;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.message = message;
    this.userMessage = userMessage || message;
    this.details = options?.details;
    this.statusCode = options?.statusCode;
    this.timestamp = new Date();
    this.context = options?.context;

    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

/**
 * Logger Service
 */
export class Logger {
  private static isDevelopment = import.meta.env.DEV;

  static info(message: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  static warn(message: string, data?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, data || '');
  }

  static error(error: unknown, context?: Record<string, unknown>) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof ApplicationError ? error.code : ErrorCode.UNKNOWN_ERROR;

    console.error(`[ERROR] ${errorCode}: ${errorMessage}`, { context, error });

    // TODO: Send to error tracking service (Sentry, etc.)
  }

  static debug(message: string, data?: Record<string, unknown>) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

/**
 * Error handler utility
 */
export function handleError(error: unknown): AppError {
  if (error instanceof ApplicationError) {
    Logger.error(error, { code: error.code });
    return error;
  }

  if (error instanceof Error) {
    Logger.error(error);
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'حدث خطأ غير متوقع',
      timestamp: new Date(),
    };
  }

  Logger.error(error);
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: String(error),
    userMessage: 'حدث خطأ غير متوقع',
    timestamp: new Date(),
  };
}

/**
 * Validation Errors
 */
export function createValidationError(
  field: string,
  message: string,
  code: ErrorCode = ErrorCode.VALIDATION_INVALID_INPUT
): ApplicationError {
  return new ApplicationError(code, `Validation failed for field: ${field}`, message, {
    details: { field },
    statusCode: 400,
  });
}

/**
 * Authentication Errors
 */
export function createAuthError(
  code: ErrorCode,
  userMessage: string = 'فشل التحقق من الهوية'
): ApplicationError {
  return new ApplicationError(code, `Authentication failed: ${code}`, userMessage, {
    statusCode: 401,
  });
}

/**
 * Permission Errors
 */
export function createPermissionError(
  userMessage: string = 'أنت غير مصرح بهذه العملية'
): ApplicationError {
  return new ApplicationError(
    ErrorCode.AUTH_UNAUTHORIZED,
    'Access denied',
    userMessage,
    {
      statusCode: 403,
    }
  );
}

/**
 * Not Found Errors
 */
export function createNotFoundError(
  resource: string,
  userMessage: string = `${resource} غير موجود`
): ApplicationError {
  return new ApplicationError(
    ErrorCode.RECIPIENT_NOT_FOUND,
    `${resource} not found`,
    userMessage,
    {
      statusCode: 404,
    }
  );
}

/**
 * Network Errors
 */
export function createNetworkError(
  userMessage: string = 'حدث خطأ في الاتصال'
): ApplicationError {
  return new ApplicationError(
    ErrorCode.NETWORK_ERROR,
    'Network request failed',
    userMessage,
    {
      statusCode: 503,
    }
  );
}
