export interface Message {
  id: string;
  sender_id: number;
  content: string;
  created_at: string;
  deleted_at: string | null;
  // Additional fields for UI
  sender?: {
    id: number;
    name: string;
    color: string;
    initial: string;
  };
  read_by?: MessageRead[];
  is_read?: boolean; // For current user
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: number;
  read_at: string;
  user?: {
    id: number;
    name: string;
    initial: string;
  };
}

export interface MessageFormData {
  content: string;
}

export interface MessagesState {
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
} 