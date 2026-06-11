/**
 * Sofia intent, email, and response helpers — pure functions extracted from SofiaConciergeService.
 * Location: lib/services/sofia/sofia-intent.ts
 */

export function requiresPolicyEscalation(userMessage: string, assistantResponse: string): boolean {
  const text = `${userMessage} ${assistantResponse}`.toLowerCase();
  return [
    'chargeback',
    'refund dispute',
    'legal',
    'lawsuit',
    'fraud',
    'data deletion',
    'consumer rights',
    'cyber incident',
    'breach',
  ].some((term) => text.includes(term));
}

export function buildSofiaSystemPrompt(
  message: string,
  context: string,
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
): string {
  return `You are Sofia, the AI concierge for Hotel Etuna, a premium luxury guesthouse in Ongwediva, Namibia.
ABOUT HOTEL ETUNA:
- Hotel Etuna is located at 5544 Valley Street, Ongwediva, Namibia
- We offer Premiere Room, Executive Room, and Standard Room in three layouts (Type A double bed, Type B two singles, Type C double plus single)
- Guest rooms: Standard A/B N$800, Standard C N$1200, Executive N$1000, Premiere N$2000; Conference N$1200/session; Campsite from N$1200 whole-site
- Check-in starts at 14:00 and check-out is by 11:00
- Key guest amenities include free WiFi, outdoor pool, free parking, on-site restaurant, and 24-hour security
- Support is available 24/7 via Sofia AI at frontdesk@hoteletuna.com
- We operate in Namibia and use NAD (Namibian Dollar) currency

YOUR ROLE:
- Help guests with hotel bookings, restaurant reservations, and general hospitality inquiries
- Provide accurate information about properties, rooms, amenities, menus, and services
- Assist with booking inquiries by asking for necessary details (dates, guests, preferences)
- Help with restaurant reservations by asking about date, time, party size, dietary restrictions
- Answer questions about property amenities, policies, and services
- Be helpful, friendly, and professional
- Respond in the language of the user (English, Oshiwambo, or Afrikaans)
- Use NAD currency and Namibian context in all responses
- If you don't know something, admit it and offer to connect with human staff
- Keep responses concise but comprehensive

CONTEXT INFORMATION:
${context}

GUIDELINES:
- Always use NAD currency (N$) when mentioning prices
- Reference specific property information from the context when available
- For booking inquiries, ask for: check-in date, check-out date, number of guests, room preferences
- For restaurant inquiries, ask for: date, time, number of guests, dietary restrictions, special requests
- Mention check-in/check-out times if available in property context
- Reference room types, amenities, and policies from the context
- If property has restaurant, mention menu categories and cuisine type
- Use guest preferences and booking history when available

Previous conversation:
${history.map((h) => `${h.role}: ${h.content}`).join('\n')}

Current user message: ${message}`;
}

export function generateFallbackResponse(message: string, _context: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('book') || lowerMessage.includes('reservation') || lowerMessage.includes('room')) {
    return "I'd be happy to help you with a booking! To get started, I'll need to know:\n• Your preferred check-in and check-out dates\n• Number of guests\n• Any specific room preferences\n\nWould you like to check availability for specific dates?";
  }

  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('menu') || lowerMessage.includes('table')) {
    return "I can help you with restaurant reservations! Please let me know:\n• Preferred date and time\n• Number of guests\n• Any dietary restrictions or preferences\n\nWould you like to see our menu or make a reservation?";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
    return "Hello! I'm Sofia, your AI concierge. I can help you with:\n• Hotel room bookings\n• Restaurant reservations\n• Information about our facilities\n• General hospitality inquiries\n\nHow can I assist you today?";
  }

  if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities') || lowerMessage.includes('wifi') || lowerMessage.includes('pool')) {
    return "I'd be happy to tell you about our amenities! Based on your property, we offer various facilities. For specific details about available amenities, could you let me know which property you're interested in or what specific facilities you're looking for?";
  }

  return "I'm here to help with your hospitality needs! I can assist with hotel bookings, restaurant reservations, and information about our facilities. Could you please let me know more specifically what you'd like help with?";
}

