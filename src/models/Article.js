import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    caption: { type: String, trim: true, maxlength: 200, default: '' },
    originalName: { type: String, default: '' },
  },
  { _id: true }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 180 },
    subtitle: { type: String, trim: true, maxlength: 280, default: '' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true, minlength: 20 },
    coverImage: { type: String, default: '' },
    media: [mediaItemSchema],
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 32 }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    readTimeMinutes: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

articleSchema.index({ title: 'text', subtitle: 'text', content: 'text', tags: 'text' });
articleSchema.index({ createdAt: -1 });

articleSchema.pre('validate', function computeReadTime(next) {
  if (this.content) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readTimeMinutes = Math.max(1, Math.ceil(words / 220));
  }
  next();
});

export default mongoose.models.Article || mongoose.model('Article', articleSchema);
