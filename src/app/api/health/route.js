import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      service: 'inkwell-nextjs-backend',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || 'Database connection failed' },
      { status: 500 }
    );
  }
}
