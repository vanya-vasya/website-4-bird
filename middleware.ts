import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Clerk temporarily disabled — pass-through all requests
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};