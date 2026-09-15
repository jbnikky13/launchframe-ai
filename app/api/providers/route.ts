import { NextResponse } from 'next/server';
import { getProviderCapabilities } from '@/lib/providers';

export async function GET() {
  return NextResponse.json({ providers: getProviderCapabilities() });
}
