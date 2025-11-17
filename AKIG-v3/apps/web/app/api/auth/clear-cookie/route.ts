import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete auth cookies
    cookieStore.delete('akig-token');
    cookieStore.delete('akig-refresh');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear cookie error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cookies' },
      { status: 500 }
    );
  }
}
