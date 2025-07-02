import { createClient } from '@/lib/supabase/client';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Create a new chat session
export async function createChatSession(userId: string, title: string = 'New Chat'): Promise<ChatSession | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert([
      {
        user_id: userId,
        title: title
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating chat session:', error);
    return null;
  }

  return data;
}

// Add a message to a chat session
export async function addChatMessage(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: any = {}
): Promise<ChatMessage | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .insert([
      {
        session_id: sessionId,
        user_id: userId,
        role: role,
        content: content,
        metadata: metadata
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding chat message:', error);
    return null;
  }

  return data;
}

// Get all chat sessions for a user
export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }

  return data || [];
}

// Get messages for a specific chat session
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data || [];
}

// Delete a chat session and all its messages
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }

  return true;
}

// Update chat session title
export async function updateChatSessionTitle(sessionId: string, title: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating chat session title:', error);
    return false;
  }

  return true;
}

// Generate a title from the first user message
export function generateChatTitle(firstMessage: string): string {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return 'New Chat';
  }
  
  // Take first 50 characters and add ellipsis if longer
  const title = firstMessage.trim();
  if (title.length <= 50) {
    return title;
  }
  
  return title.substring(0, 47) + '...';
} 