import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  return NextResponse.json({ valid: false, productId: body.productId ?? '' });
}
