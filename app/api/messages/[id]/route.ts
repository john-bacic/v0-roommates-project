import { NextRequest, NextResponse } from 'next/server';
import { deleteMessage } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params }: any) {
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

    const success = await deleteMessage(params.id, parseInt(userId));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete message or unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/messages/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
} 