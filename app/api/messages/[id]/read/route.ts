import { NextRequest, NextResponse } from 'next/server';
import { markMessageAsRead } from '@/lib/supabase';

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = await markMessageAsRead(params.id, userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/messages/[id]/read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
} 