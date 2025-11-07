# **CopilotKit Integration Plan for LifeCompass (Next.js Only)**
## **Comprehensive Next.js Integration Guide**

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

This document outlines the integration of **CopilotKit** into LifeCompass Next.js application, replacing the current custom chat widget with a production-ready, feature-rich AI copilot framework. This is a **Next.js-only implementation** that integrates with the existing `LifeCompassAgent` class.

CopilotKit will enhance LifeCompass by providing:

- **Professional Chat UI**: Pre-built, customizable chat components
- **Frontend Actions**: Seamless navigation and UI interactions
- **App State Integration**: Automatic context sharing with `useCopilotReadable`
- **Message Persistence**: Built-in conversation history management
- **Chat Suggestions**: Auto-generated suggestions based on app state
- **Enhanced UX**: Streaming, animations, and professional interface

**Integration Timeline**: 1-2 weeks  
**Complexity**: Low-Medium  
**Impact**: High - Significantly improves AI interaction capabilities

---

## **What is CopilotKit?**

CopilotKit is an open-source framework for building AI copilots directly into React/Next.js applications. Key features include:

### **Core Capabilities**

1. **React Components**: Pre-built chat interfaces (`CopilotChat`, `CopilotSidebar`, `CopilotPopup`)
2. **State Management**: `useCopilotReadable` and `useCopilotAction` hooks
3. **Next.js Runtime**: Built-in support for Next.js API routes
4. **LLM Adapters**: Support for OpenAI, Anthropic, Google, and custom providers
5. **Message Persistence**: Built-in localStorage and database support
6. **Chat Suggestions**: Auto-generated suggestions based on app state

### **Key Packages for Next.js**

- **`@copilotkit/react-core`**: Core React hooks and providers
- **`@copilotkit/react-ui`**: Pre-built UI components
- **`@copilotkit/runtime`**: Next.js runtime for API routes

---

## **Why Integrate CopilotKit?**

### **Current Limitations**

1. **Custom Chat Widget**: Basic implementation, limited features
2. **Manual State Management**: No automatic context sharing
3. **No Suggestions**: Users don't get helpful prompts
4. **Limited UX**: Basic chat interface without advanced features
5. **Manual Message History**: Custom localStorage implementation

### **CopilotKit Benefits**

1. **Production-Ready**: Battle-tested framework
2. **Rich Features**: Suggestions, history, streaming, animations
3. **Better UX**: Professional chat interface
4. **Developer Experience**: Easy integration, comprehensive documentation
5. **Automatic State Sync**: App state automatically shared with AI
6. **Frontend Actions**: AI can trigger navigation and UI changes

---

## **Current LifeCompass Architecture**

### **Frontend (Next.js)**

```
ChatWidget.tsx (Custom Component)
    ↓
/api/chat (Next.js API Route)
    ↓
LifeCompassAgent (lib/agent/index.ts)
    ↓
Tools (vector_search, graph_search, CRM tools)
    ↓
Database (Neon PostgreSQL)
```

### **Current Implementation**

- **ChatWidget**: Custom React component (`components/ChatWidget.tsx`)
- **API Route**: `/api/chat` handles POST requests
- **Agent**: `LifeCompassAgent` class with DeepSeek provider
- **Tools**: 20+ tools for search, CRM, documents, calculations
- **Database**: Neon PostgreSQL for sessions and messages

### **Key Features to Preserve**

- Persona-based context (customer/advisor)
- Session management
- Tool calling (vector search, CRM operations)
- Streaming responses (if implemented)
- Message history

---

## **Integration Architecture**

