# **CopilotKit Integration Plan for LifeCompass**
## **Comprehensive Integration Guide**

---

## **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [What is CopilotKit?](#what-is-copilotkit)
3. [Why Integrate CopilotKit?](#why-integrate-copilotkit)
4. [Current LifeCompass Architecture](#current-lifecompass-architecture)
5. [Integration Architecture](#integration-architecture)
6. [Step-by-Step Integration Plan](#step-by-step-integration-plan)
7. [Code Implementation](#code-implementation)
8. [Migration Strategy](#migration-strategy)
9. [Benefits & Considerations](#benefits--considerations)
10. [Testing & Deployment](#testing--deployment)

---

## **Executive Summary**

This document outlines the integration of **CopilotKit** into LifeCompass, replacing the current custom chat widget with a production-ready, feature-rich AI copilot framework. CopilotKit will enhance LifeCompass by providing:

- **Agentic Generative UI**: Dynamic UI components rendered by AI agents
- **Shared State Management**: Bidirectional state synchronization between UI and agents
- **Human-in-the-Loop (HITL)**: User intervention and approval workflows
- **Frontend & Backend Actions**: Seamless integration with existing LifeCompass tools
- **LangGraph Integration**: Native support for our existing Python agent system
- **Enhanced UX**: Professional chat interface with advanced features

**Integration Timeline**: 2-3 weeks  
**Complexity**: Medium  
**Impact**: High - Significantly improves AI interaction capabilities

---

## **What is CopilotKit?**

CopilotKit is an open-source framework for building AI copilots and agents directly into React applications. Key features include:

### **Core Capabilities**

1. **React Components**: Pre-built, customizable chat interfaces (`CopilotChat`, `CopilotSidebar`, `CopilotPopup`)
2. **Agent Infrastructure**: Support for LangGraph, CrewAI, and custom agent frameworks
3. **State Management**: `useCopilotReadable` and `useCopilotAction` hooks for app integration
4. **Generative UI**: Render custom UI components based on agent state
5. **Backend Integration**: Python SDK for connecting FastAPI agents
6. **Human-in-the-Loop**: Interrupt flows for user approval
7. **Message Persistence**: Built-in support for conversation history

### **Key Components**

- **`@copilotkit/react-core`**: Core React hooks and providers
- **`@copilotkit/react-ui`**: Pre-built UI components
- **`@copilotkit/runtime`**: Backend runtime for Next.js
- **`@copilotkit/sdk/python`**: Python SDK for FastAPI integration

---

## **Why Integrate CopilotKit?**

### **Current Limitations**

1. **Custom Chat Widget**: Basic implementation, limited features
2. **Manual State Management**: No automatic context sharing
3. **No Agent Integration**: Direct API calls, no agent framework support
4. **Limited UX**: Basic chat interface without advanced features
5. **No Generative UI**: Static responses only

### **CopilotKit Benefits**

1. **Production-Ready**: Battle-tested framework used by many applications
2. **Agent-Native**: Built for agent frameworks (LangGraph, CrewAI)
3. **Rich Features**: Suggestions, message history, streaming, tool calls
4. **Better UX**: Professional chat interface with animations
5. **Developer Experience**: Easy integration, comprehensive documentation
6. **Scalability**: Handles complex agent workflows efficiently

---

## **Current LifeCompass Architecture**

### **Frontend (Next.js)**

```
ChatWidget.tsx (Custom Component)
    ↓
/api/chat (Next.js API Route)
    ↓
Python FastAPI Agent (/chat endpoint)
    ↓
Pydantic AI Agent (rag_agent)
    ↓
Tools (vector_search, graph_search, CRM tools)
```

### **Current Implementation**

- **ChatWidget**: Custom React component with basic chat UI
- **API Route**: `/api/chat` handles POST requests
- **Backend**: Python FastAPI with Pydantic AI agent
- **Tools**: 20+ tools for search, CRM, documents, calculations

### **Key Features to Preserve**

- Persona-based context (customer/advisor)
- Session management
- Tool calling (vector search, CRM operations)
- Streaming responses
- Message history

---

## **Integration Architecture**

### **New Architecture with CopilotKit**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  CopilotKit Provider                                        │
│    ├─ CopilotChat Component                                 │
│    ├─ useCopilotReadable (App State)                        │
│    ├─ useCopilotAction (Frontend Actions)                   │
│    └─ useCopilotChatSuggestions                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Route                              │
├─────────────────────────────────────────────────────────────┤
│  /api/copilotkit (CopilotRuntime Handler)                  │
│    ├─ LangGraphAgent Integration                            │
│    ├─ Remote Endpoints (Python Backend)                    │
│    └─ Message Streaming                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│           Python FastAPI Backend                            │
├─────────────────────────────────────────────────────────────┤
│  LangGraphAgent (CopilotKit SDK)                           │
│    ├─ Wraps existing Pydantic AI Agent                      │
│    ├─ Exposes Tools as CopilotKit Actions                   │
│    └─ Handles State Management                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Existing Agent System                           │
├─────────────────────────────────────────────────────────────┤
│  Pydantic AI Agent (rag_agent)                              │
│    ├─ Vector Search Tools                                   │
│    ├─ Graph Search Tools                                    │
│    ├─ CRM Tools                                             │
│    └─ Document Search Tools                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## **Step-by-Step Integration Plan**

### **Phase 1: Frontend Setup (Week 1, Days 1-3)**

#### **Step 1.1: Install Dependencies**

```bash
cd lifecompass-next
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

#### **Step 1.2: Create CopilotKit Provider**

Create `app/providers/CopilotKitProvider.tsx`:

```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function CopilotKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY}
    >
      {children}
      <CopilotSidebar
        labels={{
          title: "LifeCompass Assistant",
          initial: "Hello! I'm your LifeCompass AI assistant. How can I help you navigate your financial future today?",
        }}
        defaultOpen={false}
      />
    </CopilotKit>
  );
}
```

#### **Step 1.3: Wrap Application**

Update `app/layout.tsx`:

```typescript
import { CopilotKitProvider } from "@/app/providers/CopilotKitProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKitProvider>
          {children}
        </CopilotKitProvider>
      </body>
    </html>
  );
}
```

#### **Step 1.4: Add App State Context**

Create `app/providers/AppStateProvider.tsx`:

```typescript
"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useEffect, useState } from "react";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomerPersona, setSelectedCustomerPersona] = useState<string | null>(null);
  const [selectedAdvisorPersona, setSelectedAdvisorPersona] = useState<string | null>(null);

  useEffect(() => {
    // Load personas from sessionStorage
    if (typeof window !== "undefined") {
      const customerPersona = sessionStorage.getItem("selectedCustomerPersona");
      const advisorPersona = sessionStorage.getItem("selectedAdvisorPersona");
      setSelectedCustomerPersona(customerPersona);
      setSelectedAdvisorPersona(advisorPersona);
    }
  }, []);

  // Expose app state to CopilotKit
  useCopilotReadable({
    description: "Selected customer persona for context-aware responses",
    value: selectedCustomerPersona ? JSON.parse(selectedCustomerPersona) : null,
  });

  useCopilotReadable({
    description: "Selected advisor persona for advisor-specific features",
    value: selectedAdvisorPersona ? JSON.parse(selectedAdvisorPersona) : null,
  });

  useCopilotReadable({
    description: "User type (customer or advisor) based on selected persona",
    value: selectedAdvisorPersona ? "advisor" : "customer",
  });

  return <>{children}</>;
}
```

#### **Step 1.5: Create Frontend Actions**

Create `app/actions/copilotActions.tsx`:

```typescript
"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useRouter } from "next/navigation";

export function useLifeCompassActions() {
  const router = useRouter();

  // Navigate to products page
  useCopilotAction({
    name: "navigateToProducts",
    description: "Navigate to the products page to browse Old Mutual products",
    parameters: [],
    handler: () => {
      router.push("/products");
    },
  });

  // Navigate to policies
  useCopilotAction({
    name: "navigateToPolicies",
    description: "Navigate to the policies page to view customer policies",
    parameters: [],
    handler: () => {
      router.push("/policies");
    },
  });

  // Navigate to claims
  useCopilotAction({
    name: "navigateToClaims",
    description: "Navigate to the claims page to file or view claims",
    parameters: [],
    handler: () => {
      router.push("/claims");
    },
  });

  // Navigate to advisors
  useCopilotAction({
    name: "navigateToAdvisors",
    description: "Navigate to the advisors page to find a financial advisor",
    parameters: [],
    handler: () => {
      router.push("/advisors");
    },
  });

  // Get quote for a product
  useCopilotAction({
    name: "getProductQuote",
    description: "Navigate to advisor booking with product context to get a quote",
    parameters: [
      {
        name: "productName",
        type: "string",
        description: "Name of the product (e.g., 'OMP Severe Illness Cover')",
        required: true,
      },
    ],
    handler: ({ productName }) => {
      router.push(`/advisors?product=${encodeURIComponent(productName)}`);
    },
  });
}
```

### **Phase 2: Backend Integration (Week 1, Days 4-5)**

#### **Step 2.1: Create CopilotKit API Route**

Create `app/api/copilotkit/route.ts`:

```typescript
import { copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { CopilotRuntime, LangChainAdapter } from "@copilotkit/runtime";
import { LangChainAdapter } from "@copilotkit/runtime";

// Import your existing agent (we'll wrap it)
import { createLangGraphAgent } from "@/lib/agents/langgraph-agent";

const runtime = new CopilotRuntime();

export async function POST(req: NextRequest) {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: await createLangGraphAgent(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}
```

#### **Step 2.2: Create LangGraph Agent Wrapper**

Create `lib/agents/langgraph-agent.ts`:

```typescript
import { LangGraphAgent } from "@copilotkit/sdk/python";
import { RemoteEndpoints } from "@copilotkit/runtime";

// This will connect to our Python backend
export async function createLangGraphAgent() {
  // Connect to Python FastAPI backend
  const remoteEndpoints = new RemoteEndpoints({
    url: process.env.AGENT_API_URL || "http://localhost:8000",
  });

  return new LangGraphAgent({
    name: "lifecompass-agent",
    remoteEndpoints,
  });
}
```

### **Phase 3: Python Backend Integration (Week 2, Days 1-3)**

#### **Step 3.1: Install Python SDK**

```bash
cd LifeCompass/agent
pip install copilotkit
```

#### **Step 3.2: Create LangGraph Agent Wrapper**

Create `LifeCompass/agent/copilotkit_integration.py`:

```python
"""
CopilotKit integration for LifeCompass agent.
Wraps existing Pydantic AI agent with CopilotKit LangGraphAgent.
"""

from copilotkit import LangGraphAgent, RemoteEndpoints
from copilotkit.integrations.langgraph import create_langgraph_agent
from langgraph.graph import StateGraph, END
from typing import Dict, Any, List
import asyncio

from .agent import rag_agent, AgentDependencies
from .tools import (
    vector_search_tool,
    graph_search_tool,
    hybrid_search_tool,
    get_customer_profile_tool,
    get_customer_policies_tool,
    search_product_documents_tool,
    # ... other tools
)


def create_lifecompass_agent() -> LangGraphAgent:
    """
    Create a LangGraph agent that wraps our existing Pydantic AI agent.
    """
    
    # Define agent state
    class AgentState:
        messages: List[Dict[str, Any]]
        session_id: str
        user_id: str | None
        metadata: Dict[str, Any]
    
    # Create LangGraph workflow
    def agent_node(state: AgentState):
        """Main agent node that calls our existing agent."""
        # Extract last message
        last_message = state.messages[-1]["content"]
        
        # Create dependencies
        deps = AgentDependencies(
            session_id=state.session_id,
            user_id=state.user_id,
            voice_mode=False
        )
        
        # Run existing agent
        result = asyncio.run(rag_agent.run(last_message, deps=deps))
        
        # Add response to messages
        state.messages.append({
            "role": "assistant",
            "content": result.data
        })
        
        return state
    
    # Build graph
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)
    
    graph = workflow.compile()
    
    # Create LangGraphAgent
    agent = create_langgraph_agent(
        graph=graph,
        name="lifecompass-agent",
        description="LifeCompass AI assistant for financial services",
    )
    
    return agent


# Expose agent for FastAPI
lifecompass_agent = create_lifecompass_agent()
```

#### **Step 3.3: Update FastAPI to Expose CopilotKit Endpoint**

Update `LifeCompass/agent/api.py`:

```python
from copilotkit.integrations.fastapi import add_copilotkit_endpoints
from .copilotkit_integration import lifecompass_agent

# Add CopilotKit endpoints
add_copilotkit_endpoints(
    app=app,
    agent=lifecompass_agent,
    path="/copilotkit",
)
```

### **Phase 4: Advanced Features (Week 2, Days 4-5)**

#### **Step 4.1: Add Generative UI**

Create `app/components/GenerativeUI.tsx`:

```typescript
"use client";

import { useCoAgentStateRender } from "@copilotkit/react-core";

export function GenerativeUI() {
  const { state, render } = useCoAgentStateRender();

  // Render custom UI based on agent state
  if (state?.type === "product_search") {
    return (
      <div className="product-results">
        {state.results.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }

  return null;
}
```

#### **Step 4.2: Add Chat Suggestions**

Create `app/hooks/useChatSuggestions.ts`:

```typescript
"use client";

import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { useCopilotReadable } from "@copilotkit/react-core";

export function useLifeCompassSuggestions() {
  const [selectedPersona] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("selectedCustomerPersona");
    }
    return null;
  });

  useCopilotReadable({
    description: "Current user persona for personalized suggestions",
    value: selectedPersona,
  });

  const suggestions = useCopilotChatSuggestions({
    minSuggestions: 3,
    maxSuggestions: 5,
  });

  return suggestions;
}
```

#### **Step 4.3: Add Message Persistence**

Update `app/providers/CopilotKitProvider.tsx`:

```typescript
import { useCopilotChat } from "@copilotkit/react-core";
import { useEffect } from "react";

export function MessagePersistence() {
  const { messages, setMessages } = useCopilotChat();

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("copilotkit-messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("copilotkit-messages", JSON.stringify(messages));
    }
  }, [messages]);

  return null;
}
```

### **Phase 5: Migration & Testing (Week 3)**

#### **Step 5.1: Gradual Migration**

1. **Keep existing ChatWidget** as fallback
2. **Add CopilotKit** alongside existing implementation
3. **Feature flag** to switch between implementations
4. **A/B testing** with select users
5. **Full migration** after validation

#### **Step 5.2: Testing Checklist**

- [ ] Chat interface renders correctly
- [ ] Messages send and receive
- [ ] Tool calls work (vector search, CRM tools)
- [ ] Persona context is preserved
- [ ] Frontend actions trigger navigation
- [ ] Message history persists
- [ ] Streaming responses work
- [ ] Error handling works
- [ ] Mobile responsiveness
- [ ] Performance (<3s response time)

---

## **Code Implementation**

### **Complete Frontend Integration**

```typescript
// app/layout.tsx
import { CopilotKitProvider } from "@/app/providers/CopilotKitProvider";
import { AppStateProvider } from "@/app/providers/AppStateProvider";
import { useLifeCompassActions } from "@/app/actions/copilotActions";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKitProvider>
          <AppStateProvider>
            <LifeCompassActions />
            {children}
          </AppStateProvider>
        </CopilotKitProvider>
      </body>
    </html>
  );
}

