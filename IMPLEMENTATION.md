# Milky Adapter Implementation Documentation

## Overview

This document describes the implementation of the Milky protocol adapter for KarinJS, based on the [Milky protocol specification](https://milky.ntqqrev.org/).

## Architecture

### Core Components

#### 1. MilkyCore (`src/core/core.ts`)

The abstract base class that provides:
- Event emitter functionality
- Protocol and bot information storage
- Connection lifecycle management
- Timeout configuration

```typescript
abstract class MilkyCore extends EventEmitter {
  protocol: { name, version, connectTime }
  self: { id, nickname, avatar }
  _options: { timeout }
  
  abstract close(): void
  abstract init(): Promise<void>
}
```

#### 2. Connection Layer

**MilkyHttp** (`src/connection/http.ts`)
- Simple HTTP client for API calls
- Fetch-based implementation with timeout support
- Bearer token authentication
- JSON request/response handling

**MilkyWebSocket** (`src/connection/websocket.ts`)
- WebSocket client for real-time events
- Auto-reconnection with configurable parameters
- API call support over WebSocket (with echo mechanism)
- Event broadcasting through EventEmitter
- Connection state management

### API Layer

Organized into three main categories:

#### Message APIs (`src/api/message.ts`)
- `send_private_message` - Send private messages
- `send_group_message` - Send group messages
- `recall_private_message` - Recall private messages
- `recall_group_message` - Recall group messages
- `get_message` - Get specific message
- `get_history_messages` - Get message history
- `get_resource_temp_url` - Get temporary resource URL
- `get_forwarded_messages` - Get forwarded messages
- `mark_message_as_read` - Mark messages as read

#### Friend APIs (`src/api/friend.ts`)
- `send_friend_nudge` - Send nudge to friend
- `send_profile_like` - Like friend's profile
- `get_friend_requests` - Get pending friend requests
- `accept_friend_request` - Accept friend request
- `reject_friend_request` - Reject friend request

#### Group APIs (`src/api/group.ts`)
- Group settings (name, avatar)
- Member management (card, title, admin, mute, kick)
- Announcements (get, send, delete)
- Essence messages (get, set)
- Group actions (quit, reaction, nudge)

### Event System

Events are typed constants defined in `src/event/types.ts`:

**Message Events:**
- `message_receive` - When a message is received
- `message_recall` - When a message is recalled

**Friend Events:**
- `friend_request` - Friend request received
- `friend_nudge` - Friend nudge received
- `friend_file_upload` - Friend uploaded a file

**Group Events:**
- `group_join_request` - Join request received
- `group_invited_join_request` - Member invites someone
- `group_invitation` - Bot is invited to a group
- `group_admin_change` - Admin status changed
- `group_essence_message_change` - Essence message changed
- `group_member_increase` - Member joined
- `group_member_decrease` - Member left
- `group_name_change` - Group name changed
- `group_message_reaction` - Message reaction added/removed

**Bot Events:**
- `bot_offline` - Bot went offline

**Connection Events (WebSocket only):**
- `connected` - Connection established
- `disconnected` - Connection lost
- `reconnecting` - Attempting to reconnect
- `error` - Error occurred

## Type Safety

The implementation uses official Milky types from `@saltify/milky-types`:

```typescript
import type {
  SendPrivateMessageInput,
  SendPrivateMessageOutput,
  // ... other types
} from '@saltify/milky-types'
```

All API methods are properly typed, providing:
- IntelliSense support
- Compile-time type checking
- Runtime type validation (via Zod in the Milky types package)

## Error Handling

### HTTP Client
- Network errors are caught and wrapped with context
- HTTP status errors include status code and text
- API errors include retcode and message from server
- Timeout errors through AbortSignal

### WebSocket Client
- Connection errors trigger reconnection (if enabled)
- API call timeouts are individually managed
- Failed API calls reject with descriptive errors
- Event parsing errors are emitted as 'error' events

## Configuration

### HTTP Options
```typescript
interface MilkyHttpOptions {
  baseUrl: string           // Required: API base URL
  accessToken?: string      // Optional: Bearer token
  timeout?: number          // Optional: Request timeout (default: 120000ms)
}
```

### WebSocket Options
```typescript
interface MilkyWebSocketOptions {
  url: string                      // Required: WebSocket URL
  accessToken?: string             // Optional: Bearer token
  autoReconnect?: boolean          // Optional: Auto-reconnect (default: true)
  reconnectInterval?: number       // Optional: Reconnect delay (default: 5000ms)
  maxReconnectAttempts?: number    // Optional: Max retries (default: 10)
  timeout?: number                 // Optional: API timeout (default: 120000ms)
}
```

## Usage Patterns

### 1. Simple HTTP Client

Best for:
- Simple bots without event handling
- One-off API calls
- Serverless functions
- Testing

```typescript
const client = new MilkyHttp({ baseUrl: 'http://localhost:3000' })
await client.init()
await client.callApi('send_private_message', { ... })
client.close()
```

### 2. WebSocket Event Listener

Best for:
- Interactive bots
- Real-time event processing
- Long-running bot processes
- Full-featured bots

```typescript
const client = new MilkyWebSocket({ url: 'ws://localhost:3000/event' })
client.on('message_receive', handler)
await client.init()
// Client stays connected and emits events
```

### 3. Hybrid Approach

For advanced scenarios, you could:
- Use WebSocket for events
- Use HTTP for specific API calls
- Maintain separate instances

## Testing Strategy

### Recommended Tests

1. **Unit Tests**
   - Core class initialization
   - HTTP client request formatting
   - WebSocket message parsing
   - Event emission

2. **Integration Tests**
   - Connect to mock Milky server
   - Send and receive messages
   - Handle reconnection
   - API error responses

3. **Type Tests**
   - Verify type exports
   - Check type compatibility with Milky types
   - Ensure no `any` types leak

## Performance Considerations

### Memory Management
- WebSocket client maintains event listeners map
- API callbacks are properly cleaned up on timeout
- Reconnection timer is cleared on manual close
- All listeners removed on close

### Network Efficiency
- HTTP client reuses connections (via fetch)
- WebSocket maintains single connection
- No polling required
- Automatic reconnection prevents connection spam

## Security

### Authentication
- Bearer token support for both HTTP and WebSocket
- Tokens passed in Authorization header
- No token storage in logs or errors

### Vulnerabilities
- No known vulnerabilities in dependencies (checked)
- Uses official Milky types package
- WebSocket library (ws) is industry standard
- No eval or dangerous code execution

## Future Enhancements

Potential improvements:

1. **Message Helpers**
   - Message builder utilities
   - Segment constructors
   - Message templates

2. **Retry Logic**
   - Automatic retry for failed API calls
   - Exponential backoff
   - Retry configuration

3. **Rate Limiting**
   - Built-in rate limiter
   - Queue management
   - Priority queues

4. **Logging**
   - Debug logging
   - Performance metrics
   - Event statistics

5. **Configuration**
   - Config file support
   - Environment variables
   - Multiple bot instances

6. **Testing**
   - Mock server for tests
   - Test utilities
   - Coverage reports

## References

- [Milky Protocol Documentation](https://milky.ntqqrev.org/)
- [Milky GitHub Repository](https://github.com/SaltifyDev/milky)
- [Milky Types Package](https://www.npmjs.com/package/@saltify/milky-types)
- [KarinJS Documentation](https://github.com/KarinJS/Karin)

## License

GPL-3.0 License - See LICENSE file for details
