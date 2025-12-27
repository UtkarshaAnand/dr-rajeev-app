import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllChats } from '@/lib/db';

// GET /api/doctor/inbox - Get all chats for doctor inbox
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const chats = await getAllChats();
    return NextResponse.json({ chats });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to get inbox:', error);
    return NextResponse.json(
      { error: 'Failed to get inbox' },
      { status: 500 }
    );
  }
}

