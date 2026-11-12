import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
};

export async function GET(_request, { params }) {
  const uploadRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const segments = params.path || [];

  // Only serve files inside public/uploads, even if a URL contains traversal segments.
  const filePath = path.resolve(uploadRoot, ...segments);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return NextResponse.json({ success: false, message: 'Media not found.' }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return NextResponse.json({ success: false, message: 'Media not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Unable to read media.' }, { status: 500 });
  }
}
