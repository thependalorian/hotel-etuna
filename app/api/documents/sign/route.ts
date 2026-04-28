/**
 * Electronic Signature API
 * 
 * Purpose: Capture and verify electronic signatures on digital documents
 * Compliance: ETA 2019 Section 20 (Advanced Electronic Signatures)
 * Location: app/api/documents/sign/route.ts
 * 
 * Legal Basis:
 * ETA 2019 Section 17: Electronic signatures are legally binding
 * ETA 2019 Section 20: Requirements for advanced electronic signatures
 * 
 * Supported document types:
 * - Booking contracts (guest agreements)
 * - Staff contracts (employment)
 * - Property agreements (landlord contracts)
 * - Guest waivers (liability, cancellation)
 * - Vendor agreements (suppliers)
 * - Service agreements (partners)
 * - Privacy policy acceptance
 * - Terms of service acceptance
 */

import { NextRequest, NextResponse } from 'next/server';
import { ElectronicSignatureService } from '@/lib/services/documents/ElectronicSignatureService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';

// Signature request validation
const signatureRequestSchema = z.object({
  documentType: z.enum([
    'booking_contract',
    'staff_contract',
    'property_agreement',
    'guest_waiver',
    'vendor_agreement',
    'service_agreement',
    'privacy_policy_acceptance',
    'terms_of_service_acceptance',
  ]),
  documentId: entityId('Invalid document ID'),
  documentName: z.string().min(1, 'Document name required'),
  documentContent: z.string().min(10, 'Document content required'),
  
  tenantId: entityId('Invalid tenant ID'),
  signerId: entityId('Invalid signer ID'),
  signerName: z.string().min(1, 'Signer name required'),
  signerEmail: z.string().email('Invalid signer email'),
  signerPhone: z.string().optional(),
  signerLocation: z.string().optional(),
  
  signatureData: z.string().min(1, 'Signature data required'),
  signatureMethod: z.enum([
    'advanced_electronic',
    'digital_certificate',
    'biometric',
    'otp_verified',
    'click_wrap',
    'drawn_signature',
  ]),
  
  signatureProvider: z.string().optional(), // docusign, adobe_sign, local_pki
  
  // Optional witness
  witnessed: z.boolean().default(false),
  witnessName: z.string().optional(),
  witnessEmail: z.string().email().optional(),
});

/**
 * POST /api/documents/sign
 * 
 * Capture electronic signature on a document
 * 
 * Returns:
 * - signatureId: UUID
 * - documentHash: SHA-256 (for integrity verification)
 * - legallyBinding: true (per ETA 2019 Section 17)
 * - etaCompliant: true (meets Section 20 requirements)
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json();
    const validatedData = signatureRequestSchema.parse(body);
    
    console.log('[API:ElectronicSignature] Capturing signature:', {
      documentType: validatedData.documentType,
      signerId: validatedData.signerId,
      method: validatedData.signatureMethod,
    });
    
    // Extract IP address from request
    const signerIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    
    // Initialize service
    const signatureService = new ElectronicSignatureService();
    
    // Capture signature
    const signature = await signatureService.captureSignature(
      validatedData.tenantId,
      {
        documentType: validatedData.documentType,
        documentId: validatedData.documentId,
        documentName: validatedData.documentName,
        documentContent: validatedData.documentContent,
        signerId: validatedData.signerId,
        signerName: validatedData.signerName,
        signerEmail: validatedData.signerEmail,
        signerPhone: validatedData.signerPhone,
        signerIp,
        signerLocation: validatedData.signerLocation,
        signatureData: validatedData.signatureData,
        signatureMethod: validatedData.signatureMethod,
        signatureProvider: validatedData.signatureProvider,
        witnessed: validatedData.witnessed,
        witnessName: validatedData.witnessName,
        witnessEmail: validatedData.witnessEmail,
      }
    );
    
    console.log('[API:ElectronicSignature] Signature captured successfully:', {
      signatureId: signature.id,
      etaCompliant: signature.etaCompliant,
      legallyBinding: signature.legallyBinding,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        signatureId: signature.id,
        documentHash: signature.documentHash,
        signatureTimestamp: signature.signatureTimestamp,
        etaCompliant: signature.etaCompliant,
        legallyBinding: signature.legallyBinding,
        verified: signature.verified,
      },
      message: 'Electronic signature captured successfully',
      legal: {
        compliance: 'ETA 2019 Section 20 (Advanced Electronic Signatures)',
        legalEffect: 'Legally binding per ETA 2019 Section 17',
        integrity: 'SHA-256 hash ensures document integrity (Section 20d)',
      },
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    console.error('[API:ElectronicSignature] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to capture electronic signature',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/sign?documentId=xxx
 * 
 * Get signature for a document
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }
    
    const signatureService = new ElectronicSignatureService();
    
    const signature = await signatureService.getDocumentSignature(documentId);
    
    if (!signature || signature.length === 0) {
      return NextResponse.json(
        { error: 'No signature found for this document' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: signature[0],
    });
    
  } catch (error) {
    console.error('[API:ElectronicSignature:Get] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch signature',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/sign/:signatureId/void
 * 
 * Void a signature (if document cancelled)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { signatureId, voidedBy, reason } = body;
    
    if (!signatureId || !voidedBy || !reason) {
      return NextResponse.json(
        { error: 'signatureId, voidedBy, and reason are required' },
        { status: 400 }
      );
    }
    
    const signatureService = new ElectronicSignatureService();
    
    await signatureService.voidSignature(signatureId, voidedBy, reason);
    
    return NextResponse.json({
      success: true,
      message: 'Signature voided successfully',
    });
    
  } catch (error) {
    console.error('[API:ElectronicSignature:Void] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to void signature',
      },
      { status: 500 }
    );
  }
}