export function resolveIntent(userMessage: string, assistantResponse: string): string {
  const fromUser = extractIntent(userMessage);
  if (fromUser !== 'general_inquiry') {
    return fromUser;
  }

  const fromAssistant = extractIntent(assistantResponse);
  const assistantTopicDrift = ['pricing_inquiry', 'menu_inquiry', 'amenities_inquiry'] as const;
  if (assistantTopicDrift.includes(fromAssistant as (typeof assistantTopicDrift)[number])) {
    return 'general_inquiry';
  }
  return fromAssistant;
}

export function extractIntent(text: string): string {
  const lower = text.toLowerCase();

  if (/\b(rate|rates|price|prices|cost|pricing)\b/.test(lower)) {
    return 'pricing_inquiry';
  }

  const wantsBooking =
    /\b(book|reserve|reservation)\b/.test(lower) ||
    lower.includes('table for') ||
    (lower.includes('table') && (lower.includes('dinner') || lower.includes('lunch')));

  if (wantsBooking) {
    if (lower.includes('room') || lower.includes('stay') || lower.includes('hotel room')) {
      return 'booking_room';
    }
    if (
      lower.includes('restaurant') ||
      lower.includes('table') ||
      lower.includes('dinner') ||
      lower.includes('lunch')
    ) {
      return 'booking_restaurant';
    }
    return 'booking_general';
  }

  if (lower.includes('amenities') || lower.includes('facilities')) {
    return 'amenities_inquiry';
  }

  if (lower.includes('menu') || lower.includes('food')) {
    return 'menu_inquiry';
  }

  if (lower.includes('cancellation') || lower.includes('policy')) {
    return 'booking_general';
  }

  if (lower.includes('help') || lower.includes('assist')) {
    return 'general_help';
  }

  return 'general_inquiry';
}

export function extractEmail(message: string): string | null {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = message.match(emailRegex);
  return match ? match[0] : null;
}

export function detectEmailIntent(
  userMessage: string,
  aiResponse: string
): {
  needsEmail: boolean;
  type: 'quotation' | 'confirmation' | 'details' | 'general';
} {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = aiResponse.toLowerCase();

  const emailKeywords = [
    'email',
    'send to',
    'send me',
    'quotation',
    'quote',
    'quote me',
    'details',
    'information',
    'confirm',
  ];
  const hasEmailKeyword = emailKeywords.some(
    (keyword) => lowerMessage.includes(keyword) || lowerResponse.includes(keyword)
  );

  if (!hasEmailKeyword) {
    return { needsEmail: false, type: 'general' };
  }

  if (lowerMessage.includes('quotation') || lowerMessage.includes('quote') || lowerMessage.includes('price')) {
    return { needsEmail: true, type: 'quotation' };
  }
  if (lowerMessage.includes('confirm') || lowerMessage.includes('booking')) {
    return { needsEmail: true, type: 'confirmation' };
  }
  if (lowerMessage.includes('details') || lowerMessage.includes('information')) {
    return { needsEmail: true, type: 'details' };
  }

  return { needsEmail: true, type: 'general' };
}

export function extractEntities(response: string): Record<string, unknown> {
  const entities: Record<string, unknown> = {};

  const datePattern = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
  const dates = response.match(datePattern);
  if (dates) {
    entities.dates = dates;
  }

  const numberPattern = /\b(\d+)\b/g;
  const numbers = response.match(numberPattern);
  if (numbers) {
    entities.numbers = numbers.map(Number);
  }

  const currencyPattern = /\b[N$]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g;
  const amounts = response.match(currencyPattern);
  if (amounts) {
    entities.amounts = amounts;
  }

  return entities;
}

export async function generateSuggestions(intent: string): Promise<string[]> {
  switch (intent) {
    case 'booking_room':
      return ['Check room availability', 'View room types and prices', 'Make a booking'];
    case 'booking_restaurant':
      return ['View menu', 'Check table availability', 'Make a reservation'];
    case 'amenities_inquiry':
      return ['See all amenities', 'Check specific facilities', 'Get directions'];
    case 'menu_inquiry':
      return ['View full menu', 'Check dietary options', 'See prices'];
    case 'pricing_inquiry':
      return ['View room rates', 'Check restaurant prices', 'See special offers'];
    default:
      return ['Make a booking', 'View amenities', 'Contact staff'];
  }
}
