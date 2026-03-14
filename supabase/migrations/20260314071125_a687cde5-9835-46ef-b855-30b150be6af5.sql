UPDATE auth.users SET 
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE id = '67b197a8-eb67-46de-9341-a65b2550f981';