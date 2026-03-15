import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const _body = await request.text();
  return NextResponse.json({ received: true });
}
