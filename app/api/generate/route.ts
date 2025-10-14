import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';

// Tool pricing configuration (must match frontend)
const TOOL_PRICES: Record<string, number> = {
  'master-chef': 10,
  'master-nutritionist': 15,
  'cal-tracker': 5,
};

// Get tool name for transaction description
const TOOL_NAMES: Record<string, string> = {
  'master-chef': 'Your Own Chef',
  'master-nutritionist': 'Your Own Nutritionist',
  'cal-tracker': 'Your Own Tracker',
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  // 1. AUTHENTICATE USER
  const { userId } = auth();
  if (!userId) {
    console.warn('[API_GENERATE] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get webhook URL from environment variables
  const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? process.env.WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('[API_GENERATE] N8N webhook URL not configured');
    return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
  }

  // Parse request payload
  let payload: any = {};
  try { 
    payload = await req.json(); 
  } catch (e) {
    console.warn('[API_GENERATE] Failed to parse JSON payload');
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  // Extract tool information
  const toolId = payload.tool?.id;
  const toolPrice = TOOL_PRICES[toolId] || 0;
  const toolName = TOOL_NAMES[toolId] || 'Unknown Tool';

  // Log request details
  console.log(`[API_GENERATE] Processing request:`, {
    userId,
    toolId,
    toolPrice,
    messageLength: payload.message?.content?.length,
    hasImage: !!payload.image,
    timestamp: new Date().toISOString(),
  });

  // 2. CHECK CREDIT BALANCE (BEFORE AI GENERATION)
  if (toolPrice > 0) {
    try {
      const user = await prismadb.user.findUnique({
        where: { clerkId: userId },
        select: {
          usedGenerations: true,
          availableGenerations: true,
        },
      });

      if (!user) {
        console.error('[API_GENERATE] User not found in database:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const remainingCredits = user.availableGenerations - user.usedGenerations;

      if (remainingCredits < toolPrice) {
        console.warn('[API_GENERATE] Insufficient credits:', {
          userId,
          required: toolPrice,
          available: remainingCredits,
        });
        return NextResponse.json({ 
          error: 'Insufficient credits',
          required: toolPrice,
          available: remainingCredits,
        }, { status: 403 });
      }

      console.log('[API_GENERATE] Credit check passed:', {
        userId,
        required: toolPrice,
        available: remainingCredits,
        remaining: remainingCredits - toolPrice,
      });
    } catch (error) {
      console.error('[API_GENERATE] Database error during credit check:', error);
      return NextResponse.json({ error: 'Failed to verify credits' }, { status: 500 });
    }
  }

  // 3. CALL N8N WEBHOOK
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const n8nRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const processingTime = Date.now() - startTime;
    
    // Get response text (handles both JSON and plain text)
    const text = await n8nRes.text();
    
    console.log(`[API_GENERATE] N8N webhook response:`, {
      status: n8nRes.status,
      processingTime,
      responseSize: text.length,
    });

    // 4. DEDUCT TOKENS ONLY IF N8N CALL WAS SUCCESSFUL
    if (n8nRes.ok && toolPrice > 0) {
      try {
        await prismadb.$transaction(async (tx) => {
          // Increment usedGenerations
          const updatedUser = await tx.user.update({
            where: { clerkId: userId },
            data: { 
              usedGenerations: { increment: toolPrice },
            },
            select: {
              usedGenerations: true,
              availableGenerations: true,
            },
          });

          // Create transaction record for audit trail
          const trackingId = `usage_${toolId}_${Date.now()}`;
          await tx.transaction.create({
            data: {
              tracking_id: trackingId,
              userId: userId,
              status: 'completed',
              amount: -toolPrice, // Negative for deduction
              currency: 'tokens',
              description: `${toolName} - AI Generation`,
              type: 'deduction',
              payment_method_type: null,
              message: `${toolPrice} tokens deducted for ${toolName}`,
              paid_at: new Date(),
              receipt_url: null,
            },
          });

          console.log('[API_GENERATE] ✅ Tokens deducted successfully:', {
            userId,
            toolId,
            toolPrice,
            trackingId,
            usedGenerations: updatedUser.usedGenerations,
            availableGenerations: updatedUser.availableGenerations,
            remainingCredits: updatedUser.availableGenerations - updatedUser.usedGenerations,
            timestamp: new Date().toISOString(),
          });
        });
      } catch (dbError) {
        console.error('[API_GENERATE] ⚠️ Failed to deduct tokens (AI generation succeeded but DB write failed):', {
          userId,
          toolId,
          toolPrice,
          error: dbError,
        });
        // NOTE: AI generation already succeeded, so we still return the response
        // but log the error for manual reconciliation
      }
    }

    // Return response with same status and content-type as N8N
    return new NextResponse(text, {
      status: n8nRes.status,
      headers: { 'content-type': n8nRes.headers.get('content-type') || 'application/json' },
    });

  } catch (e: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('[API_GENERATE] Upstream n8n call failed:', {
      error: e.name,
      message: e.message,
      processingTime,
    });

    // DO NOT deduct tokens if N8N call failed
    if (e.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    
    return NextResponse.json({ error: 'Upstream n8n call failed' }, { status: 502 });
  }
}
