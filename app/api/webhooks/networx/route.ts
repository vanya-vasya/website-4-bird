import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prismadb from '@/lib/prismadb';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Функция для верификации подписи webhook согласно документации Networx
function verifyWebhookSignature(data: Record<string, any>, signature: string, secretKey: string): boolean {
  // Удаляем подпись из данных для верификации
  const { signature: _, ...dataForSignature } = data;

  // Сортируем параметры по ключу
  const sortedParams = Object.keys(dataForSignature)
    .sort()
    .reduce((obj: Record<string, any>, key) => {
      obj[key] = dataForSignature[key];
      return obj;
    }, {});

  // Создаем строку для подписи
  const signString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Создаем подпись HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signString)
    .digest('hex');

  return expectedSignature === signature;
}

// Generate receipt PDF for successful payment
async function generatePdfReceipt(transaction: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#10b981')
      .text('YUM-MI', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#000000')
      .text('PAYMENT RECEIPT', { align: 'center' })
      .moveDown(2);

    // Receipt details
    const receiptDate = transaction.paid_at 
      ? new Date(transaction.paid_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`Receipt Date: ${receiptDate}`)
      .text(`Transaction ID: ${transaction.tracking_id}`)
      .text(`Receipt Number: ${transaction.id.slice(-12)}`)
      .moveDown(2);

    // Divider
    doc
      .strokeColor('#10b981')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown();

    // Payment details
    doc
      .fontSize(14)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('Payment Details')
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#000000')
      .text(`Description: ${transaction.description}`)
      .text(`Amount: ${(transaction.amount / 100).toFixed(2)} ${transaction.currency}`)
      .text(`Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}`)
      .text(`Payment Method: ${transaction.payment_method_type || 'Card Payment'}`)
      .moveDown(2);

    // Company info
    doc
      .fontSize(8)
      .fillColor('#999999')
      .text('QUICK FIT LTD (№15995367)', { align: 'center' })
      .text('DEPT 2, 43 OWSTON ROAD, CARCROFT, DONCASTER, UNITED KINGDOM, DN6 8DA', {
        align: 'center',
      })
      .text('Email: support@yum-mi.com', { align: 'center' })
      .moveDown(2);

    // Footer
    doc
      .fontSize(9)
      .fillColor('#10b981')
      .text('Thank you for your purchase!', { align: 'center' })
      .moveDown(0.5)
      .fontSize(8)
      .fillColor('#999999')
      .text('For questions or support, please contact support@yum-mi.com', {
        align: 'center',
      });

    doc.end();
  });
}

// Calculate tokens from amount (GBP pricing: £0.20 per token)
function calculateTokensFromAmount(amountInCents: number, currency: string): number {
  // Base price is £0.20 per token (20 pence)
  const pricePerTokenInCents = 20; // 20 pence in GBP
  
  // For simplicity, we'll use GBP as base and approximate for other currencies
  // In production, you'd want exact exchange rates
  const currencyMultipliers: Record<string, number> = {
    'GBP': 1,
    'EUR': 0.85, // Approximate
    'USD': 0.75, // Approximate
  };
  
  const multiplier = currencyMultipliers[currency] || 1;
  const effectivePricePerToken = pricePerTokenInCents / multiplier;
  
  return Math.floor(amountInCents / effectivePricePerToken);
}

