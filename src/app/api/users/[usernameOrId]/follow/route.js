import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import User from '../../../../../models/User';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to follow writers.' },
        { status: 401 }
      );
    }

    const targetId = params.usernameOrId;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json({ success: false, message: 'Invalid writer ID.' }, { status: 400 });
    }

    if (targetId === user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'You cannot follow your own publication.' },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Writer not found.' }, { status: 404 });
    }

    const isAlreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === user._id.toString()
    );

    if (isAlreadyFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(user._id, { $pull: { following: targetUser._id } }),
        User.findByIdAndUpdate(targetUser._id, { $pull: { followers: user._id } }),
      ]);
    } else {
      await Promise.all([
        User.findByIdAndUpdate(user._id, { $addToSet: { following: targetUser._id } }),
        User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: user._id } }),
      ]);
    }

    const updatedTarget = await User.findById(targetUser._id);
    return NextResponse.json({
      success: true,
      following: !isAlreadyFollowing,
      followersCount: (updatedTarget.followers || []).length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
