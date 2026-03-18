/**
 * Knowledge Base Service - Financial Literacy & Education
 * Location: fintech/smartpay/services/copilot/knowledgeBaseService.ts
 * Reference: PRD §4.6.3 - Educational Content System
 * 
 * Provides semantic search for financial literacy content, FAQs, and regulatory info.
 * Integrates with CopilotKit MCP search-docs tool for knowledge retrieval.
 * 
 * Features:
 * - Semantic search across educational content
 * - Related topics discovery
 * - Multi-language support (future)
 * - Accessibility-optimized for low literacy users
 */

import { getSecureItem } from '@/services/secureStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/**
 * Educational content structure
 */
export interface EducationalContent {
  id: string;
  title: string;
  topic: string;
  content: string;
  summary: string;
  level: 'basic' | 'intermediate' | 'advanced';
  language: 'en' | 'af' | 'de' | 'oshikwanyama' | 'herero';
  tags: string[];
  relatedTopics: string[];
  examples?: string[];
  diagrams?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  source: string;
  lastUpdated: Date;
}

/**
 * Knowledge base search result
 */
export interface KnowledgeSearchResult {
  content: EducationalContent;
  score: number;
  relevance: string;
  context?: string;
}

/**
 * Related topics result
 */
export interface RelatedTopic {
  id: string;
  title: string;
  summary: string;
  relevance: number;
}

/**
 * Get authentication header for API requests
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getSecureItem('buffr_access_token');
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Search knowledge base using semantic search
 * 
 * Uses LanceDB vector search on backend to find relevant educational content
 * based on user query.
 * 
 * @param query - User's search query (e.g., "How do loans work?")
 * @param limit - Maximum number of results to return
 * @param language - Preferred language for results
 * @returns Array of knowledge search results with relevance scores
 * 
 * @example
 * ```typescript
 * const results = await searchKnowledgeBase("What is a wallet?", 3);
 * console.log(results[0].content.title); // "Understanding Digital Wallets"
 * ```
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 3,
  language: string = 'en'
): Promise<KnowledgeSearchResult[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE}/api/v1/copilot/knowledge/search`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
        language,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Knowledge search failed: ${errorText}`);
    }

    const data = await response.json();
    return data.results.map((result: any) => ({
      content: {
        ...result.content,
        lastUpdated: new Date(result.content.lastUpdated),
      },
      score: result.score,
      relevance: result.relevance,
      context: result.context,
    }));
  } catch (error) {
    console.error('Knowledge base search error:', error);
    
    // Fallback to mock data for development/offline mode
    return getMockSearchResults(query, limit);
  }
}

/**
 * Get educational content by topic
 * 
 * Retrieves detailed educational content for a specific financial literacy topic.
 * 
 * @param topic - Topic ID or slug (e.g., "wallets", "loans", "proof-of-life")
 * @param language - Preferred language
 * @returns Educational content with examples, FAQs, and related topics
 * 
 * @example
 * ```typescript
 * const content = await getEducationalContent("wallets");
 * console.log(content.title); // "What is a Digital Wallet?"
 * console.log(content.examples); // ["Your wallet stores money electronically..."]
 * ```
 */
export async function getEducationalContent(
  topic: string,
  language: string = 'en'
): Promise<EducationalContent | null> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${API_BASE}/api/v1/copilot/knowledge/topics/${topic}?language=${language}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch educational content');
    }

    const data = await response.json();
    return {
      ...data,
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error('Error fetching educational content:', error);
    
    // Fallback to mock data
    return getMockEducationalContent(topic);
  }
}

/**
 * Get related topics for a given topic
 * 
 * Discovers related educational content based on topic similarity
 * and user learning path.
 * 
 * @param topic - Current topic ID
 * @param limit - Maximum number of related topics to return
 * @returns Array of related topics with relevance scores
 * 
 * @example
 * ```typescript
 * const related = await getRelatedTopics("wallets", 5);
 * console.log(related[0].title); // "Understanding Transaction Fees"
 * ```
 */
