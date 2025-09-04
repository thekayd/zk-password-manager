// Unified biometric system supporting both fingerprint and face recognition
import { FingerprintReader, FingerprintData } from "./fingerprint";
import { FaceRecognition, FaceData } from "./faceRecognition";
import { generateChallenge } from "./zkp";

export type BiometricType = "fingerprint" | "face";

export interface UnifiedBiometricData {
  type: BiometricType;
  id: string;
  biometricData: string;
  quality: number;
  timestamp: number;
  deviceInfo: string;
  zkpChallenge?: string;
  zkpProof?: string;

  fingerprintData?: FingerprintData;
  faceData?: FaceData;
}

export interface BiometricMatchResult {
  isMatch: boolean;
  matchScore: number;
  timestamp: Date;
  type: BiometricType;
}

export class UnifiedBiometricSystem {
  private fingerprintReader: FingerprintReader;
  private faceRecognition: FaceRecognition;

  constructor() {
    this.fingerprintReader = new FingerprintReader();
    this.faceRecognition = new FaceRecognition();
  }

  // this gets all available biometric methods
  async getAvailableMethods(): Promise<BiometricType[]> {
    const methods: BiometricType[] = [];

    // checks if the device has fingerprint capability
    if (await this.fingerprintReader.hasFingerprintCapability()) {
      methods.push("fingerprint");
    }

    // checks if the device has face recognition capability
    if (await this.faceRecognition.hasFaceRecognitionCapability()) {
      methods.push("face");
    }

    return methods;
  }

  // initializes all biometric systems
  async initialize(): Promise<boolean> {
    try {
      // this then initializes the face recognition
      const faceInitialized = await this.faceRecognition.initialize();

      console.log("Biometric systems initialized:", {
        fingerprint: true,
        face: faceInitialized,
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize biometric systems:", error);
      return false;
    }
  }

  // captures the biometric data based on the type of biometric
  async captureBiometric(
    type: BiometricType,
    videoElement?: HTMLVideoElement,
    generateZkp: boolean = true
  ): Promise<UnifiedBiometricData> {
    const challenge = generateZkp ? generateChallenge() : "";

    switch (type) {
      case "fingerprint":
        const fingerprintData = generateZkp
          ? await this.fingerprintReader.readFingerprintWithZkp(challenge)
          : await this.fingerprintReader.readFingerprint();
        return {
          type: "fingerprint",
          id: fingerprintData.id,
          biometricData: fingerprintData.biometricData,
          quality: fingerprintData.quality,
          timestamp: fingerprintData.timestamp,
          deviceInfo: fingerprintData.deviceInfo,
          zkpChallenge: fingerprintData.zkpChallenge,
          zkpProof: fingerprintData.zkpProof,
          fingerprintData: fingerprintData,
        };

      case "face":
        if (!videoElement) {
          throw new Error("Video element required for face recognition");
        }
        const faceData = generateZkp
          ? await this.faceRecognition.captureFaceWithZkp(
              videoElement,
              challenge
            )
          : await this.faceRecognition.captureFace(videoElement);
        return {
          type: "face",
          id: faceData.id,
          biometricData: faceData.biometricData,
          quality: faceData.quality,
          timestamp: faceData.timestamp,
          deviceInfo: faceData.deviceInfo,
          zkpChallenge: faceData.zkpChallenge,
          zkpProof: faceData.zkpProof,
          faceData: faceData,
        };

      default:
        throw new Error(`Unsupported biometric type: ${type}`);
    }
  }

  // matches the biometric data
  async matchBiometric(
    data1: UnifiedBiometricData,
    data2: UnifiedBiometricData
  ): Promise<BiometricMatchResult> {
    if (data1.type !== data2.type) {
      throw new Error("Cannot match different biometric types");
    }

    switch (data1.type) {
      case "fingerprint":
        if (!data1.fingerprintData || !data2.fingerprintData) {
          throw new Error("Fingerprint data missing");
        }
        const fingerprintResult =
          await this.fingerprintReader.matchFingerprints(
            data1.fingerprintData,
            data2.fingerprintData
          );
        return {
          ...fingerprintResult,
          type: "fingerprint",
        };

      case "face":
        if (!data1.faceData || !data2.faceData) {
          throw new Error("Face data missing");
        }
        const faceResult = await this.faceRecognition.matchFaces(
          data1.faceData,
          data2.faceData
        );
        return {
          ...faceResult,
          type: "face",
        };

      default:
        throw new Error(`Unsupported biometric type: ${data1.type}`);
    }
  }


  async setupCamera(videoElement: HTMLVideoElement): Promise<void> {
    await this.faceRecognition.setupCamera(videoElement);
  }


  
  stopCamera(videoElement: HTMLVideoElement): void {
    this.faceRecognition.stopCamera(videoElement);
  }

  // this geenerates a ZKP proof for any biometric type
  async generateZkpProof(
    biometricData: UnifiedBiometricData,
    challenge: string
  ): Promise<string> {
    switch (biometricData.type) {
      case "fingerprint":
        if (!biometricData.fingerprintData) {
          throw new Error("Fingerprint data missing");
        }
        return await this.fingerprintReader.generateZkpBiometricProof(
          biometricData.fingerprintData,
          challenge
        );

      case "face":
        if (!biometricData.faceData) {
          throw new Error("Face data missing");
        }
        return await this.faceRecognition.generateZkpFaceProof(
          biometricData.faceData,
          challenge
        );

      default:
        throw new Error(`Unsupported biometric type: ${biometricData.type}`);
    }
  }

  // validates the ZKP proof for any biometric type
  async validateZkpProof(
    storedBiometricData: UnifiedBiometricData,
    submittedProof: string,
    challenge: string
  ): Promise<boolean> {
    switch (storedBiometricData.type) {
      case "fingerprint":
        if (!storedBiometricData.fingerprintData) {
          throw new Error("Fingerprint data missing");
        }
        return await this.fingerprintReader.validateZkpBiometricProof(
          storedBiometricData.fingerprintData,
          submittedProof,
          challenge
        );

      case "face":
        if (!storedBiometricData.faceData) {
          throw new Error("Face data missing");
        }
        return await this.faceRecognition.validateZkpFaceProof(
          storedBiometricData.faceData,
          submittedProof,
          challenge
        );

      default:
        throw new Error(
          `Unsupported biometric type: ${storedBiometricData.type}`
        );
    }
  }

  // this then gets the best available biometric method. It goes for fingerprint first, then face
  async getBestAvailableMethod(): Promise<BiometricType | null> {
    const methods = await this.getAvailableMethods();


    if (methods.includes("fingerprint")) {
      return "fingerprint";
    } else if (methods.includes("face")) {
      return "face";
    }

    return null;
  }

  //checks if system has any biometric capability
  async hasAnyBiometricCapability(): Promise<boolean> {
    const methods = await this.getAvailableMethods();
    return methods.length > 0;
  }
}
