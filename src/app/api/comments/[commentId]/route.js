import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth';
import Article from '../../../../models/Article';
import Comment from '../../../../models/Comment';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
    }

    const comment = await Comment.findById(params.commentId);
    if (!comment) {
      return NextResponse.json({ success: false, message: 'Comment not found.' }, { status: 404 });
    }

    const article = await Article.findById(comment.article);
    const isCommentOwner = comment.author.toString() === user._id.toString();
    const isArticleOwner = article && article.author.toString() === user._id.toString();

    if (!isCommentOwner && !isArticleOwner) {
      return NextResponse.json({ success: false, message: 'Not authorized.' }, { status: 403 });
    }

    await comment.deleteOne();
    if (article) {
      article.commentsCount = Math.max(0, (article.commentsCount || 1) - 1);
      await article.save();
    }

    return NextResponse.json({
      success: true,
      commentsCount: article ? article.commentsCount : 0,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
