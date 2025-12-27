import { NextRequest, NextResponse } from 'next/server';
import { createChat, getChat } from '@/lib/db';

// POST /api/chats - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const chat = await createChat();
    return NextResponse.json({ chatId: chat.id }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create chat:', error);
    
    // Provide more specific error messages
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Database permission denied. Please check RLS policies for chats table.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create chat', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/chats - Get chat by ID
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

    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Failed to get chat:', error);
    return NextResponse.json(
      { error: 'Failed to get chat' },
      { status: 500 }
    );
  }
}

