import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';
import { serializeArticle } from '../../../../lib/serialize';
import User from '../../../../models/User';
import Article from '../../../../models/Article';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const currentUser = await getAuthUser(request);
    const { usernameOrId } = params;

    const query = mongoose.Types.ObjectId.isValid(usernameOrId)
      ? { $or: [{ _id: usernameOrId }, { username: usernameOrId.toLowerCase() }] }
      : { username: usernameOrId.toLowerCase() };

    const targetUser = await User.findOne(query);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Writer not found.' }, { status: 404 });
    }

    const articles = await Article.find({ author: targetUser._id, published: true })
      .sort({ createdAt: -1 })
      .populate('author', 'name username publicationName avatarUrl bio followers');

    return NextResponse.json({
      success: true,
      profile: targetUser.toPublicProfile(currentUser?._id || null),
      articles: articles.map((a) => serializeArticle(a, currentUser?._id || null, false)),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
