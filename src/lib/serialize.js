export function serializeArticle(article, currentUserId = null, includeContent = false) {
  const authorDoc = article.author;
  const authorFollowers = (authorDoc?.followers || []).map((id) => id.toString());
  const likeIds = (article.likes || []).map((id) => id.toString());

  return {
    id: article._id.toString(),
    title: article.title,
    subtitle: article.subtitle,
    slug: article.slug,
    excerpt:
      article.subtitle ||
      (article.content ? `${article.content.replace(/\s+/g, ' ').trim().slice(0, 180)}...` : ''),
    ...(includeContent ? { content: article.content } : {}),
    coverImage: article.coverImage,
    media: article.media || [],
    tags: article.tags || [],
    readTimeMinutes: article.readTimeMinutes,
    views: article.views || 0,
    likesCount: likeIds.length,
    isLiked: currentUserId ? likeIds.includes(currentUserId.toString()) : false,
    commentsCount: article.commentsCount || 0,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: authorDoc
      ? {
          id: authorDoc._id.toString(),
          name: authorDoc.name,
          username: authorDoc.username,
          publicationName: authorDoc.publicationName || `${authorDoc.name}'s Notes`,
          avatarUrl: authorDoc.avatarUrl,
          bio: authorDoc.bio,
          followersCount: authorFollowers.length,
          isFollowing: currentUserId ? authorFollowers.includes(currentUserId.toString()) : false,
        }
      : null,
  };
}
