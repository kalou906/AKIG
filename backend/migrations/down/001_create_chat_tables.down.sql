-- Rollback for migrations/001_create_chat_tables.sql

-- Drop triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS chats_updated_at_trigger ON chats;
DROP TRIGGER IF EXISTS agent_presence_status_updated_at_trigger ON agent_presence;
DROP TRIGGER IF EXISTS agent_presence_last_activity_trigger ON agent_presence;

-- Drop the trigger functions
DROP FUNCTION IF EXISTS update_chats_updated_at();
DROP FUNCTION IF EXISTS update_agent_presence_status_updated_at();
DROP FUNCTION IF EXISTS update_agent_presence_last_activity();

-- Drop indexes explicitly (optional since CASCADE removes them)
DROP INDEX IF EXISTS idx_chats_user_id;
DROP INDEX IF EXISTS idx_chats_agent_id;
DROP INDEX IF EXISTS idx_chats_status;
DROP INDEX IF EXISTS idx_chats_created_at;
DROP INDEX IF EXISTS idx_chat_messages_chat_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_chat_messages_is_read;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_messages_chat_created;
DROP INDEX IF EXISTS idx_agent_presence_status;
DROP INDEX IF EXISTS idx_agent_presence_chat_count;

-- Drop tables (cascade removes dependent objects)
DROP TABLE IF EXISTS chat_notifications CASCADE;
DROP TABLE IF EXISTS agent_presence CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
