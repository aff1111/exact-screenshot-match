/**
 * Central Type Definitions
 * All TypeScript types and interfaces for the application
 */

// User & Authentication
export interface User {
  id: string;
  email: string;
  created_at: string;
  security_questions: SecurityQuestion[];
  is_admin?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  app_metadata?: {
    role?: string;
  };
}

// Recipients
export interface Recipient {
  id: string;
  admin_id: string;
  email: string;
  token?: string;
  token_hash?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipientWithLetters extends Recipient {
  letters_count: number;
  last_letter_date?: string;
}

// Letters & Communication
export interface Letter {
  id: string;
  admin_id: string;
  recipient_id: string;
  title: string;
  content: string;
  content_encrypted?: string;
  is_revealed: boolean;
  revealed_at?: string;
  created_at: string;
  updated_at: string;
  recipient?: Recipient;
}

export interface LetterWithReplies extends Letter {
  replies_count: number;
  last_reply_date?: string;
}

export interface LetterReply {
  id: string;
  letter_id: string;
  recipient_id: string;
  content: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

// Security & Verification
export interface SecurityQuestion {
  id: string;
  user_id: string;
  question: string;
  answer_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityAnswer {
  question_id: string;
  answer: string;
}

export interface VerificationState {
  status: 'pending' | 'answering' | 'verified' | 'failed';
  attempts: number;
  max_attempts: number;
  answered_questions: string[]; // question_ids
  failed_answers: string[]; // question_ids
}

// Security Log
export interface SecurityLogEntry {
  id: string;
  user_id: string;
  action: SecurityAction;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type SecurityAction =
  | 'login'
  | 'login_failed'
  | 'security_questions_updated'
  | 'letter_created'
  | 'letter_revealed'
  | 'letter_deleted'
  | 'recipient_added'
  | 'recipient_removed'
  | 'recipient_verified'
  | 'account_settings_changed';

// API Responses
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Form States
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string[]>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface FormFieldError {
  field: string;
  message: string;
  code?: string;
}

// Modal States
export interface ModalState {
  isOpen: boolean;
  data?: Record<string, unknown>;
  mode?: 'create' | 'edit' | 'view';
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// UI States
export interface LoadingState {
  isLoading: boolean;
  isEmpty: boolean;
  error?: Error;
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Notification
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dashboard Stats
export interface DashboardStats {
  totalRecipients: number;
  totalLetters: number;
  unreadLetters: number;
  pendingReplies: number;
}
