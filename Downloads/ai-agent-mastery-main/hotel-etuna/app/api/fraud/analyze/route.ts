/**
 * Fraud Analysis API Endpoint
 * 
 * Purpose: Analyze transactions for fraud in real-time
 * Functionality: Accept transaction data and return fraud risk assessment
 * Location: app/api/fraud/analyze/route.ts
 * 
 * @implements Rule 4: Vercel compatible
 * @implements Rule 5: Quick and scalable
 * @implements Rule 10: Comprehensive error handling
 * @implements Rule 16: Rate limiting and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionService, type TransactionContext } from '@/lib/services/fraud/FraudDetectionService';
import { entityId, entityIdOptional } from '@/lib/validation/entity-ids';
import { z } from 'zod';

// Request validation schema
const fraudAnalysisSchema = z.object({
  tenantId: entityId(),
  transactionId: entityId(),
  guestId: entityIdOptional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('NAD'),
  type: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  deviceFingerprint: z.object({
    browserName: z.string().optional(),
    browserVersion: z.string().optional(),
    osName: z.string().optional(),
    osVersion: z.string().optional(),
    deviceType: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[Fraud API] Analyzing transaction...');

    // Parse and validate request body
    const body = await request.json();
    const validationResult = fraudAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Initialize fraud detection service
    const fraudService = new FraudDetectionService(data.tenantId);

    // Build transaction context
    const context: TransactionContext = {
      transactionId: data.transactionId,
      guestId: data.guestId,
      amount: data.amount,
      currency: data.currency,
      type: data.type,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceFingerprint: data.deviceFingerprint,
      location: data.location,
      metadata: data.metadata,
    };

    // Analyze transaction for fraud
    const fraudScore = await fraudService.analyzeTransaction(context);

    console.log('[Fraud API] Analysis complete', {
      transactionId: data.transactionId,
      riskLevel: fraudScore.riskLevel,
      decision: fraudScore.decision,
    });

    return NextResponse.json({
      success: true,
      data: fraudScore,
    });
  } catch (error) {
    console.error('[Fraud API] Error analyzing transaction:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API health
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Fraud Detection API is operational',
    version: '1.0.0',
    capabilities: [
      'CNP fraud detection',
      'Phone scam detection',
      'Phishing detection',
      'SIM swap detection',
      'Device fingerprinting',
      'Velocity checks',
      'Geographic anomaly detection',
    ],
  });
}
