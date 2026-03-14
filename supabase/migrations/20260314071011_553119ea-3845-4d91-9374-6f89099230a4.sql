INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;