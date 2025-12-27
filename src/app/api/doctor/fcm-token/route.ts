// API route to register/update FCM token for doctor
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDoctorByEmail, updateDoctorFCMTokens } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Require doctor authentication
    const session = await requireAuth();
    const doctorEmail = session.email;

    const body = await request.json();
    const { fcmToken } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json(
        { error: 'fcmToken is required and must be a string' },
        { status: 400 }
      );
    }

    // Get doctor
    const doctor = await getDoctorByEmail(doctorEmail);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Update FCM tokens (add if not exists, keep existing ones)
    const existingTokens = doctor.fcm_tokens || [];
    const updatedTokens = existingTokens.includes(fcmToken)
      ? existingTokens
      : [...existingTokens, fcmToken];

    await updateDoctorFCMTokens(doctor.id, updatedTokens);

    return NextResponse.json({
      success: true,
      message: 'FCM token registered successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Failed to register FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to register FCM token' },
      { status: 500 }
    );
  }
}

// DELETE to remove FCM token
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const doctorEmail = session.email;

    const body = await request.json();
    const { fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'fcmToken is required' },
        { status: 400 }
      );
    }

    const doctor = await getDoctorByEmail(doctorEmail);
    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Remove token
    const existingTokens = doctor.fcm_tokens || [];
    const updatedTokens = existingTokens.filter(token => token !== fcmToken);

    await updateDoctorFCMTokens(doctor.id, updatedTokens);

    return NextResponse.json({
      success: true,
      message: 'FCM token removed successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Failed to remove FCM token:', error);
    return NextResponse.json(
      { error: 'Failed to remove FCM token' },
      { status: 500 }
    );
  }
}

