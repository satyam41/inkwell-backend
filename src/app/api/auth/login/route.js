import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { signToken, formatAuthUser } from '../../../../lib/auth';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { identifier, email, password } = await request.json();
    const loginKey = (identifier || email || '').trim().toLowerCase();

    if (!loginKey || !password) {
      return NextResponse.json(
        { success: false, message: 'Email (or username) and password are required.' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [{ email: loginKey }, { username: loginKey }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const token = signToken(user._id);
    return NextResponse.json({ success: true, token, user: formatAuthUser(user) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
