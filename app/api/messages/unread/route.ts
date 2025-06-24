import { NextRequest, NextResponse } from 'next/server';
import { getUnreadMessageCount } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const count = await getUnreadMessageCount(parseInt(userId));
    
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Error in GET /api/messages/unread:', error);
    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
} 