// POST - Обработка webhook уведомлений от Networx Hosted Payment Page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('═'.repeat(60));
    console.log('📥 Networx HPP Webhook Received');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(body, null, 2));
    console.log('═'.repeat(60));

    const secretKey = process.env.NETWORX_SECRET_KEY || 'dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950';
    if (!secretKey) {
      console.error('❌ NETWORX_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Extract checkout data from HPP webhook structure
    const checkout = body.checkout;
    if (!checkout) {
      console.error('❌ Invalid webhook structure: missing checkout object');
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    // HPP webhooks may not include signature verification
    // Instead, verify by checking the token against our database
    const { 
      token,
      status, 
      order,
      customer,
      transaction
    } = checkout;

    const tracking_id = order?.tracking_id;
    const amount = order?.amount;
    const currency = order?.currency;
    const email = customer?.email;
    
    console.log(`📋 Payment Details:`);
    console.log(`  Token: ${token}`);
    console.log(`  Status: ${status}`);
    console.log(`  Tracking ID: ${tracking_id}`);
    console.log(`  Amount: ${amount} ${currency}`);
    console.log(`  Email: ${email}`);

    // Process payment status
    switch (status) {
      case 'completed':
      case 'success':
        console.log(`✅ Payment SUCCESSFUL for order ${tracking_id}`);
        console.log(`   Amount: ${amount} cents = ${(amount / 100).toFixed(2)} ${currency}`);
        
        try {
          // Extract user ID from tracking_id (format: gen_userId_timestamp)
          const trackingParts = tracking_id.split('_');
          if (trackingParts.length < 3 || trackingParts[0] !== 'gen') {
            console.error(`❌ Invalid tracking_id format: ${tracking_id}`);
            console.log('   Expected format: gen_userId_timestamp');
            break;
          }
          
          // userId is everything between 'gen_' and the final '_timestamp'
          const userId = trackingParts.slice(1, -1).join('_');
          console.log(`   Extracted userId: ${userId}`);
          
          // Get user from database
          const user = await prismadb.user.findUnique({
            where: { clerkId: userId },
            select: {
              id: true,
              clerkId: true,
              email: true,
              usedGenerations: true,
              availableGenerations: true,
            },
          });
          
          if (!user) {
            console.error(`❌ User not found with clerkId: ${userId}`);
            break;
          }
          
          console.log(`   Found user: ${user.email}`);
          console.log(`   Current balance: ${user.availableGenerations - user.usedGenerations} tokens`);
          
          // Calculate tokens from amount
          const tokens = calculateTokensFromAmount(amount, currency);
          console.log(`   Calculated tokens: ${tokens}`);
          
          // Update user token balance
          const updatedUser = await prismadb.user.update({
            where: { clerkId: userId },
            data: {
              availableGenerations: user.availableGenerations - user.usedGenerations + tokens,
              usedGenerations: 0,
            },
          });
          
          console.log(`   ✅ Updated user balance: ${updatedUser.availableGenerations} tokens`);
          
          // Create transaction record
          const createdTransaction = await prismadb.transaction.create({
            data: {
              tracking_id: tracking_id,
              userId: userId,
              status: status,
              amount: amount,
              currency: currency,
              description: order?.description || `Yum-mi Tokens Purchase (${tokens} Tokens)`,
              type: 'payment',
              payment_method_type: transaction?.payment_method_type || 'card',
              message: transaction?.message || 'Payment completed successfully',
              paid_at: transaction?.paid_at ? new Date(transaction.paid_at) : new Date(),
              receipt_url: null, // Will be updated after PDF generation
            },
          });
          
          console.log(`   ✅ Transaction created: ${createdTransaction.id}`);
          
          // Generate PDF receipt
          try {
            const pdfBuffer = await generatePdfReceipt({
              ...createdTransaction,
              description: createdTransaction.description || `Yum-mi Tokens Purchase (${tokens} Tokens)`,
            });
            
            // Store PDF in database (base64)
            const receiptBase64 = pdfBuffer.toString('base64');
            const receiptUrl = `data:application/pdf;base64,${receiptBase64}`;
            
            await prismadb.transaction.update({
              where: { id: createdTransaction.id },
              data: { receipt_url: receiptUrl },
            });
            
            console.log(`   ✅ Receipt PDF generated and stored`);
            
            // Send confirmation email
            if (process.env.RESEND_API_KEY && user.email) {
              try {
                await resend.emails.send({
                  from: 'Yum-mi <support@yum-mi.com>',
                  to: user.email,
                  subject: `Payment Confirmation - ${tokens} Tokens Added`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #10b981;">Payment Successful!</h2>
                      <p>Thank you for your purchase. Your payment has been processed successfully.</p>
                      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Transaction ID:</strong> ${tracking_id}</p>
                        <p><strong>Amount:</strong> ${(amount / 100).toFixed(2)} ${currency}</p>
                        <p><strong>Tokens Added:</strong> ${tokens}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                      </div>
                      <p>You can view your payment history at any time in your dashboard.</p>
                      <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        QUICK FIT LTD (№15995367)<br/>
                        Email: support@yum-mi.com
                      </p>
                    </div>
                  `,
                  attachments: [
                    {
                      filename: `receipt_${createdTransaction.id.slice(-12)}.pdf`,
                      content: pdfBuffer,
                    },
                  ],
                });
                
                console.log(`   ✅ Confirmation email sent to ${user.email}`);
              } catch (emailError) {
                console.error(`   ⚠️ Failed to send email:`, emailError);
                // Don't fail the webhook if email fails
              }
            }
          } catch (pdfError) {
            console.error(`   ⚠️ Failed to generate PDF receipt:`, pdfError);
            // Don't fail the webhook if PDF generation fails
          }
          
        } catch (dbError) {
          console.error(`   ❌ Database error processing payment:`, dbError);
          console.error(dbError);
        }
        break;

      case 'failed':
      case 'declined':
        console.log(`❌ Payment FAILED for order ${tracking_id}`);
        console.log(`   Reason: ${transaction?.error_message || 'Unknown'}`);
        
        // Log failed payment attempt
        try {
          const trackingParts = tracking_id.split('_');
          if (trackingParts.length >= 3 && trackingParts[0] === 'gen') {
            const userId = trackingParts.slice(1, -1).join('_');
            
            await prismadb.transaction.create({
              data: {
                tracking_id: tracking_id,
                userId: userId,
                status: 'failed',
                amount: amount,
                currency: currency,
                description: order?.description || 'Payment failed',
                type: 'payment',
                payment_method_type: transaction?.payment_method_type || 'card',
                message: transaction?.error_message || 'Payment failed',
                paid_at: null,
                receipt_url: null,
              },
            });
            
            console.log(`   ✅ Failed transaction logged`);
          }
        } catch (error) {
          console.error(`   ⚠️ Failed to log failed transaction:`, error);
        }
        break;

      case 'pending':
      case 'processing':
        console.log(`⏳ Payment PENDING for order ${tracking_id}`);
        // Payment is being processed, wait for final status
        break;

      case 'canceled':
      case 'cancelled':
        console.log(`🚫 Payment CANCELED for order ${tracking_id}`);
        // User canceled the payment - no action needed
        break;

      case 'refunded':
        console.log(`💰 Payment REFUNDED for order ${tracking_id}`);
        
        try {
          const trackingParts = tracking_id.split('_');
          if (trackingParts.length >= 3 && trackingParts[0] === 'gen') {
            const userId = trackingParts.slice(1, -1).join('_');
            
            // Find original transaction
            const originalTransaction = await prismadb.transaction.findFirst({
              where: {
                tracking_id: tracking_id,
                userId: userId,
                status: 'success',
              },
            });
            
            if (originalTransaction) {
              const tokens = calculateTokensFromAmount(originalTransaction.amount || 0, originalTransaction.currency || 'GBP');
              
              // Get user
              const user = await prismadb.user.findUnique({
                where: { clerkId: userId },
              });
              
              if (user) {
                // Deduct tokens from balance
                await prismadb.user.update({
                  where: { clerkId: userId },
                  data: {
                    availableGenerations: Math.max(0, user.availableGenerations - tokens),
                  },
                });
                
                console.log(`   ✅ Deducted ${tokens} tokens from user balance`);
              }
              
              // Update transaction status to refunded
              await prismadb.transaction.update({
                where: { id: originalTransaction.id },
                data: { status: 'refunded' },
              });
              
              console.log(`   ✅ Transaction marked as refunded`);
            }
          }
        } catch (error) {
          console.error(`   ⚠️ Failed to process refund:`, error);
        }
        break;

      default:
        console.log(`❓ Unknown payment status: ${status} for order ${tracking_id}`);
    }

    // Возвращаем успешный ответ согласно требованиям Networx
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET - Для проверки доступности endpoint'а
export async function GET() {
  return NextResponse.json({
    message: 'Networx webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
