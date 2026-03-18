# Smartpay Copilot - Implementation Guide

## Overview

The Smartpay Copilot is a consolidated, intelligent chat interface that handles ALL copilot features through a single conversational surface. Built with CopilotKit React Native SDK, it provides an agentic banking experience where users simply tell the app what they need.

## Architecture

### Core Components

#### 1. **Main Screen** - `app/(tabs)/copilot/index.tsx`
- Entry point for the copilot tab
- Manages session initialization and error states
- Displays user greeting and balance strip
- Wraps content in `CopilotProvider`

#### 2. **CopilotContext** - `contexts/copilot/CopilotContext.tsx`
- Manages conversation state (messages, pending actions)
- Provides methods to append messages and control flow
- Handles 2FA/confirmation flows

#### 3. **CopilotChatSurface** - `components/copilot/CopilotChatSurface.tsx`
- Main chat interface with message bubbles
- Suggestion chips for quick actions
- Text input with send button
- Handles CopilotKit integration (when configured)

#### 4. **useCopilotSession** - `hooks/useCopilotSession.ts`
- Manages session lifecycle (initialize, refresh, reset)
- Fetches and maintains wallet data
- Provides session readiness state
- Auto-initializes on user authentication

#### 5. **BaseCard** - `components/copilot/cards/BaseCard.tsx`
- Reusable card template for all response types
- Supports title, subtitle, custom content, and actions
- Multiple variants (default, info, success, warning, error)
- Consistent styling and behavior

### Supporting Components

#### Suggestion Chips - `components/copilot/CopilotSuggestionChips.tsx`
Context-aware quick action buttons:
- "Check my balance"
- "Send money"
- "Cash out"
- "Redeem voucher"
- Dynamic suggestions based on user state

#### Card Components
- **WalletBalanceCard** - Displays wallet balance with actions
- **TransactionConfirmationCard** - Transaction review before execution
- **CopilotConfirmationCard** - Generic confirmation dialog
- **CopilotSummaryCard** - Key-value pair display
- **CopilotErrorState** - Error handling UI

## Data Flow

```
User Input → CopilotChatSurface → CopilotContext → useCopilotTools
                                                         ↓
                                            Python AI Backend (FastAPI)
                                                         ↓
                                            LangGraph Agents + bge-m3 RAG
                                                         ↓
                                            Node.js Backend (User Data)
                                                         ↓
                                              Response Cards ← BaseCard
```

**Embedding Flow for Knowledge Base:**
```
User Query → bge-m3 Embedding (1024-dim) → Vector Search (LanceDB/pgvector)
           → Ranked Results → LLM Context → Response
```

## Using BaseCard

The `BaseCard` component is the foundation for all copilot response cards. It provides a consistent, reusable template.

### Basic Usage

```tsx
import { BaseCard } from '@/components/copilot/cards';

<BaseCard 
  title="Wallet Balance"
  subtitle="Main Wallet"
>
  <Text>Your balance is N$1,234.56</Text>
</BaseCard>
```

### With Actions

```tsx
<BaseCard 
  title="Confirm Payment"
  actions={[
    { 
      id: 'confirm', 
      label: 'Confirm', 
      onPress: handleConfirm, 
      variant: 'primary' 
    },
    { 
      id: 'cancel', 
      label: 'Cancel', 
      onPress: handleCancel, 
      variant: 'secondary' 
    }
  ]}
>
  <Text>Send N$500 to Anna Smith</Text>
</BaseCard>
```

### Variants

```tsx
// Info card (blue tint, left border)
<BaseCard variant="info" title="Information">
  <Text>Loan offer available</Text>
</BaseCard>

// Success card (green tint)
<BaseCard variant="success" title="Success">
  <Text>Transaction completed</Text>
</BaseCard>

// Warning card (yellow tint)
<BaseCard variant="warning" title="Review Required">
  <Text>Please confirm details</Text>
</BaseCard>

// Error card (red tint)
<BaseCard variant="error" title="Error">
  <Text>Transaction failed</Text>
</BaseCard>
```

## Creating Custom Cards

To create a new card type, extend `BaseCard`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

export interface MyCustomCardProps {
  data: MyDataType;
  onAction?: () => void;
}

export function MyCustomCard({ data, onAction }: MyCustomCardProps) {
  const actions: BaseCardAction[] = [];
  
  if (onAction) {
    actions.push({
      id: 'action',
      label: 'Take Action',
      onPress: onAction,
      variant: 'primary',
    });
  }

  return (
    <BaseCard
      title={data.title}
      subtitle={data.subtitle}
      actions={actions}
      variant="default"
      testID="my-custom-card"
    >
      <View style={styles.content}>
        {/* Your custom content here */}
        <Text>{data.description}</Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: designSystem.spacing.sm,
  },
});
```

## Session Management

### Initialize Session

The session auto-initializes when the user is authenticated:

```tsx
import { useCopilotSession } from '@/hooks/useCopilotSession';

function MyComponent() {
  const { sessionData, isSessionReady, initializeSession } = useCopilotSession();
  
  // Manual initialization (optional, auto-initializes by default)
  useEffect(() => {
    if (!sessionData.sessionStarted) {
      initializeSession();
    }
  }, []);
}
```

### Refresh Wallet Data

After transactions or when user requests:

```tsx
const { refreshWallets } = useCopilotSession();

async function handleTransactionComplete() {
  await refreshWallets();
  // Session data will update automatically
}
```

### Reset Session

On logout or explicit reset:

```tsx
const { resetSession } = useCopilotSession();

