-- Improved Migration - Schema Optimization and Security
-- This migration optimizes the existing schema and adds missing security features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_recipients_admin_id ON recipients(admin_id);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email);
CREATE INDEX IF NOT EXISTS idx_letters_admin_id ON letters(admin_id);
CREATE INDEX IF NOT EXISTS idx_letters_recipient_id ON letters(recipient_id);
CREATE INDEX IF NOT EXISTS idx_letters_is_revealed ON letters(is_revealed);
CREATE INDEX IF NOT EXISTS idx_letter_replies_letter_id ON letter_replies(letter_id);
CREATE INDEX IF NOT EXISTS idx_letter_replies_recipient_id ON letter_replies(recipient_id);
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at DESC);

-- Add compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_letters_admin_created ON letters(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipients_admin_verified ON recipients(admin_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_letter_replies_letter_created ON letter_replies(letter_id, created_at DESC);

-- Add constraints if not exists
ALTER TABLE recipients
ADD CONSTRAINT unique_recipient_per_admin_email UNIQUE (admin_id, email);

-- Add check constraints for data validation
ALTER TABLE users
ADD CONSTRAINT check_email_valid CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Add default values if not present
ALTER TABLE letters
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE letter_replies
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE recipients
ALTER COLUMN created_at SET DEFAULT now();

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Recipients - Admins can only see their own recipients
DROP POLICY IF EXISTS "Admins can read own recipients" ON recipients;
CREATE POLICY "Admins can read own recipients" ON recipients
  FOR SELECT USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert recipients" ON recipients;
CREATE POLICY "Admins can insert recipients" ON recipients
  FOR INSERT WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update own recipients" ON recipients;
CREATE POLICY "Admins can update own recipients" ON recipients
  FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete own recipients" ON recipients;
CREATE POLICY "Admins can delete own recipients" ON recipients
  FOR DELETE USING (admin_id = auth.uid());

-- Letters - Security
DROP POLICY IF EXISTS "Admins can read own letters" ON letters;
CREATE POLICY "Admins can read own letters" ON letters
  FOR SELECT USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert letters" ON letters;
CREATE POLICY "Admins can insert letters" ON letters
  FOR INSERT WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update own letters" ON letters;
CREATE POLICY "Admins can update own letters" ON letters
  FOR UPDATE USING (admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete own letters" ON letters;
CREATE POLICY "Admins can delete own letters" ON letters
  FOR DELETE USING (admin_id = auth.uid());

-- Letter Replies
DROP POLICY IF EXISTS "Recipients can read replies for their letters" ON letter_replies;
CREATE POLICY "Recipients can read replies for their letters" ON letter_replies
  FOR SELECT USING (true); -- Recipients access will be controlled by app logic

DROP POLICY IF EXISTS "Recipients can create replies" ON letter_replies;
CREATE POLICY "Recipients can create replies" ON letter_replies
  FOR INSERT WITH CHECK (true); -- Recipients access will be controlled by app logic

-- Security Questions
DROP POLICY IF EXISTS "Users can read own security questions" ON security_questions;
CREATE POLICY "Users can read own security questions" ON security_questions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own security questions" ON security_questions;
CREATE POLICY "Users can update own security questions" ON security_questions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Security Logs
DROP POLICY IF EXISTS "Users can read own security logs" ON security_logs;
CREATE POLICY "Users can read own security logs" ON security_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert security logs" ON security_logs;
CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT WITH CHECK (true);

-- Create audit trigger function (optional but recommended)
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      changed_by,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      TG_OP,
      row_to_json(OLD),
      NULL,
      auth.uid(),
      now()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      changed_by,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      TG_OP,
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid(),
      now()
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      table_name,
      record_id,
      operation,
      old_data,
      new_data,
      changed_by,
      changed_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      TG_OP,
      NULL,
      row_to_json(NEW),
      auth.uid(),
      now()
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now()
);

-- Create indexes on audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at DESC);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own audit logs" ON audit_log;
CREATE POLICY "Users can read own audit logs" ON audit_log
  FOR SELECT USING (changed_by = auth.uid());