### **New Architecture with CopilotKit (Next.js Only)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  CopilotKit Provider                                         │
│    ├─ CopilotSidebar Component                              │
│    ├─ useCopilotReadable (App State)                        │
│    ├─ useCopilotAction (Frontend Actions)                   │
│    └─ useCopilotChatSuggestions                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Route                               │
├─────────────────────────────────────────────────────────────┤
│  /api/copilotkit (CopilotRuntime Handler)                   │
│    ├─ OpenAIAdapter (or DeepSeekAdapter)                   │
│    ├─ Backend Actions (Tool Integration)                     │
│    └─ Message Streaming                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│           Existing LifeCompassAgent                          │
├─────────────────────────────────────────────────────────────┤
│  LifeCompassAgent (lib/agent/index.ts)                      │
│    ├─ Vector Search Tools                                   │
│    ├─ Graph Search Tools                                    │
│    ├─ CRM Tools                                             │
│    └─ Document Search Tools                                 │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Database (Neon PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## **Step-by-Step Integration Plan**

### **Phase 1: Installation & Setup (Day 1)**

#### **Step 1.1: Install Dependencies**

```bash
cd lifecompass-next
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
```

#### **Step 1.2: Update package.json**

The packages will be added automatically. Verify:

```json
{
  "dependencies": {
    "@copilotkit/react-core": "^1.x.x",
    "@copilotkit/react-ui": "^1.x.x",
    "@copilotkit/runtime": "^1.x.x"
  }
}
```

### **Phase 2: Frontend Integration (Days 2-3)**

#### **Step 2.1: Create CopilotKit Provider**

Create `app/providers/CopilotKitProvider.tsx`:

```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

interface CopilotKitProviderProps {
  children: React.ReactNode;
}

export function CopilotKitProvider({ children }: CopilotKitProviderProps) {
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
        clickableOutside={true}
      />
    </CopilotKit>
  );
}
```

#### **Step 2.2: Wrap Application**

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

#### **Step 2.3: Add App State Context**

Create `app/providers/AppStateProvider.tsx`:

```typescript
"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { useEffect, useState } from "react";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomerPersona, setSelectedCustomerPersona] = useState<string | null>(null);
  const [selectedAdvisorPersona, setSelectedAdvisorPersona] = useState<string | null>(null);
  const [userType, setUserType] = useState<"customer" | "advisor">("customer");

  useEffect(() => {
    // Load personas from sessionStorage
    if (typeof window !== "undefined") {
      const customerPersona = sessionStorage.getItem("selectedCustomerPersona");
      const advisorPersona = sessionStorage.getItem("selectedAdvisorPersona");
      
      setSelectedCustomerPersona(customerPersona);
      setSelectedAdvisorPersona(advisorPersona);
      setUserType(advisorPersona ? "advisor" : "customer");

      // Listen for storage changes
      const handleStorageChange = () => {
        const updatedCustomer = sessionStorage.getItem("selectedCustomerPersona");
        const updatedAdvisor = sessionStorage.getItem("selectedAdvisorPersona");
        setSelectedCustomerPersona(updatedCustomer);
        setSelectedAdvisorPersona(updatedAdvisor);
        setUserType(updatedAdvisor ? "advisor" : "customer");
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  // Expose app state to CopilotKit
  useCopilotReadable({
    description: "Selected customer persona for context-aware responses. Contains customer number, name, and profile data.",
    value: selectedCustomerPersona ? JSON.parse(selectedCustomerPersona) : null,
  });

  useCopilotReadable({
    description: "Selected advisor persona for advisor-specific features. Contains advisor number, name, and profile data.",
    value: selectedAdvisorPersona ? JSON.parse(selectedAdvisorPersona) : null,
  });

  useCopilotReadable({
    description: "User type (customer or advisor) based on selected persona",
    value: userType,
  });

  return <>{children}</>;
}
```

Update `app/layout.tsx` to include AppStateProvider:

```typescript
import { CopilotKitProvider } from "@/app/providers/CopilotKitProvider";
import { AppStateProvider } from "@/app/providers/AppStateProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKitProvider>
          <AppStateProvider>
            {children}
          </AppStateProvider>
        </CopilotKitProvider>
      </body>
    </html>
  );
}
```

#### **Step 2.4: Create Frontend Actions**

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
    description: "Navigate to the products page to browse Old Mutual products and services",
    parameters: [],
    handler: () => {
      router.push("/products");
    },
  });

  // Navigate to policies
  useCopilotAction({
    name: "navigateToPolicies",
    description: "Navigate to the policies page to view customer policies and coverage details",
    parameters: [],
    handler: () => {
      router.push("/policies");
    },
  });

  // Navigate to claims
  useCopilotAction({
    name: "navigateToClaims",
    description: "Navigate to the claims page to file a new claim or view existing claims",
    parameters: [],
    handler: () => {
      router.push("/claims");
    },
  });

  // Navigate to advisors
  useCopilotAction({
    name: "navigateToAdvisors",
    description: "Navigate to the advisors page to find and connect with financial advisors",
    parameters: [],
    handler: () => {
      router.push("/advisors");
    },
  });

  // Navigate to tools
  useCopilotAction({
    name: "navigateToTools",
    description: "Navigate to the tools page for financial calculators and planning tools",
    parameters: [],
    handler: () => {
      router.push("/tools");
    },
  });

  // Get quote for a product
  useCopilotAction({
    name: "getProductQuote",
    description: "Navigate to advisor booking with product context to get a personalized quote",
    parameters: [
      {
        name: "productName",
        type: "string",
        description: "Name of the product (e.g., 'OMP Severe Illness Cover', 'Retirement Solutions')",
        required: true,
      },
    ],
    handler: ({ productName }: { productName: string }) => {
      router.push(`/advisors?product=${encodeURIComponent(productName)}`);
    },
  });

  // View customer profile
  useCopilotAction({
    name: "viewCustomerProfile",
    description: "Navigate to the customer profile page to view detailed customer information",
    parameters: [
      {
        name: "customerId",
        type: "string",
        description: "Customer ID or customer number",
        required: true,
      },
    ],
    handler: ({ customerId }: { customerId: string }) => {
      router.push(`/customer/profile/${customerId}`);
    },
  });
}
```

Create a component to initialize actions:

Create `app/components/LifeCompassActions.tsx`:

```typescript
"use client";

