import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { signToken, formatAuthUser } from '../../../../lib/auth';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    await connectDB();
    const { name, username, email, password, publicationName, bio } = await request.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, username, email, and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

    if (normalizedUsername.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username must be at least 3 valid characters.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            existing.email === normalizedEmail
              ? 'An account with this email already exists.'
              : 'That username is already taken.',
        },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      publicationName: publicationName ? publicationName.trim() : `${name.trim()}'s Notes`,
      bio: bio ? bio.trim() : undefined,
    });

    const token = signToken(user._id);
    return NextResponse.json({ success: true, token, user: formatAuthUser(user) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
