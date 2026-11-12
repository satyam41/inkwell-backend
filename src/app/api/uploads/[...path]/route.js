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
  try {
    const segments = params.path || [];
    const safeSegments = segments.map((s) => path.basename(s));
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...safeSegments);

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Media not found.' }, { status: 404 });
  }
}