export async function getRelatedTopics(
  topic: string,
  limit: number = 5
): Promise<RelatedTopic[]> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${API_BASE}/api/v1/copilot/knowledge/topics/${topic}/related?limit=${limit}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch related topics');
    }

    const data = await response.json();
    return data.relatedTopics;
  } catch (error) {
    console.error('Error fetching related topics:', error);
    
    // Fallback to mock data
    return getMockRelatedTopics(topic, limit);
  }
}

/**
 * Get all available topics
 * 
 * Returns a list of all available educational topics in the knowledge base.
 * 
 * @param language - Preferred language
 * @returns Array of topics with metadata
 */
export async function getAllTopics(language: string = 'en'): Promise<Array<{ id: string; title: string; category: string }>> {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${API_BASE}/api/v1/copilot/knowledge/topics?language=${language}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }

    const data = await response.json();
    return data.topics;
  } catch (error) {
    console.error('Error fetching topics:', error);
    return getMockTopicsList();
  }
}

/**
 * Track content view for analytics and personalization
 */
export async function trackContentView(contentId: string): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await fetch(`${API_BASE}/api/v1/copilot/knowledge/track`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        action: 'view',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn('Failed to track content view:', error);
  }
}

// ============================================================================
// MOCK DATA (for development and offline mode)
// ============================================================================

/**
 * Mock search results for offline/development mode
 */
