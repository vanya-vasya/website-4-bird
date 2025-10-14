# 🐛 Token Deduction Race Condition - Root Cause & Fix

**Date**: October 14, 2025  
**Severity**: CRITICAL  
**Status**: 🔍 INVESTIGATING

---

## 🎯 Problem Statement

After implementing token deduction in `/api/generate`, users report:

1. **UI shows deduction** (50 → 40 available) ✅
2. **UI reverts after 500ms** (40 → 50 available) ❌
3. **No database update** (usedGenerations stays 0) ❌
4. **No transaction record created** ❌

**User Experience**:
```
[0ms] Click Generate
[100ms] UI: "40 available" (optimistic)
[600ms] UI: "50 available" (reverted!)
Database: usedGenerations = 0 ❌
```

---

## 🔍 Root Cause Analysis

### **Investigation Findings**

#### **1. Frontend Bypasses `/api/generate`**

The conversation page calls N8N webhooks **DIRECTLY**:

```typescript
// app/(dashboard)/dashboard/conversation/page.tsx:284
webhookResponse = await webhookClient.sendFileToWebhookWithRetry(
  uploadedImage!,
  toolId,
  defaultPrompt,
  userId || undefined,
  2, // maxRetries
  45000 // timeoutMs
);
```

#### **2. N8N Webhook Client Goes Direct**

```typescript
// lib/n8n-webhook.ts:342
const webhookUrl = toolId === 'cal-tracker' 
  ? this.calTrackerWebhookUrl 
  : this.directWebhookUrl;

// lib/n8n-webhook.ts:374
const response = await fetch(webhookUrl, {  // ❌ Direct to N8N!
  method: 'POST',
  body: formData,
  signal: controller.signal,
  mode: 'cors',
});
```

**Webhook URLs** (from constructor):
```typescript
this.directWebhookUrl = 'https://vanya-vasya.app.n8n.cloud/webhook/4c6c4649-99ef-4598-b77b-6cb12ab6a102';
this.calTrackerWebhookUrl = 'https://vanya-vasya.app.n8n.cloud/webhook/02d7bdba-03a4-4f98-bc49-c44d32349a47';
```

#### **3. The Flow is Broken**

```
CURRENT (BROKEN):
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ sendFileToWebhookWithRetry()
       ↓
┌──────────────┐
│ N8N Webhook  │ ← Direct call
│ (External)   │ ← NO auth, NO credit check
└──────┬───────┘ ← NO token deduction
       │
       ↓
┌──────────────┐
│ AI Response  │
└──────────────┘

/api/generate endpoint: ❌ NEVER CALLED
Token deduction logic: ❌ NEVER EXECUTED
Database update: ❌ NEVER HAPPENS
```

**Expected Flow:**
```
SHOULD BE:
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ POST /api/generate
       ↓
┌──────────────┐
│/api/generate │ ← ✅ Auth
│   (Backend)  │ ← ✅ Credit check
└──────┬───────┘ ← ✅ Token deduction (on success)
       │
       ↓
┌──────────────┐
│ N8N Webhook  │ ← Forwarded from backend
│ (External)   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ AI Response  │
└──────────────┘
```

---

## 📊 Why Optimistic Update Reverts

```typescript
// Conversation page:
// Line 351: Optimistic deduction
deductCredits(toolPrice); // UI shows 40 available

// Line 358-361: Refresh after 500ms
setTimeout(async () => {
  await refreshCredits();  // Fetch from DB
  router.refresh();
}, 500);
```

**The Problem**:
1. **Optimistic update** decreases context state (40 available) ✅
2. **Backend never called**, so DB stays at 50 ❌
3. **Refresh fetches from DB** (50 available) ✅
4. **Context updates to 50** (revert!) ❌

---

## 🔧 Solution Architecture

### **Approach 1: Route Through `/api/generate`** ⭐ **RECOMMENDED**

**Benefits**:
- ✅ Single endpoint for all AI requests
- ✅ Centralized auth and credit management
- ✅ Consistent token deduction
- ✅ Single source of truth

**Changes Required**:
1. Update `/api/generate` to handle **multipart/form-data** (file uploads)
2. Update N8N webhook client to call `/api/generate` instead of N8N direct
3. Have `/api/generate` forward to N8N after credit check
4. Return unified response format

**Implementation**:

