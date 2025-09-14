import { NextResponse } from 'next/server';

// Mocked user session for development/demo purposes.
// Toggle values here to simulate authentication/subscription states.
const MOCK_USER = {
  authenticated: true, // change to false to simulate signed-out
  subscribed: true, // change to false to simulate not subscribed
  user: {
    id: 'user_123',
    name: 'Demo User',
    email: 'demo@example.com'
  }
};

export async function GET() {
  return NextResponse.json(MOCK_USER);
}
