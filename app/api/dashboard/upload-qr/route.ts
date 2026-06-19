import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/src/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.barbershopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  if (file.size > 3 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen debe ser menor a 3MB' }, { status: 400 });
  }

  const blob = await put(`qr-codes/${session.user.barbershopId}`, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return NextResponse.json({ url: blob.url });
}
