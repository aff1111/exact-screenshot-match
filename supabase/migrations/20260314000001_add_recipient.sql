-- Delete existing record if any
DELETE FROM admin_users WHERE email = 'ahmedromu4@gmail.com';

-- Insert admin user account with auth_user_id
INSERT INTO admin_users (email, auth_user_id, security_question_1, security_answer_1_hash, security_question_2, security_answer_2_hash, created_at)
VALUES (
  'ahmedromu4@gmail.com',
  'b11e88e1-4a09-4f7e-905c-5397159de0d7',
  'ما اسم حبيبتك الأولى',
  'سعاد',
  'ما هي سنة مولدها',
  '1984',
  NOW()
);
