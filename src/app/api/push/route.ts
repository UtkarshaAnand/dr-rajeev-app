import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDoctorByEmail, updateDoctorFCMTokens } from '@/lib/db';

// POST /api/push - Register FCM token for push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const doctor = await getDoctorByEmail(session.email);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Add token if not already present
    const tokens = doctor.fcm_tokens || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      await updateDoctorFCMTokens(doctor.id, tokens);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to register push token:', error);
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    );
  }
}

// Helper function to send push notification (call from message creation)
export async function sendPushNotification(
  doctorId: string,
  title: string,
  body: string,
  data?: any
) {
  // TODO: Implement FCM push notification
  // This requires Firebase Admin SDK
  // For now, this is a placeholder
  console.log('Push notification:', { doctorId, title, body, data });
}

