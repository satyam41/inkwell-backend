import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { getAuthUser } from '../../../../../lib/auth';
import Article from '../../../../../models/Article';
import Comment from '../../../../../models/Comment';
import '../../../../../models/User';

export async function GET(_request, { params }) {
  try {
    await connectDB();
    const comments = await Comment.find({ article: params.articleId })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatarUrl publicationName');

    return NextResponse.json({
      success: true,
      comments: comments.map((c) => ({
        id: c._id.toString(),
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
          ? {
              id: c.author._id.toString(),
              name: c.author.name,
              username: c.author.username,
              avatarUrl: c.author.avatarUrl,
              publicationName: c.author.publicationName,
            }
          : null,
      })),
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to post a comment.' },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, message: 'Comment cannot be empty.' }, { status: 400 });
    }

    const article = await Article.findById(params.articleId);
    if (!article) {
      return NextResponse.json({ success: false, message: 'Article not found.' }, { status: 404 });
    }

    const comment = await Comment.create({
      article: article._id,
      author: user._id,
      content: content.trim(),
    });

    article.commentsCount = (article.commentsCount || 0) + 1;
    await article.save();
    await comment.populate('author', 'name username avatarUrl publicationName');

    return NextResponse.json(
      {
        success: true,
        comment: {
          id: comment._id.toString(),
          content: comment.content,
          createdAt: comment.createdAt,
          author: {
            id: comment.author._id.toString(),
            name: comment.author.name,
            username: comment.author.username,
            avatarUrl: comment.author.avatarUrl,
            publicationName: comment.author.publicationName,
          },
        },
        commentsCount: article.commentsCount,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
