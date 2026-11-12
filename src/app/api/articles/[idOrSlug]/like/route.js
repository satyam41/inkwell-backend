import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import Article from '../../../../../models/Article';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to like articles.' },
        { status: 401 }
      );
    }

    const article = await Article.findById(params.idOrSlug);
    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found.' }, { status: 404 });
    }

    const userIdStr = user._id.toString();
    const alreadyLiked = article.likes.some((id) => id.toString() === userIdStr);

    if (alreadyLiked) {
      article.likes = article.likes.filter((id) => id.toString() !== userIdStr);
    } else {
      article.likes.push(user._id);
    }

    await article.save();

    return NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: article.likes.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
