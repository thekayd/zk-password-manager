// this is the mock database that persists between API calls 
export const mockDb = {
  users: {} as { [key: string]: any },
  vaults: {} as { [key: string]: any[] },
  activityLogs: {} as { [key: string]: any[] },
  recoveryShares: {} as { [key: string]: any[] },
};

// this is the function to generate a mock ZK proof
export function generateZKProof(username: string, password: string) {
  const timestamp = new Date().toISOString();
  const proofId = Math.random().toString(36).substring(7);
  
  return {
    type: 'zk-snark',
    proof: `mock_zk_proof_${proofId}`,
    timestamp,
    details: {
      circuit: 'password_verification',
      publicInputs: [
        `username_hash_${username}`,
        `password_hash_${password}`,
      ],
      witness: {
        username,
        passwordHash: `hash_${password}`,
      },
      verification: {
        status: 'verified',
        timestamp,
        proofId,
      },
    },
  };
}

console.log(generateZKProof('testuser', 'testpassword'));
// this is the function to verify a zk proof
export function verifyZKProof(username: string, password: string) {
  const timestamp = new Date().toISOString();
  const proofId = Math.random().toString(36).substring(7);
  
  return {
    success: true,
    proof: {
      type: 'zk-snark',
      verification: 'verified',
      timestamp,
      details: {
        circuit: 'password_verification',
        publicInputs: [
          `username_hash_${username}`,
          `password_hash_${password}`,
        ],
        proof: `mock_zk_proof_${proofId}`,
        verification: {
          status: 'verified',
          timestamp,
          proofId,
        },
      },
    },
  };
}

console.log(verifyZKProof('testuser', 'testpassword'));
// this is the function to log activity
export function logActivity(username: string, action: string, details: any = {}) {
  if (!mockDb.activityLogs[username]) {
    mockDb.activityLogs[username] = [];
  }

  mockDb.activityLogs[username].push({
    timestamp: new Date().toISOString(),
    action,
    details,
  });
}


export function generateRecoveryShares(username: string, password: string) {
 // this is the function to generate recovery shares for shamir's secret sharing
 //placeholdeer dummy shares
  const shares = [
    `share_1_${username}_${Math.random().toString(36).substring(7)}`,
    `share_2_${username}_${Math.random().toString(36).substring(7)}`,
    `share_3_${username}_${Math.random().toString(36).substring(7)}`,
  ];

  mockDb.recoveryShares[username] = shares;
  return shares;
}

// this is the function to verify recovery shares
export function verifyRecoveryShares(username: string, shares: string[]) {
  const storedShares = mockDb.recoveryShares[username];
  if (!storedShares) return false;

  // this is the function to reconstruct the secret from shares
  return shares.every(share => storedShares.includes(share));
} 