```typescript
// app/api/generate/route.ts
export async function POST(req: NextRequest) {
  // 1. Parse request (JSON or multipart)
  const contentType = req.headers.get('content-type') || '';
  
  let payload: any;
  let file: File | null = null;
  
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    file = formData.get('file') as File;
    const messageStr = formData.get('message') as string;
    payload = JSON.parse(messageStr);
  } else {
    payload = await req.json();
  }
  
  // 2. Authenticate
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 3. Check credits
  const toolId = payload.tool?.id || payload.toolId;
  const toolPrice = TOOL_PRICES[toolId] || 0;
  
  if (toolPrice > 0) {
    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { usedGenerations: true, availableGenerations: true }
    });
    
    const remainingCredits = user.availableGenerations - user.usedGenerations;
    if (remainingCredits < toolPrice) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        required: toolPrice,
        available: remainingCredits
      }, { status: 403 });
    }
  }
  
  // 4. Forward to N8N
  const n8nUrl = getN8nWebhookUrl(toolId);
  
  let n8nRes;
  if (file) {
    // Forward as multipart
    const n8nFormData = new FormData();
    n8nFormData.append('file', file);
    n8nFormData.append('message', JSON.stringify({
      toolId,
      content: payload.content,
      userId,
      timestamp: new Date().toISOString(),
      sessionId: `session_${Date.now()}`
    }));
    
    n8nRes = await fetch(n8nUrl, {
      method: 'POST',
      body: n8nFormData,
    });
  } else {
    // Forward as JSON
    n8nRes = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  
  // 5. Deduct tokens if successful
  if (n8nRes.ok && toolPrice > 0) {
    await prismadb.$transaction(async (tx) => {
      await tx.user.update({
        where: { clerkId: userId },
        data: { usedGenerations: { increment: toolPrice } }
      });
      
      await tx.transaction.create({
        data: {
          tracking_id: `usage_${toolId}_${Date.now()}`,
          userId: userId,
          amount: -toolPrice,
          currency: 'tokens',
          type: 'deduction',
          status: 'completed',
          description: `${getToolName(toolId)} - AI Generation`,
          message: `${toolPrice} tokens deducted`,
          paid_at: new Date(),
        }
      });
    });
  }
  
  // 6. Return response
  const text = await n8nRes.text();
  return new NextResponse(text, {
    status: n8nRes.status,
    headers: { 'content-type': n8nRes.headers.get('content-type') || 'application/json' }
  });
}
```

**Update N8N Webhook Client**:

```typescript
// lib/n8n-webhook.ts
async sendFileToWebhook(
  file: File,
  toolId: string,
  prompt: string = 'Analyze this food image',
  userId?: string,
  timeoutMs: number = 45000
): Promise<N8nWebhookResponse> {
  // NEW: Route through /api/generate instead of direct N8N call
  const formData = new FormData();
  formData.append('file', file);
  formData.append('message', JSON.stringify({
    toolId,
    content: prompt,
    userId,
    timestamp: new Date().toISOString(),
    sessionId: this.generateSessionId(),
  }));

  const response = await fetch('/api/generate', {  // ✅ Use our endpoint
    method: 'POST',
    body: formData,
  });

  // Handle response...
}
```

---

### **Approach 2: Separate Token Deduction Endpoint** ❌ **NOT RECOMMENDED**

**Why Not**:
- ❌ Two separate calls (N8N + token deduction)
- ❌ Race conditions possible
- ❌ No atomic transaction
- ❌ More complex error handling

---

## 🧪 Testing Plan

### **Unit Tests**

```typescript
describe('/api/generate - File Upload with Token Deduction', () => {
  it('should handle multipart/form-data file upload', async () => {
    const formData = new FormData();
    formData.append('file', mockFile);
    formData.append('message', JSON.stringify({ toolId: 'master-chef' }));

    const response = await POST(createMockRequest(formData));
    
    expect(response.status).toBe(200);
  });

  it('should deduct tokens after successful file upload', async () => {
    // Mock user with 50 credits
    mockUser({ usedGenerations: 0, availableGenerations: 50 });
    
    // Mock N8N success
    mockN8nResponse({ status: 200, body: 'AI response' });

    await POST(createMockRequest(formData));

    // Verify token deduction
    expect(prismadb.user.update).toHaveBeenCalledWith({
      where: { clerkId: 'user_test' },
      data: { usedGenerations: { increment: 10 } }
    });
    
    // Verify transaction record
    expect(prismadb.transaction.create).toHaveBeenCalled();
  });

  it('should NOT deduct tokens if N8N fails', async () => {
    // Mock N8N failure
    mockN8nResponse({ status: 500, body: 'Error' });

    await POST(createMockRequest(formData));

    // Verify NO token deduction
    expect(prismadb.user.update).not.toHaveBeenCalled();
  });
});
```

