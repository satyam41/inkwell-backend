import jwt from 'jsonwebtoken';
import User from '../models/User';
import { connectDB } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'inkwell_dev_secret';

export function signToken(userId) {
  return jwt.sign({ id: userId.toString() }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id);
    return user || null;
  } catch {
    return null;
  }
}

export function formatAuthUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    publicationName: user.publicationName || `${user.name}'s Notes`,
    avatarUrl: user.avatarUrl,
    followersCount: (user.followers || []).length,
    followingCount: (user.following || []).length,
    following: (user.following || []).map((id) => id.toString()),
    createdAt: user.createdAt,
  };
}
