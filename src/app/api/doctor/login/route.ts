import { NextRequest, NextResponse } from 'next/server';
import { getDoctorByEmail } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

// POST /api/doctor/login - Doctor login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    const doctor = await getDoctorByEmail(normalizedEmail);
    if (!doctor) {
      console.error(`Doctor not found for email: ${email}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, doctor.password_hash);
    if (!isValid) {
      console.error(`Password verification failed for email: ${email}`);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await createSession(doctor.id, doctor.email);

    return NextResponse.json({
      success: true,
      doctor: { id: doctor.id, email: doctor.email },
    });
  } catch (error) {
    console.error('Failed to login:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

