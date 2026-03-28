# Task Chat System - Setup Guide

## ✅ What was implemented:

### Backend:
1. **Message Entity** (`src/messages/entities/message.entity.ts`)
   - Fields: id, taskId, senderId, content, createdAt
   - Relations: Task (ManyToOne), User/sender (ManyToOne)

2. **Messages Service** (`src/messages/messages.service.ts`)
   - `create()` - Create a new message with task access validation
   - `findAllByTask()` - Get all messages for a task (sorted by createdAt ASC)

3. **Messages Controller** (`src/messages/messages.controller.ts`)
   - `POST /messages` - Create message
   - `GET /messages/task/:taskId` - Get all messages for a task

4. **Socket.io Gateway** (`src/messages/messages.gateway.ts`)
   - Event: `joinTask` - Join a task room
   - Event: `leaveTask` - Leave a task room
   - Event: `sendMessage` - Send message and broadcast to room
   - Event: `newMessage` - Emitted to all clients in task room

5. **Messages Module** - Integrated into app.module.ts

### Frontend:
1. **TaskChat Component** (`src/components/TaskChat.tsx`)
   - Full chat UI with messages list
   - Real-time updates via Socket.io
   - Auto-scroll to latest message
   - Sender name and timestamp display
   - Empty state ("No messages yet")
   - Loading state

2. **Integration in Collaboration.tsx**
   - Chat button (MessageSquare icon) on each task card
   - Opens TaskChat modal when clicked
   - Passes taskId, taskTitle, and currentUserId

## 🚀 How to use:

### 1. Restart Backend:
```bash
cd PI-DEV-BACKEND
npm run start:dev
```

TypeORM will automatically create the `messages` table.

### 2. Verify Database:
```sql
-- Check the messages table
\d messages

-- Should have columns:
-- id, taskId, senderId, content, createdAt
```

### 3. Test the feature:
1. Go to Collaboration page
2. Click the chat icon (💬) on any task card
3. Type a message and send
4. Open the same task in another browser/tab
5. Messages should appear in real-time!

## 🔧 API Endpoints:

### Create Message:
```http
POST /messages
Content-Type: application/json

{
  "taskId": "uuid",
  "content": "Hello team!"
}
```

### Get Messages:
```http
GET /messages/task/:taskId
```

## 🌐 Socket.io Events:

### Client → Server:
- `joinTask` - Join a task room
  ```js
  socket.emit('joinTask', taskId);
  ```

- `sendMessage` - Send a message
  ```js
  socket.emit('sendMessage', {
    taskId: 'uuid',
    content: 'Hello!',
    userId: 'uuid'
  });
  ```

### Server → Client:
- `newMessage` - New message received
  ```js
  socket.on('newMessage', (message) => {
    // Update UI
  });
  ```

## 🎨 Features:

✅ Real-time messaging per task
✅ Auto-scroll to latest message
✅ Sender name display
✅ Timestamp with relative time (e.g., "2m ago")
✅ Empty state UI
✅ Loading state
✅ Clean, modern design
✅ Mobile responsive
✅ Access control (only task members can chat)

## 🔐 Security:

- All endpoints require JWT authentication
- Task access is verified before allowing messages
- Socket.io uses credentials for authentication
- Messages are scoped to task rooms

## 📝 Notes:

- Messages are stored in PostgreSQL
- Real-time updates use Socket.io
- Each task has its own chat room
- Messages are sorted chronologically
- No message editing/deletion (can be added later)