function LifeCompassActions() {
  useLifeCompassActions();
  return null;
}
```

### **Complete Backend Integration**

```python
# LifeCompass/agent/copilotkit_integration.py
from copilotkit import LangGraphAgent
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any
import asyncio

from .agent import rag_agent, AgentDependencies

class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    session_id: str
    user_id: str | None
    metadata: Dict[str, Any]

def create_lifecompass_agent():
    """Create LangGraph agent wrapping Pydantic AI agent."""
    
    def agent_node(state: AgentState):
        """Process message through existing agent."""
        last_message = state.messages[-1]["content"]
        
        deps = AgentDependencies(
            session_id=state.session_id,
            user_id=state.user_id,
            voice_mode=False
        )
        
        # Run existing agent
        result = asyncio.run(rag_agent.run(last_message, deps=deps))
        
        # Add response
        state["messages"].append({
            "role": "assistant",
            "content": result.data
        })
        
        return state
    
    # Build graph
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)
    
    graph = workflow.compile()
    
    # Create CopilotKit agent
    from copilotkit.integrations.langgraph import create_langgraph_agent
    
    agent = create_langgraph_agent(
        graph=graph,
        name="lifecompass-agent",
        description="LifeCompass AI assistant for Old Mutual financial services",
    )
    
    return agent
