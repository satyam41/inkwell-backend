import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ article: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
