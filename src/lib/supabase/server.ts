import { createServerClient } from '@supabase/ssr';
import { type NextRequest, type NextResponse } from 'next/server';

/**
 * Supabase client for route handlers: reads cookies from the incoming request
 * and writes session cookies on the given response (required for PKCE exchange).
 */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
