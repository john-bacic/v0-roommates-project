Add the ability for users to send messages to all other users. Features:

- Add a message icon next to each user's name (to the right, before other icons).
- Clicking the icon takes you to a message page where any user can post a message.
- Messages are stored in the database.
- If a new message is available, display a red dot on the message icon.
- Only the sender can delete their own messages.
- Show a tiny checkmark indicator to display which users have read each message.

Plan this out and give checkpoints for the task.

## Implementation Plan for Messaging Feature

### **Checkpoint 1: Database Setup** ✅ COMPLETE

- Create `messages` table:
  ```sql
  id, sender_id, content, created_at, deleted_at
  ```
- Create `message_reads` table:
  ```sql
  id, message_id, user_id, read_at
  ```
- Set up foreign keys and indexes
- Add RLS policies for message access

**Completed files:**

- `setup-messages-tables.sql` - SQL schema for messaging tables
- `setup-messages.js` - Node script to run the migration
- `types/messages.ts` - TypeScript interfaces
- `lib/supabase.ts` - Added message-related functions

### **Checkpoint 2: Backend API** ✅ COMPLETE

- Create message endpoints:
  - `POST /api/messages` - Send new message
  - `GET /api/messages` - Get all messages
  - `DELETE /api/messages/:id` - Delete message (sender only)
  - `POST /api/messages/:id/read` - Mark message as read
- Add realtime subscriptions for new messages

**Completed files:**

- `app/api/messages/route.ts` - Main messages API (GET, POST)
- `app/api/messages/[id]/route.ts` - Delete message API
- `app/api/messages/[id]/read/route.ts` - Mark as read API
- `app/api/messages/unread/route.ts` - Get unread count
- `hooks/use-messages.ts` - Custom React hook for message management

### **Checkpoint 3: UI Components** ✅ COMPLETE

- Create `MessageIcon` component with red dot indicator
- Add icon to user name display (right side, before other icons)
- Create `MessagePage` component with:
  - Message list display
  - New message input form
  - Delete button (visible to sender only)
  - Read indicators (tiny checkmarks)

**Completed files:**

- `components/message-icon.tsx` - Message icon with unread indicator
- `components/user-list.tsx` - Updated to include message icon for each user
- `app/messages/page.tsx` - Full messages page with chat UI
- `app/dashboard/page.tsx` - Updated to include message icon in header

### **Checkpoint 4: State Management**

- Add message store/context for:
  - Unread message count
  - Message list
  - Read status tracking
- Implement realtime message updates

### **Checkpoint 5: Testing & Polish**

- Test message sending/receiving
- Verify read indicators work correctly
- Ensure delete permissions are enforced
- Add loading states and error handling
- Mobile responsiveness
