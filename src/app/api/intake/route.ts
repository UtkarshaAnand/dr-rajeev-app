import { NextRequest, NextResponse } from 'next/server';
import { saveIntakeData, getIntakeData } from '@/lib/db';

// POST /api/intake - Save intake data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chatId,
      age,
      sex,
      complaint,
      duration,
      emergency,
      emergencySymptoms,
      conditions,
      medications,
    } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    // Verify chat exists before saving intake data
    const { getChat } = await import('@/lib/db');
    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found. Please create a chat first.' },
        { status: 404 }
      );
    }

    const intake = await saveIntakeData(chatId, {
      age,
      sex,
      complaint,
      duration,
      emergency,
      emergency_symptoms: emergencySymptoms || [],
      conditions,
      medications,
    });

    return NextResponse.json({ intake }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to save intake data:', error);
    
    // Provide more specific error messages
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Chat not found. Please refresh and try again.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save intake data', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/intake - Get intake data
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

    const intake = await getIntakeData(chatId);
    return NextResponse.json({
      intake,
      completed: !!intake && !!intake.completed_at,
    });
  } catch (error) {
    console.error('Failed to get intake data:', error);
    return NextResponse.json(
      { error: 'Failed to get intake data' },
      { status: 500 }
    );
  }
}

