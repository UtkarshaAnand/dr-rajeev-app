import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

// POST /api/doctor/logout - Doctor logout
export async function POST(request: NextRequest) {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

