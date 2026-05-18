import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prismadb from '@/lib/prismadb';
import {
  logActivity,
  type ActivityAction,
  type ChefMetadata,
  type NutritionistMetadata,
  type TrackerMetadata,
} from '@/lib/activity-log';

// Tool pricing configuration in GBP pence (100 pence = £1.00)
// Conversion: 1 token = £0.20, so 5 tokens = £1, 10 tokens = £2, 15 tokens = £3
const TOOL_PRICES_GBP: Record<string, number> = {
  'master-chef': 200,        // £2.00 in pence
  'master-nutritionist': 300, // £3.00 in pence
  'cal-tracker': 100,        // £1.00 in pence
};

// Legacy token prices for credit balance checks (kept for backward compatibility)
const TOOL_PRICES_TOKENS: Record<string, number> = {
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

// Helper function to get N8N webhook URL based on tool ID
function getN8nWebhookUrl(toolId: string): string {
  const urls = {
    'cal-tracker': 'https://vanya-vasya.app.n8n.cloud/webhook/02d7bdba-03a4-4f98-bc49-c44d32349a47',
    'master-nutritionist': process.env.NEXT_PUBLIC_N8N_MASTER_NUTRITIONIST_URL || 'https://vanya-vasya.app.n8n.cloud/webhook/7a104f81-c923-49cd-abf4-562204fc06e9',
    'master-chef': 'https://vanya-vasya.app.n8n.cloud/webhook/4c6c4649-99ef-4598-b77b-6cb12ab6a102',
  };
  return urls[toolId as keyof typeof urls] || urls['master-chef'];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[API_GENERATE:${correlationId}] Request started`);
  
  // 1. AUTHENTICATE USER
  const { userId } = auth();
  if (!userId) {
    console.warn(`[API_GENERATE:${correlationId}] Unauthorized request`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log(`[API_GENERATE:${correlationId}] User authenticated: ${userId}`);

  // 2. PARSE REQUEST (Support both JSON and multipart/form-data)
  const contentType = req.headers.get('content-type') || '';
  let payload: any = {};
  let file: File | null = null;
  let toolId: string;

  try {
    if (contentType.includes('multipart/form-data')) {
      console.log(`[API_GENERATE:${correlationId}] Parsing multipart/form-data`);
      const formData = await req.formData();
      file = formData.get('file') as File;
      const messageStr = formData.get('message') as string;
      
      if (messageStr) {
        payload = JSON.parse(messageStr);
      }
      
      toolId = payload.toolId || 'master-chef';
      console.log(`[API_GENERATE:${correlationId}] File upload detected:`, {
        fileName: file?.name,
        fileSize: file?.size,
        toolId,
      });
    } else {
      console.log(`[API_GENERATE:${correlationId}] Parsing JSON payload`);
      payload = await req.json();
      toolId = payload.tool?.id || payload.toolId || 'master-chef';
    }
  } catch (e: any) {
    console.error(`[API_GENERATE:${correlationId}] Failed to parse request:`, e.message);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  // Extract tool information
  const toolPriceTokens = TOOL_PRICES_TOKENS[toolId] || 0; // For credit balance checks
  const toolPriceGBP = TOOL_PRICES_GBP[toolId] || 0;      // For transaction records
  const toolName = TOOL_NAMES[toolId] || 'Unknown Tool';
  
  console.log(`[API_GENERATE:${correlationId}] Tool info:`, {
    toolId,
    toolPriceTokens,
    toolPriceGBP: `£${(toolPriceGBP / 100).toFixed(2)}`,
    toolName,
    hasFile: !!file,
  });

  // 3. CHECK CREDIT BALANCE (BEFORE AI GENERATION)
  // Note: Credit balance is still tracked in tokens for backward compatibility
  if (toolPriceTokens > 0) {
    try {
      console.log(`[API_GENERATE:${correlationId}] Checking credit balance`);
      const user = await prismadb.user.findUnique({
        where: { clerkId: userId },
        select: {
          usedGenerations: true,
          availableGenerations: true,
        },
      });

      if (!user) {
        console.error(`[API_GENERATE:${correlationId}] User not found in database:`, userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const remainingCredits = user.availableGenerations - user.usedGenerations;

      if (remainingCredits < toolPriceTokens) {
        console.warn(`[API_GENERATE:${correlationId}] Insufficient credits:`, {
          userId,
          required: toolPriceTokens,
          available: remainingCredits,
        });
        return NextResponse.json({ 
          error: 'Insufficient credits',
          required: toolPriceTokens,
          available: remainingCredits,
        }, { status: 403 });
      }

      console.log(`[API_GENERATE:${correlationId}] Credit check passed:`, {
        userId,
        required: toolPriceTokens,
        available: remainingCredits,
        remaining: remainingCredits - toolPriceTokens,
      });
    } catch (error) {
      console.error(`[API_GENERATE:${correlationId}] Database error during credit check:`, error);
      return NextResponse.json({ error: 'Failed to verify credits' }, { status: 500 });
    }
  }

  // 4. FORWARD TO N8N WEBHOOK
  const n8nUrl = getN8nWebhookUrl(toolId);
  console.log(`[API_GENERATE:${correlationId}] Forwarding to N8N:`, n8nUrl);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    let n8nRes: Response;
    
    if (file) {
      // Forward as multipart/form-data (file upload)
      console.log(`[API_GENERATE:${correlationId}] Forwarding file to N8N`);
      const n8nFormData = new FormData();
      n8nFormData.append('file', file);
      n8nFormData.append('message', JSON.stringify({
        toolId,
        content: payload.content || 'Analyze this food image',
        userId,
        timestamp: new Date().toISOString(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));

      n8nRes = await fetch(n8nUrl, {
        method: 'POST',
        body: n8nFormData,
        signal: controller.signal,
      });
    } else {
      // Forward as JSON (description/text)
      console.log(`[API_GENERATE:${correlationId}] Forwarding JSON to N8N`);
      n8nRes = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);
    const processingTime = Date.now() - startTime;
    
    console.log(`[API_GENERATE:${correlationId}] N8N response received:`, {
      status: n8nRes.status,
      ok: n8nRes.ok,
      processingTime,
    });
    
    // Get response text (handles both JSON and plain text)
    const text = await n8nRes.text();
    
    console.log(`[API_GENERATE] N8N webhook response:`, {
      status: n8nRes.status,
      processingTime,
      responseSize: text.length,
    });

    // 5. DEDUCT CREDITS ONLY IF N8N CALL WAS SUCCESSFUL
    if (n8nRes.ok && toolPriceTokens > 0) {
      console.log(`[API_GENERATE:${correlationId}] N8N successful, deducting ${toolPriceTokens} tokens (£${(toolPriceGBP / 100).toFixed(2)})`);
      try {
        await prismadb.$transaction(async (tx) => {
          // Increment usedGenerations (still tracked in tokens for backward compatibility)
          const updatedUser = await tx.user.update({
            where: { clerkId: userId },
            data: { 
              usedGenerations: { increment: toolPriceTokens },
            },
            select: {
              usedGenerations: true,
              availableGenerations: true,
            },
          });

          // Create transaction record in GBP for audit trail
          const trackingId = `usage_${toolId}_${Date.now()}`;
          await tx.transaction.create({
            data: {
              tracking_id: trackingId,
              userId: userId,
              status: 'completed',
              amount: -toolPriceGBP, // Negative GBP amount in pence for deduction
              currency: 'GBP',
              description: `${toolName} - AI Generation`,
              type: 'deduction',
              payment_method_type: null,
              message: `£${(toolPriceGBP / 100).toFixed(2)} deducted for ${toolName}`,
              paid_at: new Date(),
              receipt_url: null,
            },
          });

          console.log(`[API_GENERATE:${correlationId}] ✅ Credits deducted successfully:`, {
            userId,
            toolId,
            toolPriceTokens,
            toolPriceGBP: `£${(toolPriceGBP / 100).toFixed(2)}`,
            trackingId,
            usedGenerations: updatedUser.usedGenerations,
            availableGenerations: updatedUser.availableGenerations,
            remainingCredits: updatedUser.availableGenerations - updatedUser.usedGenerations,
            timestamp: new Date().toISOString(),
          });
        });

        // Log activity (non-blocking, outside transaction)
        const ACTION_MAP: Record<string, ActivityAction> = {
          'master-chef': 'recipe_generate',
          'master-nutritionist': 'nutrition_analyze',
          'cal-tracker': 'cal_track',
        };

        const promptText: string = payload.content || payload.message || '';
        const responsePreview: string = text.slice(0, 300);
        const hasImage = !!file;
        const fileName: string | undefined = file?.name;

        let productMetadata: ChefMetadata | NutritionistMetadata | TrackerMetadata;

        if (toolId === 'master-chef') {
          productMetadata = {
            prompt: promptText,
            responsePreview,
            hasImage,
            fileName,
          } satisfies ChefMetadata;
        } else if (toolId === 'master-nutritionist') {
          productMetadata = {
            prompt: promptText,
            responsePreview,
            hasImage,
            fileName,
          } satisfies NutritionistMetadata;
        } else {
          productMetadata = {
            prompt: promptText,
            responsePreview,
            hasImage,
            fileName,
          } satisfies TrackerMetadata;
        }

        await logActivity({
          userId,
          action: ACTION_MAP[toolId] ?? 'recipe_generate',
          toolId,
          toolName,
          tokensUsed: toolPriceTokens,
          metadata: productMetadata,
        });
      } catch (dbError) {
        console.error(`[API_GENERATE:${correlationId}] ⚠️ Failed to deduct credits (AI generation succeeded but DB write failed):`, {
          userId,
          toolId,
          toolPriceTokens,
          toolPriceGBP,
          error: dbError,
        });
        // NOTE: AI generation already succeeded, so we still return the response
        // but log the error for manual reconciliation
      }
    } else if (!n8nRes.ok) {
      console.warn(`[API_GENERATE:${correlationId}] N8N failed, skipping credit deduction`);
    } else {
      console.log(`[API_GENERATE:${correlationId}] Free tool (${toolPriceTokens} tokens), skipping deduction`);
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
