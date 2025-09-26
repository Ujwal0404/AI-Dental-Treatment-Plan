import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GROQ_API_KEY;
  const visible = typeof key === 'string' && key.length > 0;
  // Log masked for debugging
  console.log('GROQ_API_KEY present on server:', visible ? `yes (len=${key?.length})` : 'no');
  return NextResponse.json({ present: visible, length: key ? key.length : 0 });
}


