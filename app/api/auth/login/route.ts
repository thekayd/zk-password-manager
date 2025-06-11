import { NextResponse } from 'next/server';

//dummy data for generated zk proof
const generateDummyZKProof = (username: string) => ({
  type: 'login',
  proof: '0x123...abc',
  timestamp: new Date().toISOString(),
  details: {
    circuit: 'login_circuit',
    publicInputs: [username, 'hash123'],
    witness: {
      username,
      passwordHash: 'hash123'
    },
    verification: {
      status: 'verified',
      timestamp: new Date().toISOString(),
      proofId: 'proof-123'
    }
  }
});

// this is the function to login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // this is the function to generate a dummy zk proof
    const zkProof = generateDummyZKProof(username);
    
    return NextResponse.json({
      success: true,
      sessionToken: `session-${username}-${Date.now()}`,
      originalProof: zkProof,
      verificationResult: {
        status: 'success',
        message: 'ZK Proof verified successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 