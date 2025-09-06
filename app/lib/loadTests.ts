// This is a simple load testing system to test system performance under load

import { generateProof, generateChallenge } from "./zkp";
import { generateShares, reconstructSecret } from "./shamir";

interface LoadTestResult {
  test: string;
  operations: number;
  time: number;
  avgTime: number;
  success: boolean;
}

// this tests the zkp system
export async function zkpLoadTest(
  operations: number = 100
): Promise<LoadTestResult> {
  const start = performance.now();
  let success = true;

  try {
    for (let i = 0; i < operations; i++) {
      const password = `password${i}`;
      const challenge = generateChallenge();
      await generateProof(password, challenge);
    }
  } catch (error) {
    success = false;
    console.error("ZKP Load Test Error:", error);
  }

  const time = performance.now() - start;
  const avgTime = time / operations;

  return {
    test: "ZKP Load Test",
    operations,
    time,
    avgTime,
    success,
  };
}

// this tests the shamir system
export async function shamirLoadTest(
  operations: number = 50
): Promise<LoadTestResult> {
  const start = performance.now();
  let success = true;

  try {
    for (let i = 0; i < operations; i++) {
      const secret = `secret${i}`;
      const config = { totalShares: 5, requiredShares: 3 };
      const shares = generateShares(secret, config);
      reconstructSecret(shares.slice(0, 3));
    }
  } catch (error) {
    success = false;
    console.error("Shamir Load Test Error:", error);
  }

  const time = performance.now() - start;
  const avgTime = time / operations;

  return {
    test: "Shamir Load Test",
    operations,
    time,
    avgTime,
    success,
  };
}

// this tests the mixed system
export async function mixedLoadTest(
  operations: number = 75
): Promise<LoadTestResult> {
  const start = performance.now();
  let success = true;

  try {
    for (let i = 0; i < operations; i++) {
      if (i % 2 === 0) {
        // ZKP operation
        const password = `password${i}`;
        const challenge = generateChallenge();
        await generateProof(password, challenge);
      } else {
        const secret = `secret${i}`;
        const config = { totalShares: 5, requiredShares: 3 };
        const shares = generateShares(secret, config);
        reconstructSecret(shares.slice(0, 3));
      }
    }
  } catch (error) {
    success = false;
    console.error("Mixed Load Test Error:", error);
  }

  const time = performance.now() - start;
  const avgTime = time / operations;

  return {
    test: "Mixed Load Test",
    operations,
    time,
    avgTime,
    success,
  };
}

// this runs all the load tests
export async function runLoadTests(): Promise<LoadTestResult[]> {
  console.log("Running Load Tests...\n");

  const results = await Promise.all([
    zkpLoadTest(100),
    shamirLoadTest(50),
    mixedLoadTest(75),
  ]);

  //
  results.forEach((result) => {
    console.log(`${result.test}:`);
    console.log(`  Operations: ${result.operations}`);
    console.log(`  Total Time: ${result.time.toFixed(2)}ms`);
    console.log(`  Avg Time: ${result.avgTime.toFixed(2)}ms`);
    console.log(`  Success: ${result.success ? "PASS" : "FAIL"}`);
    console.log("");
  });

  return results;
}
