import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, fetchMessages, sendMessage } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params (in a real app, this would come from auth)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const messages = await fetchMessages(parseInt(userId));
    console.log('[GET /api/messages] messages:', messages);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;
    console.log('[POST /api/messages] Received body:', body);
    console.log('[POST /api/messages] userId:', userId, 'content:', content);

    if (!userId || !content) {
      console.log('[POST /api/messages] Missing userId or content');
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      );
    }

    const message = await sendMessage(userId, content);

    if (!message) {
      const errorMsg = 'sendMessage returned null or failed (likely a Supabase error or RLS policy)';
      console.log('[POST /api/messages] sendMessage returned null');
      return NextResponse.json(
        { error: 'Failed to send message', details: errorMsg },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    // Log the error as a string and as a full object
    try {
      console.error('[POST /api/messages] Error (string):', String(error));
      console.error('[POST /api/messages] Error (full):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (e) {
      console.error('[POST /api/messages] Error (fallback):', error);
    }
    let details = '';
    if (error && typeof error === 'object') {
      try {
        details = JSON.stringify(
          Object.getOwnPropertyNames(error).reduce((acc: any, key) => {
            acc[key] = (error as any)[key];
            return acc;
          }, {})
        );
      } catch (e) {
        details = String(error);
      }
    } else {
      details = String(error);
    }
    return NextResponse.json(
      { error: 'Failed to send message', details },
      { status: 500 }
    );
  }
} 