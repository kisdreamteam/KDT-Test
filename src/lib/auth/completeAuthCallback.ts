import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';

const DEFAULT_NEXT = '/reset-password';

function getSafeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_NEXT;
  }
  return value;
}

export async function completeAuthCallback(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeNextPath(searchParams.get('next'));

  const errResponse = () =>
    NextResponse.redirect(new URL('/forgot-password?error=auth', origin));

  if (!code) {
    return errResponse();
  }

  const successRedirect = NextResponse.redirect(new URL(next, origin));
  const supabase = createSupabaseRouteHandlerClient(request, successRedirect);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return errResponse();
  }

  return successRedirect;
}