function getMockSearchResults(query: string, limit: number): KnowledgeSearchResult[] {
  const lowerQuery = query.toLowerCase();
  
  const allContent: EducationalContent[] = [
    {
      id: 'topic-wallet-basics',
      title: 'What is a Digital Wallet?',
      topic: 'wallets',
      content: 'A digital wallet (also called an e-wallet or mobile wallet) is a secure place to store your money electronically on your phone. Just like a physical wallet holds your cash and cards, a digital wallet holds your money safely in the Smartpay app.\n\nYour digital wallet allows you to:\n• Receive money (like your government grant or salary)\n• Send money to friends and family\n• Pay for goods and services\n• Cash out at agents or ATMs\n• Keep track of all your transactions\n\nYour money is protected with a secure PIN and biometric authentication (fingerprint or face recognition).',
      summary: 'Learn what a digital wallet is and how it safely stores your money electronically',
      level: 'basic',
      language: 'en',
      tags: ['wallet', 'basics', 'digital-money', 'e-wallet'],
      relatedTopics: ['topic-security', 'topic-transactions', 'topic-balance'],
      examples: [
        'Think of it like a bank account on your phone that you can access anytime',
        'You can receive your pension or social grant directly into your wallet',
        'Send money to your child\'s phone number instantly',
      ],
      faqs: [
        {
          question: 'Is my money safe in a digital wallet?',
          answer: 'Yes! Your money is protected by bank-level security, including encryption, PIN protection, and biometric authentication. Smartpay is regulated by the Bank of Namibia.',
        },
        {
          question: 'Do I need internet to use my wallet?',
          answer: 'No! You can use USSD (dial *140#) to access your wallet without internet. However, the app provides a better experience when you have internet.',
        },
      ],
      source: 'Smartpay Education Team',
      lastUpdated: new Date('2026-03-01'),
    },
    {
      id: 'topic-cashout',
      title: 'How to Cash Out Safely',
      topic: 'cashout',
      content: 'Cashing out means withdrawing physical money (banknotes) from your digital wallet. Smartpay provides several safe ways to get your money:\n\n1. **Agent Cash-Out** (Most Common)\n   • Find a nearby agent (shop, spaza shop, or registered agent)\n   • Generate a QR code or secure code in the app\n   • Show the code to the agent\n   • Receive your cash immediately\n   • Agent fee: 1.5% (minimum N$5, maximum N$50)\n\n2. **ATM Withdrawal**\n   • Use any Smartpay-enabled ATM\n   • Enter your PIN\n   • Withdraw up to N$3,000 per day\n   • Fee: N$10 per withdrawal\n\n3. **Bank Branch**\n   • Visit any partner bank branch\n   • Show your ID and phone number\n   • Receive your money at the counter\n   • Free for amounts over N$500\n\nSafety Tips:\n• Always verify the agent is authorized (check their license)\n• Count your money before leaving\n• Keep your PIN secret\n• Don\'t accept help from strangers\n• Check your transaction history after cashing out',
      summary: 'Learn safe methods to withdraw physical cash from your digital wallet',
      level: 'basic',
      language: 'en',
      tags: ['cashout', 'withdrawal', 'agent', 'safety', 'atm'],
      relatedTopics: ['topic-agents', 'topic-fees', 'topic-security'],
      examples: [
        'Many people use agents at local shops to cash out when buying groceries',
        'Pensioners often cash out on grant payment days at NamPost branches',
        'ATMs are convenient for late-night withdrawals',
      ],
      faqs: [
        {
          question: 'How long does cash-out take?',
          answer: 'Agent cash-out is instant! The agent gives you cash immediately after scanning your QR code. ATM and bank branch withdrawals are also instant.',
        },
        {
          question: 'Is there a limit on how much I can cash out?',
          answer: 'Daily limits depend on your verification level: Basic tier (N$1,000), Intermediate tier (N$5,000), Full tier (N$50,000). You can increase your limit by completing KYC verification.',
        },
      ],
      source: 'Smartpay Education Team',
      lastUpdated: new Date('2026-03-10'),
    },
    {
      id: 'topic-loans',
      title: 'How Do Voucher-Backed Loans Work?',
      topic: 'loans',
      content: 'Smartpay offers short-term loans backed by your government vouchers (like social grants or pensions). These loans help you access money before your voucher payment arrives.\n\n**How Voucher-Backed Loans Work:**\n\n1. **Eligibility**\n   • You must receive regular government vouchers (grants, pensions, subsidies)\n   • Voucher must be redeemable to your Smartpay wallet\n   • You must have a good repayment history (if not your first loan)\n\n2. **Loan Amount**\n   • Borrow up to 80% of your expected voucher value\n   • Example: If your monthly pension is N$1,500, you can borrow up to N$1,200\n   • Minimum loan: N$100, Maximum loan: depends on your voucher value\n\n3. **Repayment**\n   • Automatic repayment when your voucher arrives\n   • The loan amount + fees are deducted automatically\n   • Remaining balance goes to your wallet\n   • Repayment period: Usually within 30 days\n\n4. **Fees & Interest**\n   • One-time fee: 5% of loan amount\n   • Example: Borrow N$1,000 → Repay N$1,050\n   • No hidden charges or compound interest\n\n**Benefits:**\n✅ Quick approval (usually within minutes)\n✅ No credit check required\n✅ Lower fees than payday loans\n✅ Automatic repayment (no manual payment needed)\n✅ Builds your credit history for future loans\n\n**Important Notes:**\n⚠️ Only borrow what you need\n⚠️ Remember your voucher payment will be reduced by the loan amount\n⚠️ Late repayment may affect future loan eligibility',
      summary: 'Understanding how voucher-backed loans work and how to use them responsibly',
      level: 'intermediate',
      language: 'en',
      tags: ['loans', 'vouchers', 'credit', 'borrowing', 'financial-planning'],
      relatedTopics: ['topic-vouchers', 'topic-fees', 'topic-responsible-borrowing'],
      examples: [
        'Emergency medical expenses before your pension payment',
        'School fees needed urgently before grant disbursement',
        'Unexpected household expenses that can\'t wait',
      ],
      faqs: [
        {
          question: 'What happens if my voucher is late or cancelled?',
          answer: 'If your voucher doesn\'t arrive, contact Smartpay support immediately. We\'ll work with you to arrange an alternative repayment plan. Your account won\'t be frozen without notice.',
        },
        {
          question: 'Can I take multiple loans at once?',
          answer: 'No, you must repay your current loan before taking a new one. This protects you from over-borrowing and ensures you have enough money left after repayment.',
        },
      ],
      source: 'Smartpay Education Team',
      lastUpdated: new Date('2026-02-15'),
    },
    {
      id: 'topic-proof-of-life',
      title: 'What is Proof of Life?',
      topic: 'proof-of-life',
      content: 'Proof of Life is a verification process required for people receiving government pensions and social grants. It confirms you are still alive and eligible to receive payments.\n\n**Why is Proof of Life Needed?**\n• Prevents fraud and identity theft\n• Ensures grants go to the right people\n• Required by Namibian law for social welfare programs\n• Protects taxpayer money\n\n**How Does Smartpay Proof of Life Work?**\n\n1. **Frequency**\n   • Required every 3-6 months (depending on your grant type)\n   • Smartpay sends you a reminder 2 weeks before it\'s due\n   • You have a 30-day grace period after the due date\n\n2. **Verification Methods**\n   • **Biometric Scan** (Recommended): Take a selfie in the app\n   • **Agent Visit**: Visit a registered agent with your ID\n   • **USSD**: Dial *140# and follow prompts (basic verification)\n   • **Video Call**: Schedule a video call with Smartpay support\n\n3. **What Happens If I Miss It?**\n   • ⚠️ Warning notification 1 week before deadline\n   • 🔒 Wallet frozen if not completed within grace period\n   • ✅ Wallet unfrozen immediately after verification\n   • 💰 Missed payments are released once verified\n\n**Tips for Successful Verification:**\n✓ Use good lighting for selfies\n✓ Remove glasses and headwear\n✓ Keep your face clearly visible\n✓ Don\'t wait until the last day\n✓ If you have trouble, visit an agent for help\n\n**Special Cases:**\n• Elderly or immobile? Request a home visit from an agent\n• No smartphone? Use USSD or visit an agent\n• In hospital? Contact Smartpay support for alternative verification',
      summary: 'Learn about Proof of Life verification required for grant recipients',
      level: 'basic',
      language: 'en',
      tags: ['proof-of-life', 'verification', 'grants', 'pension', 'biometric'],
      relatedTopics: ['topic-grants', 'topic-kyc', 'topic-agents'],
      examples: [
        'Mrs. Hamutenya does her Proof of Life verification every 3 months using the app',
        'Mr. Shikomba visits a NamPost agent because he doesn\'t have a smartphone',
        'If you\'re in the hospital, call support and they\'ll arrange special verification',
      ],
      faqs: [
        {
          question: 'Why do I need to do this?',
          answer: 'It\'s a legal requirement to prevent fraud. Unfortunately, some people have continued receiving grants for deceased relatives. This verification protects the system and ensures your rightful payments.',
        },
        {
          question: 'Can someone do it for me?',
          answer: 'No! Proof of Life must be done by you personally. Never share your PIN or biometric data with anyone, including family members. This is to protect you from fraud.',
        },
      ],
      source: 'Ministry of Gender Equality, Poverty Eradication and Social Welfare',
      lastUpdated: new Date('2026-03-05'),
    },
    {
      id: 'topic-fees',
      title: 'Understanding Transaction Fees',
      topic: 'fees',
      content: 'Smartpay aims to keep fees low and transparent. Here\'s a complete breakdown of all fees you may encounter:\n\n**FREE Transactions:**\n✅ Receiving money (P2P, G2P grants)\n✅ Checking your balance\n✅ Viewing transaction history\n✅ Bill payments to registered merchants\n✅ Airtime purchases\n✅ Same-wallet transfers\n\n**Paid Transactions:**\n\n1. **Sending Money (P2P)**\n   • Same bank/wallet: FREE\n   • Different bank/wallet: N$2.50 flat fee\n   • Example: Send N$500 → Recipient gets N$500, you pay N$502.50\n\n2. **Cash-Out**\n   • Agent: 1.5% (min N$5, max N$50)\n     - Cash out N$100 → Pay N$5\n     - Cash out N$1,000 → Pay N$15\n     - Cash out N$5,000 → Pay N$50 (capped)\n   • ATM: N$10 flat fee\n   • Bank branch: FREE for amounts over N$500, otherwise N$25\n\n3. **Loans**\n   • One-time origination fee: 5% of loan amount\n   • No monthly interest (fee is included)\n   • Early repayment: No penalty\n\n4. **International Transfers**\n   • SADC countries: 2.5% (min N$50)\n   • Other countries: 3.5% (min N$75)\n   • Currency conversion: Real-time exchange rate + 1% markup\n\n**Fee Waivers:**\n• G2P grant disbursements are ALWAYS free\n• First cash-out each month: 50% discount\n• Pensioners: Free ATM withdrawals at NamPost\n\n**How to Minimize Fees:**\n💡 Cash out larger amounts less frequently\n💡 Use same-wallet transfers when possible\n💡 Pay bills directly in-app (free!) instead of cashing out first\n💡 Take advantage of monthly discounts\n\n**Fee Transparency:**\n• All fees are shown BEFORE you confirm any transaction\n• No hidden charges\n• Fees are regulated by Bank of Namibia\n• Receipt shows exact fee breakdown',
      summary: 'Complete breakdown of Smartpay transaction fees and how to minimize costs',
      level: 'intermediate',
      language: 'en',
      tags: ['fees', 'costs', 'pricing', 'charges', 'transparency'],
      relatedTopics: ['topic-cashout', 'topic-transfers', 'topic-savings'],
      examples: [
        'Sending N$500 to your daughter in Windhoek costs N$2.50',
        'Cashing out N$1,000 at an agent costs N$15 (1.5%)',
        'Paying your electricity bill in-app is completely free',
      ],
      faqs: [
        {
          question: 'Why do you charge fees?',
          answer: 'Fees cover the costs of running the service: agent commissions, bank connections, security systems, customer support, and regulatory compliance. We keep fees as low as possible while ensuring a safe, reliable service.',
        },
        {
          question: 'Can I get a refund if I was charged wrong?',
          answer: 'Yes! If you believe you were charged incorrectly, contact support within 30 days. We\'ll investigate and refund any incorrect charges within 5 business days.',
        },
      ],
      source: 'Smartpay Pricing Team',
      lastUpdated: new Date('2026-03-12'),
    },
    {
      id: 'topic-open-banking',
      title: 'Open Banking Explained',
      topic: 'open-banking',
      content: 'Open Banking (also called Open Banking Standard or OBS) is a new system that lets you safely share your bank account information with Smartpay to access better services.\n\n**What is Open Banking?**\n• A secure way for apps like Smartpay to connect to your bank\n• You stay in control of what information is shared\n• Makes banking easier by connecting different services\n• Regulated by Bank of Namibia for your protection\n\n**What Can Open Banking Do?**\n\n1. **Account Information Services (AIS)**\n   • View balances from multiple banks in one app\n   • See all your transactions in one place\n   • Get better spending insights\n   • Easier budgeting and financial planning\n\n2. **Payment Initiation Services (PIS)**\n   • Pay bills directly from your bank account\n   • Instant bank-to-wallet transfers\n   • Faster payments with lower fees\n   • No need to cash out first\n\n**How It Works:**\n\n1. You give Smartpay permission to connect to your bank\n2. Your bank asks you to confirm (using their app or website)\n3. Smartpay can now access the information you approved\n4. You can revoke permission anytime\n\n**Security:**\n🔒 **Bank-level encryption** - Same security as your bank app\n🔒 **No password sharing** - Smartpay never sees your bank password\n🔒 **You control access** - Choose exactly what to share\n🔒 **Regulated** - Must comply with Bank of Namibia rules\n🔒 **Revocable** - Cancel permission instantly anytime\n\n**Benefits:**\n✅ See all your accounts in one place\n✅ Faster payments and transfers\n✅ Lower fees for some transactions\n✅ Better loan offers based on your real financial history\n✅ No more bank statements needed\n\n**Privacy:**\n• Smartpay only sees what you approve\n• No access to your bank password\n• Your bank data is never sold to third parties\n• You can view and delete your data anytime\n\n**Common Concerns:**\n\nQ: "Is this safe?"\nA: Yes! It\'s regulated by Bank of Namibia and uses the same security as online banking.\n\nQ: "Can Smartpay take money from my account?"\nA: Only if you specifically approve a payment. Smartpay cannot withdraw money without your explicit permission for each transaction.\n\nQ: "What if I change my mind?"\nA: You can disconnect Open Banking anytime in Settings → Connected Accounts. It takes effect immediately.',
      summary: 'Understanding how Open Banking safely connects your bank accounts to Smartpay',
      level: 'advanced',
      language: 'en',
      tags: ['open-banking', 'obs', 'ais', 'pis', 'bank-connection', 'security'],
      relatedTopics: ['topic-security', 'topic-privacy', 'topic-payments'],
      examples: [
        'Link your FNB and Standard Bank accounts to see both balances in Smartpay',
        'Pay your municipal bill directly from your bank account without cashing out',
        'Get pre-approved for loans based on your actual bank transaction history',
      ],
      faqs: [
        {
          question: 'Which banks support Open Banking?',
          answer: 'Most major Namibian banks now support Open Banking, including FNB, Standard Bank, Bank Windhoek, and Nedbank. More banks are being added regularly.',
        },
        {
          question: 'Does Open Banking cost extra?',
          answer: 'No! Connecting your bank account via Open Banking is free. You only pay normal transaction fees when you make payments.',
        },
      ],
      source: 'Bank of Namibia - Open Banking Standard',
      lastUpdated: new Date('2026-02-28'),
    },
  ];

  // Simple keyword matching for mock search
  const filtered = allContent
    .map(content => {
      const titleMatch = content.title.toLowerCase().includes(lowerQuery);
      const contentMatch = content.content.toLowerCase().includes(lowerQuery);
      const tagMatch = content.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      let score = 0;
      if (titleMatch) score += 0.5;
      if (contentMatch) score += 0.3;
      if (tagMatch) score += 0.2;
      
      return { content, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({
      content: result.content,
      score: result.score,
      relevance: `${(result.score * 100).toFixed(0)}%`,
      context: result.content.content.substring(0, 200) + '...',
    }));

  return filtered;
}

/**
 * Mock educational content by topic
 */
function getMockEducationalContent(topic: string): EducationalContent | null {
  const mockResults = getMockSearchResults(topic, 1);
  return mockResults.length > 0 ? mockResults[0].content : null;
}

/**
 * Mock related topics
 */
function getMockRelatedTopics(topic: string, limit: number): RelatedTopic[] {
  const topicMap: Record<string, RelatedTopic[]> = {
    'wallets': [
      { id: 'topic-security', title: 'Wallet Security', summary: 'Learn how to keep your wallet safe', relevance: 0.9 },
      { id: 'topic-transactions', title: 'Transaction History', summary: 'View and understand your transactions', relevance: 0.85 },
      { id: 'topic-balance', title: 'Managing Your Balance', summary: 'Tips for managing your wallet balance', relevance: 0.8 },
    ],
    'cashout': [
      { id: 'topic-agents', title: 'Finding Agents', summary: 'Locate nearby cash-out agents', relevance: 0.95 },
      { id: 'topic-fees', title: 'Transaction Fees', summary: 'Understanding cash-out costs', relevance: 0.9 },
      { id: 'topic-safety', title: 'Cash-Out Safety Tips', summary: 'Stay safe when withdrawing cash', relevance: 0.85 },
    ],
    'loans': [
      { id: 'topic-vouchers', title: 'Government Vouchers', summary: 'Understanding voucher eligibility', relevance: 0.9 },
      { id: 'topic-repayment', title: 'Loan Repayment', summary: 'How loan repayment works', relevance: 0.88 },
      { id: 'topic-responsible-borrowing', title: 'Responsible Borrowing', summary: 'Borrow wisely and safely', relevance: 0.85 },
    ],
  };

  return (topicMap[topic] || []).slice(0, limit);
}

/**
 * Mock topics list
 */
function getMockTopicsList(): Array<{ id: string; title: string; category: string }> {
  return [
    { id: 'topic-wallet-basics', title: 'What is a Digital Wallet?', category: 'Basics' },
    { id: 'topic-cashout', title: 'How to Cash Out Safely', category: 'Transactions' },
    { id: 'topic-loans', title: 'Voucher-Backed Loans', category: 'Financial Services' },
    { id: 'topic-proof-of-life', title: 'Proof of Life Verification', category: 'Compliance' },
    { id: 'topic-fees', title: 'Understanding Fees', category: 'Basics' },
    { id: 'topic-open-banking', title: 'Open Banking Explained', category: 'Advanced' },
    { id: 'topic-security', title: 'Security & Privacy', category: 'Safety' },
    { id: 'topic-ussd', title: 'USSD Banking', category: 'Features' },
  ];
}
