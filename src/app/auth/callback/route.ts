import { NextRequest } from 'next/server';
import { completeAuthCallback } from '@/lib/auth/completeAuthCallback';

export async function GET(request: NextRequest) {
  return completeAuthCallback(request);
}
