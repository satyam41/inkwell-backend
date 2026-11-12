require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'inkwell_substack',
  });

  const db = mongoose.connection.db;
  const articlesCol = db.collection('articles');
  const existing = await articlesCol.countDocuments();
  if (existing > 0) {
    console.log(`Database already has ${existing} articles. Skipping seed.`);
    await mongoose.connection.close();
    return;
  }

  const usersCol = db.collection('users');
  const commentsCol = db.collection('comments');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const now = new Date();

  const { insertedIds } = await usersCol.insertMany([
    {
      name: 'Elena Vance',
      username: 'elenavance',
      email: 'elena@inkwell.press',
      password: passwordHash,
      publicationName: 'Slow Craft Weekly',
      bio: 'Writing essays on independent media, design systems, and quiet technology.',
      avatarUrl: '',
      followers: [],
      following: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Marcus Sterling',
      username: 'msterling',
      email: 'marcus@inkwell.press',
      password: passwordHash,
      publicationName: 'Signal & Margin',
      bio: 'Software architect exploring distributed systems, creator economics, and product craft.',
      avatarUrl: '',
      followers: [],
      following: [],
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const elenaId = insertedIds[0];
  const marcusId = insertedIds[1];

  const articleRes = await articlesCol.insertMany([
    {
      title: 'Why Independent Writing Outlasts Algorithmic Feeds',
      subtitle: 'When readers choose who they follow, depth becomes a feature rather than a liability.',
      slug: 'why-independent-writing-outlasts-feeds',
      content:
        'For the past decade, most digital publishing optimized for a single metric: how quickly a headline could interrupt someone scrolling between unrelated updates.\n\nIndependent newsletters flipped that equation. Instead of renting attention from an opaque ranking algorithm, writers build direct relationships with readers who genuinely want to hear from them.\n\nWhen the incentive shifts from viral outrage to long-term trust, everything about the craft changes. Headlines become clearer, arguments get more nuanced, and embedded images or short video serve the story rather than baiting a click.',
      coverImage: '',
      media: [],
      tags: ['media', 'culture', 'writing'],
      author: elenaId,
      likes: [marcusId],
      commentsCount: 1,
      readTimeMinutes: 2,
      views: 12,
      published: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Designing Interfaces That Respect the Reader',
      subtitle: 'Notes on editorial typography, Dynamic Island controls, and calm spatial hierarchy.',
      slug: 'designing-interfaces-that-respect-the-reader',
      content:
        'Great reading software should feel invisible while you are immersed in a paragraph, yet immediately responsive when you want to search, bookmark, or join the conversation.\n\nThat balance is why floating Dynamic Island navigation works so well for modern publishing platforms. Instead of pinning heavy toolbars across the entire top edge of the screen, a compact pill adapts to what you are doing: browsing the home feed, searching topics, or tracking your reading progress inside a long-form essay.\n\nPaired with frosted-glass buttons and warm paper-toned surfaces, the interface stays tactile and modern without competing with the words on the page.',
      coverImage: '',
      media: [],
      tags: ['design', 'technology', 'ux'],
      author: marcusId,
      likes: [elenaId],
      commentsCount: 0,
      readTimeMinutes: 2,
      views: 8,
      published: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await commentsCol.insertOne({
    article: articleRes.insertedIds[0],
    author: marcusId,
    content: 'Completely agree—direct reader relationships change how you structure every paragraph.',
    createdAt: now,
    updatedAt: now,
  });

  console.log('Seeded 2 writers, 2 articles, and 1 comment successfully.');
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
