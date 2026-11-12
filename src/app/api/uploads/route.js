import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { getAuthUser } from '../../../lib/auth';

const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEOS = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']);

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to upload images or videos.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGES.has(file.type);
    const isVideo = ALLOWED_VIDEOS.has(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, MOV.',
        },
        { status: 400 }
      );
    }

    const maxBytes = Number(process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, message: `File exceeds ${process.env.MAX_FILE_SIZE_MB || 50}MB limit.` },
        { status: 413 }
      );
    }

    const folder = isVideo ? 'videos' : 'images';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name || '').toLowerCase() || (isVideo ? '.mp4' : '.png');
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json(
      {
        success: true,
        media: {
          type: isVideo ? 'video' : 'image',
          url: `/uploads/${folder}/${filename}`,
          originalName: file.name,
          size: file.size,
          mimetype: file.type,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
