import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_.-]+$/, 'Username may only contain lowercase letters, numbers, _, ., -'],
      minlength: 3,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    bio: { type: String, trim: true, maxlength: 300, default: 'Independent writer on Inkwell.' },
    publicationName: { type: String, trim: true, maxlength: 100, default: '' },
    avatarUrl: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicProfile = function toPublicProfile(currentUserId = null) {
  const followerIds = (this.followers || []).map((id) => id.toString());
  const followingIds = (this.following || []).map((id) => id.toString());
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    bio: this.bio,
    publicationName: this.publicationName || `${this.name}'s Notes`,
    avatarUrl: this.avatarUrl,
    followersCount: followerIds.length,
    followingCount: followingIds.length,
    isFollowing: currentUserId ? followerIds.includes(currentUserId.toString()) : false,
    createdAt: this.createdAt,
  };
};

export default mongoose.models.User || mongoose.model('User', userSchema);
