import { NextRequest, NextResponse } from 'next/server';
import { deleteMessage } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params }: any) {
  const resolvedParams = await params;
  try {
    console.log('[API DELETE] Request received:', { 
      messageId: resolvedParams.id, 
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
    });
    
    // Get user ID from query params (in a real app, this would come from auth)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.log('[API DELETE] No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[API DELETE] Calling deleteMessage with:', { messageId: resolvedParams.id, userId: parseInt(userId) });
    const success = await deleteMessage(resolvedParams.id, parseInt(userId));
    console.log('[API DELETE] deleteMessage returned:', success);
    
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