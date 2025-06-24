-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Create message_reads table to track who has read each message
CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(message_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_deleted_at_idx ON public.messages(deleted_at);
CREATE INDEX IF NOT EXISTS message_reads_message_id_idx ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS message_reads_user_id_idx ON public.message_reads(user_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages table
-- Allow all users to read non-deleted messages
CREATE POLICY "Users can read non-deleted messages"
  ON public.messages
  FOR SELECT
  USING (deleted_at IS NULL);

-- Allow users to create messages
CREATE POLICY "Users can create messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (true);

-- Only sender can soft-delete their own messages
CREATE POLICY "Senders can delete their own messages"
  ON public.messages
  FOR UPDATE
  USING (sender_id::text = auth.uid()::text AND deleted_at IS NULL)
  WITH CHECK (sender_id::text = auth.uid()::text);

-- RLS Policies for message_reads table
-- Allow users to see all read receipts
CREATE POLICY "Users can see read receipts"
  ON public.message_reads
  FOR SELECT
  USING (true);

-- Allow users to mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON public.message_reads
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages m
    WHERE m.deleted_at IS NULL
      AND m.sender_id != p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.message_reads mr
        WHERE mr.message_id = m.id
          AND mr.user_id = p_user_id
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark a message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(p_message_id UUID, p_user_id BIGINT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.message_reads (message_id, user_id)
  VALUES (p_message_id, p_user_id)
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 