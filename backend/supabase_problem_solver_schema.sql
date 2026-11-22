-- =============================================================================
-- GTA 6 Player Hub - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Phase 9: AI Gaming Problem Solver Architecture
-- =============================================================================

-- Enable Row Level Security on AI Problem Solver tables
ALTER TABLE IF EXISTS ai_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_response_feedback ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 1. Knowledge Base RLS Policies (Public Read)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active knowledge sources" ON ai_knowledge_sources;
CREATE POLICY "Public can view active knowledge sources"
ON ai_knowledge_sources FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can view knowledge documents" ON ai_knowledge_documents;
CREATE POLICY "Public can view knowledge documents"
ON ai_knowledge_documents FOR SELECT
USING (TRUE);

-- -----------------------------------------------------------------------------
-- 2. Conversations RLS Policies (User Ownership & Anonymous Support)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own conversations" ON ai_conversations;
CREATE POLICY "Users can view their own conversations"
ON ai_conversations FOR SELECT
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
);

DROP POLICY IF EXISTS "Users can insert conversations" ON ai_conversations;
CREATE POLICY "Users can insert conversations"
ON ai_conversations FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
);

DROP POLICY IF EXISTS "Users can update their own conversations" ON ai_conversations;
CREATE POLICY "Users can update their own conversations"
ON ai_conversations FOR UPDATE
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON ai_conversations;
CREATE POLICY "Users can delete their own conversations"
ON ai_conversations FOR DELETE
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
);

-- -----------------------------------------------------------------------------
-- 3. Messages RLS Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON ai_messages;
CREATE POLICY "Users can view messages in their conversations"
ON ai_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM ai_conversations c
        WHERE c.id = ai_messages.conversation_id
        AND (
            (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) OR
            (auth.uid() IS NULL AND c.user_id IS NULL)
        )
    )
);

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON ai_messages;
CREATE POLICY "Users can insert messages into their conversations"
ON ai_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM ai_conversations c
        WHERE c.id = ai_messages.conversation_id
        AND (
            (auth.uid() IS NOT NULL AND c.user_id = auth.uid()) OR
            (auth.uid() IS NULL AND c.user_id IS NULL)
        )
    )
);

-- -----------------------------------------------------------------------------
-- 4. Response Feedback RLS Policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can submit response feedback" ON ai_response_feedback;
CREATE POLICY "Users can submit response feedback"
ON ai_response_feedback FOR INSERT
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view their own feedback" ON ai_response_feedback;
CREATE POLICY "Users can view their own feedback"
ON ai_response_feedback FOR SELECT
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL)
);