```

---

## **Migration Strategy**

### **Option 1: Gradual Migration (Recommended)**

1. **Week 1**: Install CopilotKit, keep existing chat
2. **Week 2**: Implement CopilotKit alongside existing
3. **Week 3**: Feature flag to switch between implementations
4. **Week 4**: A/B test with 10% of users
5. **Week 5**: Full migration if successful

### **Option 2: Direct Replacement**

1. **Week 1**: Implement CopilotKit
2. **Week 2**: Testing and bug fixes
3. **Week 3**: Deploy to production

### **Migration Checklist**

- [ ] Install CopilotKit packages
- [ ] Create provider and wrap app
- [ ] Create API route
- [ ] Integrate Python backend
- [ ] Migrate frontend actions
- [ ] Test all features
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

## **Benefits & Considerations**

### **Benefits**

1. **Production-Ready**: Battle-tested framework
2. **Rich Features**: Suggestions, history, streaming, tool calls
3. **Better UX**: Professional chat interface
4. **Agent-Native**: Built for agent frameworks
5. **Developer Experience**: Easy to use, well-documented
6. **Scalability**: Handles complex workflows
7. **Community**: Active development and support

### **Considerations**

1. **Learning Curve**: Team needs to learn CopilotKit APIs
2. **Bundle Size**: Additional dependencies (~200KB)
3. **Migration Effort**: 2-3 weeks of development
4. **Customization**: May need custom styling for brand alignment
5. **Dependencies**: Additional npm packages to maintain

### **Cost-Benefit Analysis**

**Investment**: 2-3 weeks development time  
**Benefits**: 
- Improved UX (estimated 20% increase in engagement)
- Reduced maintenance (framework handles edge cases)
- Faster feature development (pre-built components)
- Better scalability (handles complex agent workflows)

**ROI**: Positive - Reduced long-term maintenance costs and improved user experience

---

## **Testing & Deployment**

### **Testing Strategy**

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test API routes and backend
3. **E2E Tests**: Test complete user flows
4. **Performance Tests**: Ensure <3s response time
5. **Accessibility Tests**: WCAG 2.1 AA compliance

### **Deployment Plan**

1. **Staging**: Deploy to staging environment
2. **Smoke Tests**: Basic functionality verification
3. **User Acceptance**: Test with internal team
4. **Production**: Gradual rollout (10% → 50% → 100%)
5. **Monitoring**: Track errors, performance, user feedback

### **Rollback Plan**

- Keep existing ChatWidget as fallback
- Feature flag to switch implementations
- Database migration scripts ready for rollback
- Monitor error rates and user feedback

---

## **Next Steps**

1. **Review & Approval**: Get stakeholder approval
2. **Installation**: Install CopilotKit packages
3. **Implementation**: Follow step-by-step plan
4. **Testing**: Comprehensive testing
5. **Deployment**: Gradual rollout
6. **Monitoring**: Track metrics and user feedback
7. **Iteration**: Continuous improvement based on feedback

---

## **Resources**

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [CopilotKit GitHub](https://github.com/CopilotKit/CopilotKit)
- [LangGraph Integration Guide](https://docs.copilotkit.ai/coagents/quickstart/langgraph)
- [React Components Reference](https://docs.copilotkit.ai/reference/components/CopilotChat)
- [Python SDK Documentation](https://docs.copilotkit.ai/reference/sdk/python/LangGraph)

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Author**: LifeCompass Development Team  
**Status**: Draft - Pending Review

