/**
 * Application-wide Constants
 */

// Security & Validation
export const SECURITY_CONSTANTS = {
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  SECURITY_QUESTIONS_REQUIRED: 3,
  MAX_VERIFICATION_ATTEMPTS: 3,
  VERIFICATION_ATTEMPT_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
  TOKEN_EXPIRY_DAYS: 365,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
};

// API & Network
export const API_CONFIG = {
  REQUEST_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SIZES: [10, 20, 50, 100],
};

// UI & Animations
export const UI_CONFIG = {
  TOAST_DURATION_MS: 3000,
  MODAL_ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 500,
  THROTTLE_DELAY_MS: 1000,
};

// Colors
export const COLORS = {
  PRIMARY: '#2563eb', // Blue
  SUCCESS: '#10b981', // Green
  WARNING: '#f59e0b', // Amber
  ERROR: '#ef4444', // Red
  INFO: '#3b82f6', // Light Blue
  NEUTRAL: '#6b7280', // Gray
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    LETTER_SENT: 'تم إرسال الرسالة بنجاح',
    RECIPIENT_ADDED: 'تم إضافة المستقبل بنجاح',
    SAVED: 'تم الحفظ بنجاح',
    UPDATED: 'تم التحديث بنجاح',
  },
  ERROR: {
    NETWORK: 'حدث خطأ في الاتصال. يرجى المحاولة مجدداً',
    INVALID_INPUT: 'المدخلات غير صحيحة',
    UNAUTHORIZED: 'أنت غير مصرح بهذه العملية',
    NOT_FOUND: 'العنصر غير موجود',
    SERVER_ERROR: 'حدث خطأ في الخادم',
    INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
    WEAK_PASSWORD: 'كلمة المرور ضعيفة جداً',
  },
  VALIDATION: {
    REQUIRED: 'هذا الحقل مطلوب',
    EMAIL_INVALID: 'البريد الإلكتروني غير صحيح',
    PASSWORD_TOO_SHORT: 'كلمة المرور قصيرة جداً',
    PASSWORDS_NOT_MATCH: 'كلمات المرور غير متطابقة',
  },
};

// Date & Time Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd MMMM yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  THEME: 'theme',
  LANGUAGE: 'language',
  VERIFICATION_STATE: 'verification_state',
  DRAFT_LETTER: 'draft_letter',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  RECIPIENT: '/recipient/:id',
  HONEYPOT: '/honeypot',
  NOT_FOUND: '/404',
} as const;

// Dashboard Tabs
export const DASHBOARD_TABS = {
  RECIPIENTS: 'recipients',
  LETTERS: 'letters',
  REPLIES: 'replies',
  SECURITY: 'security',
  SETTINGS: 'settings',
} as const;

// Letter Status
export const LETTER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  REVEALED: 'revealed',
  ARCHIVED: 'archived',
} as const;

// Encryption
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION: 'PBKDF2',
  ITERATIONS: 100000,
};

// Feature Flags
export const FEATURES = {
  ENABLE_OFFLINE_MODE: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_RATE_LIMITING: true,
  ENABLE_TWO_FACTOR: true,
  MAINTENANCE_MODE: false,
};

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^[0-9\s\-\+\(\)]{10,}$/,
};
