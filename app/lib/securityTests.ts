// This is a simple security testing system to test basic security checks for ZKP, Shamir, and Biometrics

import { generateProof, validateProof, generateChallenge } from "./zkp";
import { generateShares, reconstructSecret } from "./shamir";
import { deriveKey, arrayBufferToString } from "./crypto";

interface SecurityTestResult {
  test: string;
  passed: boolean;
  issue: string;
}

// this tests the zkp system
export async function testZKPSecurity(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  // checks if the challenges are unique and not repeated or the same
  try {
    const challenges = [];
    for (let i = 0; i < 100; i++) {
      challenges.push(generateChallenge());
    }
    const unique = new Set(challenges);

    if (unique.size === challenges.length) {
      results.push({
        test: "ZKP Challenge Uniqueness",
        passed: true,
        issue: "Challenges are unique",
      });
    } else {
      results.push({
        test: "ZKP Challenge Uniqueness",
        passed: false,
        issue: "Found duplicate challenges",
      });
    }
  } catch (error) {
    results.push({
      test: "ZKP Challenge Uniqueness",
      passed: false,
      issue: "Error testing challenges",
    });
  }

  // checks if the proof is valid and not tampered with
  try {
    const password = "testPassword";
    const challenge = generateChallenge();
    const proof = await generateProof(password, challenge);

    // uses the key to derive the stored password hash
    const key = await deriveKey(password);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const keyString = arrayBufferToString(rawKey);

    const isValid = await validateProof(keyString, proof, challenge);

    if (isValid) {
      results.push({
        test: "ZKP Proof Validation",
        passed: true,
        issue: "Proof validation works",
      });
    } else {
      results.push({
        test: "ZKP Proof Validation",
        passed: false,
        issue: "Proof validation failed",
      });
    }
  } catch (error) {
    results.push({
      test: "ZKP Proof Validation",
      passed: false,
      issue: "Error in proof validation",
    });
  }

  return results;
}

// this tests the shamir system
export async function testShamirSecurity(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  // checks if the shares are unique and not repeated or the same
  try {
    const secret = "TestSecret123!";
    const config = { totalShares: 5, requiredShares: 3 };
    const shares = generateShares(secret, config);
    const shareValues = shares.map((s) => s.value);
    const unique = new Set(shareValues);

    if (unique.size === shareValues.length) {
      results.push({
        test: "Shamir Share Uniqueness",
        passed: true,
        issue: "All shares are unique",
      });
    } else {
      results.push({
        test: "Shamir Share Uniqueness",
        passed: false,
        issue: "Found duplicate shares",
      });
    }
  } catch (error) {
    results.push({
      test: "Shamir Share Uniqueness",
      passed: false,
      issue: "Error testing shares",
    });
  }

  // checks if the secret is reconstructed correctly from the shares and all the shares reconstruct to the same secret
  try {
    const secret = "TestSecret123!";
    const config = { totalShares: 5, requiredShares: 3 };
    const shares = generateShares(secret, config);
    const reconstructed = reconstructSecret(shares.slice(0, 3));

    if (reconstructed === secret) {
      results.push({
        test: "Shamir Secret Reconstruction",
        passed: true,
        issue: "Secret reconstruction works",
      });
    } else {
      results.push({
        test: "Shamir Secret Reconstruction",
        passed: false,
        issue: "Secret reconstruction failed",
      });
    }
  } catch (error) {
    results.push({
      test: "Shamir Secret Reconstruction",
      passed: false,
      issue: "Error in reconstruction",
    });
  }

  // this is a test to see if the system fails with insufficient shares meaning less than 3 shares are shared less than threshold shares
  try {
    const secret = "TestSecret123!";
    const config = { totalShares: 5, requiredShares: 3 };
    const shares = generateShares(secret, config);

    try {
      reconstructSecret(shares.slice(0, 1));
      results.push({
        test: "Shamir Insufficient Shares",
        passed: false,
        issue: "Should fail with insufficient shares",
      });
    } catch (error) {
      results.push({
        test: "Shamir Insufficient Shares",
        passed: true,
        issue: "Correctly fails with insufficient shares",
      });
    }
  } catch (error) {
    results.push({
      test: "Shamir Insufficient Shares",
      passed: false,
      issue: "Error testing insufficient shares",
    });
  }

  return results;
}

// this tests the general security of the system
export async function testGeneralSecurity(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  // checks if the system rejects empty inputs
  try {
    try {
      await generateProof("", "test");
      results.push({
        test: "Input Validation",
        passed: false,
        issue: "Should reject empty password",
      });
    } catch (error) {
      results.push({
        test: "Input Validation",
        passed: true,
        issue: "Correctly rejects empty password",
      });
    }
  } catch (error) {
    results.push({
      test: "Input Validation",
      passed: false,
      issue: "Error testing input validation",
    });
  }

  return results;
}

// then finally runs all the security tests and returns the results
export async function runSecurityTests(): Promise<SecurityTestResult[]> {
  console.log("Running Security Tests...\n");

  const zkpResults = await testZKPSecurity();
  const shamirResults = await testShamirSecurity();
  const generalResults = await testGeneralSecurity();

  const allResults = [...zkpResults, ...shamirResults, ...generalResults];

  allResults.forEach((result) => {
    console.log(
      `${result.passed ? "PASS" : "FAIL"} ${result.test}: ${result.issue}`
    );
  });

  const passed = allResults.filter((r) => r.passed).length;
  console.log(
    `\nSecurity Summary: ${passed}/${allResults.length} tests passed properly`
  );

  return allResults;
}
