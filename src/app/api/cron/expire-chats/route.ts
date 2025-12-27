// API route for chat expiry cleanup job
// This can be called by a cron service (e.g., Render Cron Jobs, Vercel Cron, or external service)
// to automatically expire old chats

import { NextRequest, NextResponse } from 'next/server';
import { expireChats } from '@/lib/db';

// Optional: Add authentication for cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting chat expiry cleanup...');
    const startTime = Date.now();
    
    await expireChats();
    
    const duration = Date.now() - startTime;
    console.log(`[Cron] Chat expiry cleanup completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Chat expiry cleanup completed',
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error('[Cron] Failed to expire chats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to expire chats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request);
}