function handleLogout() {
  resetSession();
  // Navigate to login screen
}
```

## CopilotKit Integration

### Setting Up CopilotKit Backend

1. **Set environment variable:**
   ```bash
   EXPO_PUBLIC_COPILOT_API_URL=https://your-copilot-backend.com/api
   ```

2. **Configure runtime URL in `CopilotChatSurface.tsx`:**
   ```tsx
   const COPILOT_API_URL = process.env.EXPO_PUBLIC_COPILOT_API_URL ?? '';
   ```

3. **CopilotKit will handle:**
   - Message streaming
   - Tool invocation
   - Response generation

### Registering Tools

Tools are registered via `useCopilotTools` hook:

```tsx
// hooks/useCopilotTools.ts (web only)
import { useCopilotAction } from '@copilotkit/react-core';

export function useCopilotTools() {
  useCopilotAction({
    name: 'get_wallet_balance',
    description: 'Get the user\'s current wallet balance',
    handler: async () => {
      const wallets = await getWallets();
      return { balance: wallets[0].balance };
    },
  });
}
```

### Available MCP Tools

From CopilotKit MCP (development only):
- `search-docs` - Semantic search for financial literacy (dev/implementation)
- `search-code` - Developer code search (dev/implementation)
- `CopilotKit_MCP-search-code` - Indexed codebase search
- `CopilotKit_MCP-search-docs` - Documentation search

**Production RAG:** The production copilot uses **bge-m3 embeddings** (1024-dim) via LanceDB/pgvector for semantic search, NOT MCP tools. MCP is for development assistance only.

### Smartpay Domain Tools (To Implement)

See `PRD_AGENTIC_COPILOT_CONSOLIDATED.md` for complete list:
- `get_wallet_overview` - All wallets + balances
- `get_recent_activity` - Transaction history
- `find_nearby_agents` - Agent locator
- `create_wallet` - Wallet creation
- `initiate_send_money` - P2P transfers
- And more...

## Context Integration

### UserContext

Provides user profile:

```tsx
import { useUser } from '@/contexts/UserContext';

const { profile, isAuthenticated } = useUser();
```

### WalletsContext

Manages wallet state:

```tsx
import { useWallets } from '@/contexts/WalletsContext';

const { wallets, totalBalance, fetchWallets, getWalletById } = useWallets();
```

### CopilotContext

Manages conversation:

```tsx
import { useCopilotContext } from '@/contexts/copilot/CopilotContext';

const { messages, appendMessage, setPendingAction } = useCopilotContext();
```

## Error Handling

### Session Errors

```tsx
if (sessionData.error) {
  return (
    <CopilotErrorState
      title="Session Error"
      message={sessionData.error}
      onRetry={initializeSession}
    />
  );
}
```

### Tool Execution Errors

```tsx
try {
  await executeTool();
} catch (error) {
  appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
  console.error('Tool execution error:', error);
}
```

## Testing

### Unit Tests

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { BaseCard } from './BaseCard';

test('BaseCard renders with title and actions', () => {
  const onConfirm = jest.fn();
  const { getByText, getByTestId } = render(
    <BaseCard 
      title="Test Card"
      actions={[{ id: 'confirm', label: 'Confirm', onPress: onConfirm }]}
      testID="test-card"
    />
  );
  
  expect(getByText('Test Card')).toBeTruthy();
  fireEvent.press(getByTestId('test-card-action-confirm'));
  expect(onConfirm).toHaveBeenCalled();
});
```

### Integration Tests

See `e2e-test-report.md` for E2E testing strategy.

## Performance Considerations

1. **Message List Optimization**
   - Use `FlatList` with `keyExtractor` for efficient rendering
   - Implement virtualization for long conversation histories

2. **Session Data Caching**
   - Wallet data cached in `useCopilotSession`
   - Refresh only when needed (post-transaction, manual refresh)

3. **Image Optimization**
   - Use `resizeMode="contain"` for logos
   - Lazy load card content if heavy

## Security

1. **Authentication**
   - All tools require valid JWT from Supabase Auth
   - Session auto-resets on logout

2. **2FA for Transactions**
   - Use `pendingAction` flow for PIN/biometric confirmation
   - Never execute financial actions without confirmation

3. **Input Validation**
   - Sanitize user input before sending to backend
   - Validate tool responses before rendering

## Next Steps

### Phase 1: Complete Core Chat (Current)
- ✅ Base infrastructure (contexts, hooks, cards)
- ✅ Session management
- ✅ Basic conversation flow
- 🔲 CopilotKit runtime integration
- 🔲 Tool registration

### Phase 2: Smartpay Domain Tools
- Wallet tools (create, edit, overview)
- Transaction tools (send, cashout, voucher)
- Loan tools (offer, apply)

### Phase 3: Location Services
- Agent finder
- ATM locator
- Nampost offices

### Phase 4: Financial Literacy
- Knowledge base integration with **bge-m3 embeddings**
- Educational content cards
- Semantic search via LanceDB (1024-dim vectors, <50ms latency)
- No API costs - bge-m3 runs locally on Python backend

### Phase 5: Open Banking
- OBS consent flows
- AIS (account info)
- PISP (payment initiation)

## References

- **Main PRD:** `PRD_AGENTIC_COPILOT_CONSOLIDATED.md`
- **Original PRD:** `PRD_AGENTIC_COPILOT.md`
- **Design System:** `constants/designSystem.ts`
- **OBS Implementation:** `OBS_IMPLEMENTATION_SUMMARY.md`

## Support

For questions or issues:
1. Check the PRD documents for requirements
2. Review existing card implementations for patterns
3. Test with mock data before connecting to backend
4. Ensure proper TypeScript typing for all components

---

**Last Updated:** March 16, 2026  
**Version:** 0.5 (Consolidated Single Chat Interface)
