import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';
import User from '../../../../models/User';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const query = user ? { _id: { $ne: user._id } } : {};
    const users = await User.find(query).sort({ createdAt: -1 }).limit(8);

    return NextResponse.json({
      success: true,
      writers: users.map((u) => u.toPublicProfile(user?._id || null)),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
