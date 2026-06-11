/**
 * Network Print Adapter
 *
 * Purpose: Abstract kitchen/bar ticket printing for F&B dispatch (mock + production hook).
 * Location: /lib/adapters/print/network-print-adapter.ts
 */

export interface PrintTicketPayload {
  jobId: string;
  station: string;
  printerId?: string | null;
  ticketData: Record<string, unknown>;
}

export interface PrintResult {
  success: boolean;
  errorMessage?: string;
}

export interface NetworkPrintAdapter {
  print(ticket: PrintTicketPayload): Promise<PrintResult>;
}

/**
 * Mock adapter for local dev and integration tests.
 * Set ticketData.simulateFailure = true to exercise failed print paths.
 */
export class MockNetworkPrintAdapter implements NetworkPrintAdapter {
  async print(ticket: PrintTicketPayload): Promise<PrintResult> {
    if (ticket.ticketData?.simulateFailure === true) {
      return { success: false, errorMessage: 'Mock printer offline' };
    }
    return { success: true };
  }
}

/**
 * Production hook — extend when a real network printer API is configured.
 * Env: PRINT_ADAPTER=network, PRINT_API_URL, optional PRINT_API_KEY
 */
export class HttpNetworkPrintAdapter implements NetworkPrintAdapter {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey?: string
  ) {}

  async print(ticket: PrintTicketPayload): Promise<PrintResult> {
    try {
      const response = await fetch(`${this.apiUrl}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Printer request failed');
        return { success: false, errorMessage: text.slice(0, 500) };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Printer unreachable';
      return { success: false, errorMessage: message };
    }
  }
}

export function createNetworkPrintAdapter(): NetworkPrintAdapter {
  const mode = process.env.PRINT_ADAPTER?.toLowerCase();
  const apiUrl = process.env.PRINT_API_URL;

  if (mode === 'network' && apiUrl) {
    return new HttpNetworkPrintAdapter(apiUrl, process.env.PRINT_API_KEY);
  }

  return new MockNetworkPrintAdapter();
}

export const defaultPrintAdapter = createNetworkPrintAdapter();
