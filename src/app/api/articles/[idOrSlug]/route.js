import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';
import { serializeArticle } from '../../../../lib/serialize';
import Article from '../../../../models/Article';
import Comment from '../../../../models/Comment';
import '../../../../models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const { idOrSlug } = params;

    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const article = await Article.findOne(query).populate(
      'author',
      'name username publicationName avatarUrl bio followers'
    );

    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found.' }, { status: 404 });
    }

    article.views = (article.views || 0) + 1;
    await article.save();

    return NextResponse.json({
      success: true,
      article: serializeArticle(article, user?._id || null, true),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const { idOrSlug } = params;
    const query = mongoose.Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
      : { slug: idOrSlug };

    const article = await Article.findOne(query);
    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found.' }, { status: 404 });
    }

    if (article.author.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not authorized.' }, { status: 403 });
    }

    await Promise.all([Comment.deleteMany({ article: article._id }), article.deleteOne()]);

    return NextResponse.json({ success: true, message: 'Article deleted.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
