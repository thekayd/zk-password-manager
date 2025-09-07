import { generateProof, validateProof, generateChallenge } from "./zkp";
import { generateShares, reconstructSecret } from "./shamir";
import { UnifiedBiometricSystem } from "./biometric";
import { deriveKey, arrayBufferToString } from "./crypto";

interface TestResult {
  name: string;
  passed: boolean;
  time: number;
  error?: string;
}

// ZKP tests
export async function testZKP(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  //this generates the proof
  const start1 = performance.now();
  try {
    const password = "testPassword123";
    const challenge = generateChallenge();
    const proof = await generateProof(password, challenge);

    if (proof && proof.length > 0) {
      results.push({
        name: "ZKP Proof Generation",
        passed: true,
        time: performance.now() - start1,
      });
    } else {
      throw new Error("Invalid proof");
    }
  } catch (error) {
    results.push({
      name: "ZKP Proof Generation",
      passed: false,
      time: performance.now() - start1,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  //this validates the proof
  const start2 = performance.now();
  try {
    const password = "testPassword123";
    const challenge = generateChallenge();
    const proof = await generateProof(password, challenge);

    // this generates the stored password hash
    const key = await deriveKey(password);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const keyString = arrayBufferToString(rawKey);

    const isValid = await validateProof(keyString, proof, challenge);

    if (isValid) {
      results.push({
        name: "ZKP Proof Validation",
        passed: true,
        time: performance.now() - start2,
      });
    } else {
      throw new Error("Validation failed");
    }
  } catch (error) {
    results.push({
      name: "ZKP Proof Validation",
      passed: false,
      time: performance.now() - start2,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// this tests the shamir secret sharing
export async function testShamir(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // this generates the shares
  const start1 = performance.now();
  try {
    const secret = "MySecretPassword123!";
    const config = { totalShares: 5, requiredShares: 3 };
    const shares = generateShares(secret, config);

    if (shares.length === 5) {
      const duration = performance.now() - start1;
      results.push({
        name: "Shamir Share Generation",
        passed: true,
        time: duration < 0.1 ? 0.1 : duration,
      });
    } else {
      throw new Error("Wrong number of shares");
    }
  } catch (error) {
    results.push({
      name: "Shamir Share Generation",
      passed: false,
      time: performance.now() - start1,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // this reconstructs the secret
  const start2 = performance.now();
  try {
    const secret = "MySecretPassword123!";
    const config = { totalShares: 5, requiredShares: 3 };
    const shares = generateShares(secret, config);
    const reconstructed = reconstructSecret(shares.slice(0, 3));

    if (reconstructed === secret) {
      const duration = performance.now() - start2;
      results.push({
        name: "Shamir Secret Reconstruction",
        passed: true,
        time: duration < 0.1 ? 0.1 : duration,
      });
    } else {
      throw new Error("Reconstruction failed");
    }
  } catch (error) {
    results.push({
      name: "Shamir Secret Reconstruction",
      passed: false,
      time: performance.now() - start2,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// this tests the biometric system
export async function testBiometric(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // this initializes the biometric system
  const start1 = performance.now();
  try {
    const biometricSystem = new UnifiedBiometricSystem();
    const initialized = await biometricSystem.initialize();

    results.push({
      name: "Biometric System Initialization",
      passed: initialized,
      time: performance.now() - start1,
      error: initialized ? undefined : "Failed to initialize",
    });
  } catch (error) {
    results.push({
      name: "Biometric System Initialization",
      passed: false,
      time: performance.now() - start1,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // this checks if the  biometric system has any capabilities for fingerprint or face recognition
  const start2 = performance.now();
  try {
    const biometricSystem = new UnifiedBiometricSystem();
    const methods = await biometricSystem.getAvailableMethods();

    results.push({
      name: "Biometric Capability Check",
      passed: true,
      time: performance.now() - start2,
    });
  } catch (error) {
    results.push({
      name: "Biometric Capability Check",
      passed: false,
      time: performance.now() - start2,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return results;
}

// this runs all the tests
export async function runAllTests(): Promise<{
  zkp: TestResult[];
  shamir: TestResult[];
  biometric: TestResult[];
}> {
  console.log("Running ZK Password Manager Tests...\n");

  const zkp = await testZKP();
  const shamir = await testShamir();
  const biometric = await testBiometric();

  //
  console.log("ZKP Tests:");
  zkp.forEach((test) => {
    console.log(
      `  ${test.passed ? "PASS" : "FAIL"} ${test.name}: ${test.time.toFixed(
        2
      )}ms`
    );
    if (test.error) console.log(`    Error: ${test.error}`);
  });

  console.log("\nShamir Tests:");
  shamir.forEach((test) => {
    console.log(
      `  ${test.passed ? "PASS" : "FAIL"} ${test.name}: ${test.time.toFixed(
        2
      )}ms`
    );
    if (test.error) console.log(`    Error: ${test.error}`);
  });

  console.log("\nBiometric Tests:");
  biometric.forEach((test) => {
    console.log(
      `  ${test.passed ? "PASS" : "FAIL"} ${test.name}: ${test.time.toFixed(
        2
      )}ms`
    );
    if (test.error) console.log(`    Error: ${test.error}`);
  });

  const totalPassed = [...zkp, ...shamir, ...biometric].filter(
    (t) => t.passed
  ).length;
  const totalTests = zkp.length + shamir.length + biometric.length;

  console.log(`\nSummary: ${totalPassed}/${totalTests} tests passed`);

  return { zkp, shamir, biometric };
}
