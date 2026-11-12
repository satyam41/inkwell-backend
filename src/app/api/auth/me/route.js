import { NextResponse } from 'next/server';
import { getAuthUser, formatAuthUser } from '../../../../lib/auth';
import User from '../../../../models/User';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: formatAuthUser(user) });
}

export async function PATCH(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  const { name, bio, publicationName, avatarUrl } = await request.json();
  const updates = {};
  if (typeof name === 'string' && name.trim().length >= 2) updates.name = name.trim();
  if (typeof bio === 'string') updates.bio = bio.trim().slice(0, 300);
  if (typeof publicationName === 'string') updates.publicationName = publicationName.trim().slice(0, 100);
  if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();

  const updated = await User.findByIdAndUpdate(user._id, updates, { new: true, runValidators: true });
  return NextResponse.json({ success: true, user: formatAuthUser(updated) });
}
