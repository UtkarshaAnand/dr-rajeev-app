import { NextRequest, NextResponse } from 'next/server';
import { createMessage, getMessages, getChat, getAllDoctors, updateDoctorFCMTokens } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getWebSocketServer, broadcastMessage } from '@/lib/websocket-server';
import { initializeWebSocketServer } from '@/lib/server-init';
import { sendPushNotificationToMultiple } from '@/lib/firebase-admin';

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(chatId: string): boolean {
  const now = Date.now();
  const limit = 10; // 10 messages per minute
  const window = 60 * 1000; // 1 minute

  const record = rateLimitStore.get(chatId);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(chatId, { count: 1, resetAt: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// POST /api/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, sender, content } = body;

    if (!chatId || !sender || !content) {
      return NextResponse.json(
        { error: 'chatId, sender, and content are required' },
        { status: 400 }
      );
    }

    // Verify chat exists
    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify doctor authentication for doctor messages
    if (sender === 'doctor') {
      try {
        await requireAuth();
      } catch {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Rate limiting for patients
    if (sender === 'patient' && !checkRateLimit(chatId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const message = await createMessage(chatId, sender, content);

    // Ensure WebSocket server is running and broadcast message
    try {
      initializeWebSocketServer();
      
      // Broadcast message via WebSocket
      const wss = getWebSocketServer();
      if (wss) {
        console.log(`[Messages API] Broadcasting message ${message.id} to chat ${chatId}`);
        broadcastMessage(chatId, {
          type: 'message',
          message: message,
        });
      } else {
        console.warn('[Messages API] WebSocket server not available, message saved but not broadcast');
      }
    } catch (error) {
      console.error('[Messages API] Failed to broadcast message:', error);
      // Continue even if broadcast fails - message is still saved
    }

    // Send push notification to doctors if sender is patient (when PWA is closed)
    if (sender === 'patient') {
      try {
        // Get all doctors with FCM tokens
        const doctors = await getAllDoctors();
        const allFcmTokens = doctors
          .flatMap(doctor => doctor.fcm_tokens || [])
          .filter(Boolean);

        if (allFcmTokens.length > 0) {
          const title = 'New Patient Message';
          const body = content.length > 50 ? content.substring(0, 50) + '...' : content;
          
          const result = await sendPushNotificationToMultiple(
            allFcmTokens,
            title,
            body,
            {
              chatId,
              type: 'new_message',
            }
          );

          console.log(`[Messages API] Push notifications sent: ${result.success} success, ${result.failure} failed`);

          // Remove invalid tokens
          if (result.failedTokens.length > 0) {
            console.log(`[Messages API] Removing ${result.failedTokens.length} invalid FCM tokens`);
            for (const doctor of doctors) {
              const validTokens = (doctor.fcm_tokens || []).filter(
                token => !result.failedTokens.includes(token)
              );
              if (validTokens.length !== (doctor.fcm_tokens || []).length) {
                await updateDoctorFCMTokens(doctor.id, validTokens);
              }
            }
          }
        } else {
          console.log('[Messages API] No FCM tokens registered, skipping push notification');
        }
      } catch (error: any) {
        // Don't fail message creation if push fails
        if (error.message?.includes('FIREBASE_SERVICE_ACCOUNT')) {
          console.warn('[Messages API] Firebase not configured, skipping push notification');
        } else {
          console.error('[Messages API] Failed to send push notification:', error);
        }
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// GET /api/messages - Get messages for a chat
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const messages = await getMessages(chatId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