### **Integration Tests**

```typescript
describe('End-to-End: Recipe Generation', () => {
  it('should deduct 10 tokens and create transaction record', async () => {
    // Setup: User with 50 credits
    const user = await createTestUser({ availableGenerations: 50 });
    
    // Action: Generate recipe
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: createFormData({ toolId: 'master-chef', file: testImage }),
    });
    
    expect(response.ok).toBe(true);
    
    // Verify: Database updated
    const updatedUser = await prismadb.user.findUnique({
      where: { clerkId: user.clerkId }
    });
    expect(updatedUser.usedGenerations).toBe(10);
    
    // Verify: Transaction created
    const transaction = await prismadb.transaction.findFirst({
      where: { userId: user.clerkId, type: 'deduction' }
    });
    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(-10);
  });
});
```

### **Manual Testing Checklist**

- [ ] Generate recipe with 50 credits
- [ ] UI shows 40 available immediately (optimistic)
- [ ] After 1 second, still shows 40 available (no revert!)
- [ ] Database shows usedGenerations = 10
- [ ] Transaction record exists with amount = -10
- [ ] Page refresh still shows 40 available
- [ ] Second generation shows 30 available

---

## 📝 Implementation Steps

1. **Update `/api/generate/route.ts`**
   - Add multipart/form-data handling
   - Add N8N URL helper function
   - Forward file uploads to N8N
   - Keep existing token deduction logic

2. **Update `lib/n8n-webhook.ts`**
   - Change `sendFileToWebhook` to call `/api/generate`
   - Change `sendDescriptionToWebhook` to call `/api/generate`
   - Remove direct N8N webhook calls

3. **Update conversation page**
   - Remove 500ms setTimeout refresh
   - Trust backend to deduct tokens
   - Only refresh on mount/focus

4. **Update credit context**
   - Remove optimistic `deductCredits` call from conversation page
   - Let backend handle deduction
   - Refresh immediately after AI response

5. **Add logging**
   - Add correlation IDs to track requests
   - Log at each step: auth → credit check → N8N call → deduction → response

6. **Add tests**
   - Unit tests for multipart handling
   - Integration tests for full flow
   - Verify no double-deduction on retry

---

## 🎯 Expected Outcome

### **After Fix**:
```
[0ms] Click Generate
  ↓
[10ms] POST /api/generate
  ├─ Auth: ✅
  ├─ Credits: ✅ 50 available, need 10
  ├─ Forward to N8N
  ↓
[5000ms] N8N Response: Success
  ├─ Deduct: usedGenerations += 10
  ├─ Record: Transaction with amount=-10
  ├─ Return AI response
  ↓
[5010ms] Frontend receives response
  ├─ Refresh context from /api/generations
  ├─ UI updates: "40 available"
  ↓
Database: usedGenerations = 10 ✅
UI: "40 available" ✅
No revert ✅
```

---

## 🚨 Risks & Mitigation

### **Risk 1: Breaking Existing Functionality**
- **Mitigation**: Feature flag to toggle between direct N8N and proxied calls
- **Rollback**: Keep old N8N client methods as fallback

### **Risk 2: Performance Impact**
- **Mitigation**: `/api/generate` is lightweight proxy, minimal overhead
- **Monitoring**: Track response times before/after

### **Risk 3: N8N CORS Issues**
- **Mitigation**: Server-side call bypasses CORS
- **Testing**: Verify all tool types work

---

## 📊 Success Metrics

**Before Fix**:
- Token deduction rate: 0% ❌
- UI consistency: Broken (reverts) ❌
- Database accuracy: 0% ❌

**After Fix**:
- Token deduction rate: 100% ✅
- UI consistency: Perfect (no reverts) ✅
- Database accuracy: 100% ✅

---

**Status**: Ready for implementation  
**Priority**: CRITICAL  
**Estimated Time**: 2-3 hours

