import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth';
import { serializeArticle } from '../../../lib/serialize';
import Article from '../../../models/Article';
import '../../../models/User';

const makeSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base || 'article'}-${crypto.randomBytes(3).toString('hex')}`;
};

export async function GET(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);

    const tab = searchParams.get('tab') || 'discover';
    const tag = searchParams.get('tag') || '';
    const search = searchParams.get('search') || '';
    const authorId = searchParams.get('authorId') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(30, Math.max(1, Number(searchParams.get('limit')) || 12));

    const filter = { published: true };

    if (tab === 'following') {
      if (!user) {
        return NextResponse.json({
          success: true,
          articles: [],
          pagination: { page, limit, total: 0, pages: 0 },
          requiresAuthForFollowing: true,
        });
      }
      filter.author = { $in: user.following || [] };
    }

    if (authorId && mongoose.Types.ObjectId.isValid(authorId)) {
      filter.author = authorId;
    }

    if (tag && tag !== 'all') {
      filter.tags = tag.toLowerCase().trim();
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: regex }, { subtitle: regex }, { content: regex }, { tags: regex }];
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name username publicationName avatarUrl bio followers'),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      articles: articles.map((doc) => serializeArticle(doc, user?._id || null, false)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to publish an article.' },
        { status: 401 }
      );
    }

    const { title, subtitle, content, coverImage, media, tags } = await request.json();

    if (!title || !content || content.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: 'Title and at least 20 characters of content are required.' },
        { status: 400 }
      );
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 6)
      : [];

    const cleanMedia = Array.isArray(media)
      ? media
          .filter((m) => m && (m.type === 'image' || m.type === 'video') && m.url)
          .map((m) => ({
            type: m.type,
            url: String(m.url),
            caption: m.caption ? String(m.caption).slice(0, 200) : '',
            originalName: m.originalName ? String(m.originalName) : '',
          }))
      : [];

    const article = await Article.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      slug: makeSlug(title),
      content: content.trim(),
      coverImage: coverImage ? String(coverImage).trim() : '',
      media: cleanMedia,
      tags: cleanTags,
      author: user._id,
    });

    await article.populate('author', 'name username publicationName avatarUrl bio followers');

    return NextResponse.json(
      { success: true, article: serializeArticle(article, user._id, true) },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