import { useLifeCompassActions } from "@/app/actions/copilotActions";

export function LifeCompassActions() {
  useLifeCompassActions();
  return null; // This component just registers actions
}
```

Add to `app/layout.tsx`:

```typescript
import { LifeCompassActions } from "@/app/components/LifeCompassActions";

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
```

### **Phase 3: Backend Integration (Days 4-5)**

#### **Step 3.1: Create CopilotKit API Route**

Create `app/api/copilotkit/route.ts`:

```typescript
import { copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import { createAgent } from "@/lib/agent";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

// Initialize OpenAI client (or use your existing DeepSeek provider)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_URL || "https://api.openai.com/v1",
});

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.LLM_MODEL || "gpt-4",
});

const runtime = new CopilotRuntime();

// Register backend actions (tools) with CopilotKit
runtime.registerAction({
  name: "vectorSearch",
  description: "Search the knowledge base using semantic similarity",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "Search query",
      required: true,
    },
    {
      name: "limit",
      type: "number",
      description: "Maximum number of results (default: 10)",
      required: false,
    },
  ],
  handler: async ({ query, limit = 10 }) => {
    // Call your existing vector search tool
    const agent = createAgent({
      sessionId: "",
      userId: null,
      searchPreferences: {
        useVector: true,
        useGraph: false,
        defaultLimit: limit,
      },
    });

    // This would need to be adapted to work with your agent
    // For now, return a placeholder
    return {
      results: [],
      query,
      message: "Vector search executed",
    };
  },
});

runtime.registerAction({
  name: "getCustomerProfile",
  description: "Get customer profile information including policies and claims",
  parameters: [
    {
      name: "customerNumber",
      type: "string",
      description: "Customer number (e.g., CUST-001)",
      required: true,
    },
  ],
  handler: async ({ customerNumber }) => {
    // Import your existing function
    const { getCustomerByNumber, getCustomerPolicies, getCustomerClaims } = await import("@/lib/db/neon");
    
    const customer = await getCustomerByNumber(customerNumber);
    if (!customer) {
      return { error: "Customer not found" };
    }

    const policies = await getCustomerPolicies(customer.id);
    const claims = await getCustomerClaims(customer.id);

    return {
      customer,
      policies,
      claims,
      policyCount: policies.length,
      claimCount: claims.length,
    };
  },
});

