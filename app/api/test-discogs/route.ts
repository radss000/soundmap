import { DiscogsAPI } from '@/lib/services/discogs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const discogs = DiscogsAPI.getInstance();
    const isConnected = await discogs.testConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'Connected to Discogs API' : 'Failed to connect to Discogs API'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}