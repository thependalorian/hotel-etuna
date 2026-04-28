import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { SofiaService } from '@/lib/services/sofia/SofiaService';
import * as z from 'zod';
import { AppError } from '@/lib/utils/errors';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
});

const SENSITIVE_PRICING_PATTERN =
  /\b(price|pricing|rate|rates|cost|costs|nad|availability|available|book|booking)\b/i;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const validation = chatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { messages } = validation.data;
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const isUnauthenticated = !session?.user;
    if (isUnauthenticated && lastUserMessage && SENSITIVE_PRICING_PATTERN.test(lastUserMessage.content)) {
      return NextResponse.json(
        {
          role: 'assistant',
          content: 'For pricing and availability, please sign up - it only takes a minute!',
        },
        { status: 200 }
      );
    }
    
    const sofiaService = new SofiaService();
    const responseContent = await sofiaService.chat(messages);

    return NextResponse.json({ role: 'assistant', content: responseContent }, { status: 200 });

  } catch (error) {
    console.error('Sofia chat error:', error);
    if (typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error) {
        return NextResponse.json({ message: error.message }, { status: (error as AppError).statusCode });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