runtime.registerAction({
  name: "searchProductDocuments",
  description: "Search for product-related documents and guides",
  parameters: [
    {
      name: "productName",
      type: "string",
      description: "Product name (e.g., 'Retirement Solutions', 'OMP Severe Illness Cover')",
      required: true,
    },
  ],
  handler: async ({ productName }) => {
    // Import your existing function
    const { searchDocumentsByProduct } = await import("@/lib/db/neon");
    
    const documents = await searchDocumentsByProduct(productName);
    
    return {
      productName,
      documents: documents.map(doc => ({
        documentNumber: doc.document_number,
        title: doc.title,
        category: doc.category,
        documentType: doc.document_type,
        description: doc.description,
        viewUrl: `/api/documents/${doc.document_number}/view`,
        downloadUrl: `/api/documents/${doc.document_number}/download`,
      })),
      count: documents.length,
    };
  },
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimitResult = rateLimit(clientId);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
  } catch (error) {
    console.error("CopilotKit API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

#### **Step 3.2: Create Custom DeepSeek Adapter (Optional)**

If you want to use DeepSeek instead of OpenAI, create `lib/copilotkit/DeepSeekAdapter.ts`:

```typescript
import { LLMAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";

export class DeepSeekAdapter implements LLMAdapter {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });
  }

  async streamChat(messages: any[], options: any) {
    const stream = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      stream: true,
      ...options,
    });

    return stream;
  }

  async chat(messages: any[], options: any) {
    const response = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      ...options,
    });

    return response;
  }
}
```

Then update `app/api/copilotkit/route.ts`:

```typescript
import { DeepSeekAdapter } from "@/lib/copilotkit/DeepSeekAdapter";

const serviceAdapter = new DeepSeekAdapter(
  process.env.DEEPSEEK_API_KEY || ""
);
```

### **Phase 4: Advanced Features (Days 6-7)**

#### **Step 4.1: Add Chat Suggestions**

Create `app/hooks/useChatSuggestions.ts`:

```typescript
"use client";

import { useCopilotChatSuggestions } from "@copilotkit/react-core";
import { useCopilotReadable } from "@copilotkit/react-core";
import { useEffect, useState } from "react";

export function useLifeCompassSuggestions() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const customerPersona = sessionStorage.getItem("selectedCustomerPersona");
      const advisorPersona = sessionStorage.getItem("selectedAdvisorPersona");
      setSelectedPersona(advisorPersona || customerPersona);
    }
  }, []);

  useCopilotReadable({
    description: "Current user persona for personalized suggestions",
    value: selectedPersona ? JSON.parse(selectedPersona) : null,
  });

  const suggestions = useCopilotChatSuggestions({
    minSuggestions: 3,
    maxSuggestions: 5,
  });

  return suggestions;
}
```

#### **Step 4.2: Add Message Persistence**

Update `app/providers/CopilotKitProvider.tsx`:

```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotChat } from "@copilotkit/react-core";
import { useEffect } from "react";
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
        clickableOutside={true}
      />
      <MessagePersistence />
    </CopilotKit>
  );
}

function MessagePersistence() {
  const { messages, setMessages } = useCopilotChat();

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMessages = localStorage.getItem("copilotkit-messages");
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (e) {
          console.error("Failed to load messages:", e);
        }
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0 && typeof window !== "undefined") {
      localStorage.setItem("copilotkit-messages", JSON.stringify(messages));
    }
  }, [messages]);

  return null;
}
```

#### **Step 4.3: Customize Chat Appearance**

Update `app/providers/CopilotKitProvider.tsx` to match LifeCompass branding:

```typescript
import { CopilotSidebar } from "@copilotkit/react-ui";

<CopilotSidebar
  labels={{
    title: "LifeCompass Assistant",
    initial: "Hello! I'm your LifeCompass AI assistant. How can I help you navigate your financial future today?",
  }}
  defaultOpen={false}
  clickableOutside={true}
  className="copilot-sidebar-custom"
/>
```

Add custom styles to `app/globals.css`:

```css
/* CopilotKit Custom Styles */
.copilot-sidebar-custom {
  --copilot-primary-color: #00A651; /* OM Green */
  --copilot-secondary-color: #003B5C; /* OM Navy */
  --copilot-accent-color: #F7B500; /* OM Gold */
}

.copilot-sidebar-custom .copilot-chat-header {
  background: linear-gradient(135deg, #00A651 0%, #003B5C 100%);
}
```

### **Phase 5: Integration with Existing Agent (Days 8-10)**

#### **Step 5.1: Create Agent Wrapper**

Create `lib/copilotkit/agentWrapper.ts`:

```typescript
import { createAgent } from "@/lib/agent";
import { ChatRequest } from "@/lib/agent/models";

/**
 * Wraps LifeCompassAgent to work with CopilotKit
 */
export async function executeLifeCompassAgent(
  message: string,
  sessionId: string,
  metadata?: any
): Promise<string> {
  const agent = createAgent({
    sessionId,
    userId: metadata?.userId,
    searchPreferences: {
      useVector: true,
      useGraph: true,
      defaultLimit: 10,
    },
    metadata,
  });

  const response = await agent.executeAgent({
    message,
    sessionId,
    userId: metadata?.userId,
    metadata,
  });

  return response.message;
}
```

#### **Step 5.2: Update CopilotKit Route to Use Existing Agent**

Update `app/api/copilotkit/route.ts`:

```typescript
import { executeLifeCompassAgent } from "@/lib/copilotkit/agentWrapper";

// Custom message handler that uses your existing agent
runtime.setMessageHandler(async (message, context) => {
  const sessionId = context.sessionId || "";
  const metadata = {
    selectedCustomerPersona: context.metadata?.selectedCustomerPersona,
    selectedAdvisorPersona: context.metadata?.selectedAdvisorPersona,
    userType: context.metadata?.userType || "customer",
  };

  // Use your existing agent
  const response = await executeLifeCompassAgent(
    message.content,
    sessionId,
    metadata
  );

  return response;
});
```

---

## **Code Implementation**

### **Complete File Structure**

```
lifecompass-next/
├── app/
│   ├── providers/
│   │   ├── CopilotKitProvider.tsx
│   │   └── AppStateProvider.tsx
│   ├── actions/
│   │   └── copilotActions.tsx
│   ├── components/
│   │   └── LifeCompassActions.tsx
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts
│   └── layout.tsx
├── lib/
│   ├── copilotkit/
│   │   ├── agentWrapper.ts
│   │   └── DeepSeekAdapter.ts (optional)
│   └── agent/
│       └── (existing files)
└── package.json
```

### **Environment Variables**

Add to `.env.local`:

```bash
# CopilotKit (optional - only if using CopilotKit Cloud)
NEXT_PUBLIC_COPILOTKIT_API_KEY=your_api_key_here

# LLM Provider
OPENAI_API_KEY=your_key_here
# OR
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Model
LLM_MODEL=gpt-4
# OR
LLM_MODEL=deepseek-chat
```

---

## **Migration Strategy**

### **Option 1: Gradual Migration (Recommended)**

1. **Week 1, Days 1-3**: Install and set up CopilotKit
2. **Week 1, Days 4-5**: Implement alongside existing chat
3. **Week 2, Days 1-2**: Feature flag to switch between implementations
4. **Week 2, Days 3-4**: A/B test with 10% of users
5. **Week 2, Day 5**: Full migration if successful

### **Option 2: Direct Replacement**

1. **Week 1**: Implement CopilotKit
2. **Week 2, Days 1-2**: Testing and bug fixes
3. **Week 2, Day 3**: Deploy to production

### **Migration Checklist**

- [ ] Install CopilotKit packages
- [ ] Create provider and wrap app
- [ ] Create API route
- [ ] Integrate with existing agent
- [ ] Add frontend actions
- [ ] Add app state context
- [ ] Test all features
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Remove old ChatWidget (after validation)

---

## **Benefits & Considerations**

### **Benefits**

1. **Production-Ready**: Battle-tested framework
2. **Rich Features**: Suggestions, history, streaming, animations
3. **Better UX**: Professional chat interface
4. **Developer Experience**: Easy to use, well-documented
5. **Automatic State Sync**: App state automatically shared
6. **Frontend Actions**: AI can trigger navigation
7. **Next.js Native**: Built for Next.js, no Python backend needed

### **Considerations**

1. **Learning Curve**: Team needs to learn CopilotKit APIs
2. **Bundle Size**: Additional dependencies (~200KB gzipped)
3. **Migration Effort**: 1-2 weeks of development
4. **Customization**: May need custom styling for brand alignment
5. **Dependencies**: Additional npm packages to maintain

### **Cost-Benefit Analysis**

**Investment**: 1-2 weeks development time  
**Benefits**: 
- Improved UX (estimated 20% increase in engagement)
- Reduced maintenance (framework handles edge cases)
- Faster feature development (pre-built components)
- Better scalability (handles complex workflows)

**ROI**: Positive - Reduced long-term maintenance costs and improved user experience

---

## **Testing & Deployment**

### **Testing Strategy**

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test API routes
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
- Monitor error rates and user feedback
- Quick rollback if issues detected

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
- [Next.js Quickstart](https://docs.copilotkit.ai/quickstart?component=CopilotChat)
- [React Components Reference](https://docs.copilotkit.ai/reference/components/CopilotChat)
- [Frontend Actions Guide](https://docs.copilotkit.ai/guides/frontend-actions)
- [Backend Actions Guide](https://docs.copilotkit.ai/guides/backend-actions)

---

**Document Version**: 2.0 (Next.js Only)  
**Last Updated**: January 2025  
**Author**: LifeCompass Development Team  
**Status**: Ready for Implementation
