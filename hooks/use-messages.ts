import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types/messages';

interface UseMessagesProps {
  userId: number;
  pollInterval?: number; // milliseconds
}

export function useMessages({ userId, pollInterval = 30000 }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      // Use relative URL path that works regardless of host/port
      const response = await fetch(`/api/messages?userId=${userId}`, {
        // Add cache control to avoid stale responses
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages);
      
      // Calculate unread count
      const unread = data.messages.filter((msg: Message) => 
        !msg.is_read && msg.sender_id !== userId
      ).length;
      setUnreadCount(unread);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages(prev => [data.message, ...prev]);
      
      return data.message;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [userId]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [userId]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete message');
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [userId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages();
    
    // Set up polling
    const interval = setInterval(fetchMessages, pollInterval);
    
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  return {
    messages,
    unreadCount,
    loading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
    refetch: fetchMessages,
  };
} 