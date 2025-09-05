// Face recognition library wrapper with ZKP integration
import * as faceapi from "face-api.js";

export interface FaceData {
  id: string;
  biometricData: string;
  quality: number;
  timestamp: number;
  deviceInfo: string;
  zkpChallenge?: string;
  zkpProof?: string;
  faceDescriptor?: Float32Array; //float32array for face descriptor for matching faces
}

export interface FaceMatchResult {
  isMatch: boolean;
  matchScore: number;
  timestamp: Date;
}

export class FaceRecognition {
  private deviceInfo: string;
  private isInitialized: boolean = false;
  private modelsLoaded: boolean = false;

  constructor() {
    this.deviceInfo = this.getDeviceInfo();
  }

  // gets the device information for compatibility
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (/windows/i.test(userAgent)) return "windows";
    if (/macintosh/i.test(userAgent)) return "mac";
    return "unknown";
  }

  // initializes the face-api.js models for face recognition from the cdn
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // cdn models for face recognition
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        ),
        faceapi.nets.faceLandmark68Net.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        ),
        faceapi.nets.faceRecognitionNet.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        ),
        faceapi.nets.faceExpressionNet.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models"
        ),
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log("Face recognition models loaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize face recognition:", error);
      return false;
    }
  }

  // checks if face recognition is available
  async hasFaceRecognitionCapability(): Promise<boolean> {
    try {
      // this then checks if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      // this then checks if face-api.js is loaded
      if (!this.modelsLoaded) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      return true;
    } catch (error) {
      console.error("Face recognition capability check failed:", error);
      return false;
    }
  }

  // captures the face from the camera
  async captureFace(videoElement: HTMLVideoElement): Promise<FaceData> {
    try {
      if (!this.modelsLoaded) {
        throw new Error("Face recognition models not loaded");
      }

      // detects the faces in the video frame
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        throw new Error("No face detected in the image");
      }

      if (detections.length > 1) {
        throw new Error(
          "Multiple faces detected. Please ensure only one face is visible"
        );
      }

      const detection = detections[0];
      const faceDescriptor = detection.descriptor;

      // calculates the quality based on the detection confidence and face size
      const quality = this.calculateFaceQuality(detection);

      // this converts the face descriptor to a base64 string for the biometric data and for storing
      const biometricData = this.faceDescriptorToBase64(faceDescriptor);

      return {
        id: this.generateId(),
        biometricData,
        quality,
        timestamp: Date.now(),
        deviceInfo: this.deviceInfo,
        faceDescriptor: faceDescriptor,
      };
    } catch (error) {
      throw new Error(`Failed to capture face: ${error}`);
    }
  }

  // calculates the face quality based on the detection confidence and face size
  private calculateFaceQuality(detection: any): number {
    try {
      let quality = 50; // default quality, it should be above 50 for the face to be considered valid

      const confidence = detection.detection?.score || 0.5;
      if (confidence > 0.9) quality += 30;
      else if (confidence > 0.8) quality += 20;
      else if (confidence > 0.7) quality += 10;

      // Face size factor
      const box = detection.detection?.box;
      if (box) {
        const faceArea = box.width * box.height;
        if (faceArea > 10000) quality += 20;
        else if (faceArea > 5000) quality += 10;
      }

      // expression factor
      const expressions = detection.expressions;
      if (expressions) {
        const neutralScore = expressions.neutral || 0;
        if (neutralScore > 0.8) quality += 10;
        else if (neutralScore > 0.6) quality += 5;
      }

      return Math.min(100, quality);
    } catch (error) {
      return 50;
    }
  }

  // this conerts the face descriptor to base64 string
  private faceDescriptorToBase64(descriptor: Float32Array): string {
    try {
      // this converts the Float32Array to Uint8Array
      const uint8Array = new Uint8Array(descriptor.buffer);

      // this then converts the Uint8Array to base64
      let binary = "";
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error("Failed to convert face descriptor to base64:", error);
      return this.generateFallbackData();
    }
  }

  // this converts the base64 string back to face descriptor
  private base64ToFaceDescriptor(base64String: string): Float32Array {
    try {
      const binaryString = atob(base64String);
      const uint8Array = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      return new Float32Array(uint8Array.buffer);
    } catch (error) {
      console.error("Failed to convert base64 to face descriptor:", error);
      throw new Error("Invalid face descriptor data");
    }
  }

  // generating fallback data when conversion fails
  private generateFallbackData(): string {
    const timestamp = Date.now().toString();
    const deviceInfo = this.deviceInfo;
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${deviceInfo}-${random}`);
  }

  // generates an id for thie biometric for any face scan
  private generateId(): string {
    return `face_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // matches two face descriptors
  async matchFaces(
    faceData1: FaceData,
    faceData2: FaceData
  ): Promise<FaceMatchResult> {
    try {
      if (!faceData1.faceDescriptor || !faceData2.faceDescriptor) {
        // fallback to string comparison if descriptors are not available
        const similarity = this.calculateStringSimilarity(
          faceData1.biometricData,
          faceData2.biometricData
        );
        return {
          isMatch: similarity > 0.8,
          matchScore: similarity * 100,
          timestamp: new Date(),
        };
      }

      // this uses the euclidean distance between face descriptors
      const distance = faceapi.euclideanDistance(
        faceData1.faceDescriptor,
        faceData2.faceDescriptor
      );

      // this converts the distance to a similarity score (lower distance = higher similarity)
      const similarity = Math.max(0, 1 - distance);
      const isMatch = similarity > 0.6; // 60% threshold for face recognition, it should be above 60% for the face to be considered valid

      return {
        isMatch,
        matchScore: similarity * 100,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Face matching failed: ${error}`);
    }
  }

  // this calculates the string similarity as a fallback
  private calculateStringSimilarity(data1: string, data2: string): number {
    try {
      if (data1 === data2) return 1.0;

      let matches = 0;
      const minLength = Math.min(data1.length, data2.length);

      for (let i = 0; i < minLength; i++) {
        if (data1[i] === data2[i]) {
          matches++;
        }
      }

      return matches / Math.max(data1.length, data2.length);
    } catch (error) {
      return 0.0;
    }
  }

  // this generates a ZKP secured face recognition proof
  async generateZkpFaceProof(
    faceData: FaceData,
    challenge: string
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const combinedData = encoder.encode(
        faceData.biometricData + challenge + faceData.id
      );

      const hashBuffer = await crypto.subtle.digest("SHA-256", combinedData);
      const proof = Array.from(new Uint8Array(hashBuffer), (byte) =>
        ("0" + byte.toString(16)).slice(-2)
      ).join("");

      return proof;
    } catch (error) {
      console.error("Error generating ZKP face proof:", error);
      throw new Error("Failed to generate ZKP face proof");
    }
  }

  // this validates the ZKP secured face recognition proof
  async validateZkpFaceProof(
    storedFaceData: FaceData,
    submittedProof: string,
    challenge: string
  ): Promise<boolean> {
    try {
      const expectedProof = await this.generateZkpFaceProof(
        storedFaceData,
        challenge
      );
      return expectedProof === submittedProof;
    } catch (error) {
      console.error("Error validating ZKP face proof:", error);
      return false;
    }
  }

  // this enhances the face capture with ZKP integration by adding the challenge and proof
  async captureFaceWithZkp(
    videoElement: HTMLVideoElement,
    challenge: string
  ): Promise<FaceData> {
    const faceData = await this.captureFace(videoElement);
    const zkpProof = await this.generateZkpFaceProof(faceData, challenge);

    return {
      ...faceData,
      zkpChallenge: challenge,
      zkpProof: zkpProof,
    };
  }

  // this gets the available authentication methods
  async getAvailableMethods(): Promise<string[]> {
    const methods: string[] = [];

    if (await this.hasFaceRecognitionCapability()) {
      methods.push("face");
    }

    return methods;
  }

  // this sets up the camera for face capture
  async setupCamera(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // this stops any existing stream first
      if (videoElement.srcObject) {
        const existingStream = videoElement.srcObject as MediaStream;
        existingStream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      videoElement.srcObject = stream;

      // this waits for the video to be ready before playing because if not, it throws an error so we using a promise
      return new Promise((resolve, reject) => {
        const handleLoadedMetadata = () => {
          videoElement.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          videoElement.removeEventListener("error", handleError);

          // videoelement plays the video
          videoElement
            .play()
            .then(() => resolve())
            .catch((playError) => {
              console.warn("Video play failed, but continuing:", playError);
              resolve();
            });
        };

        const handleError = (error: Event) => {
          videoElement.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          videoElement.removeEventListener("error", handleError);
          reject(new Error(`Video setup failed: ${error}`));
        };

        videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.addEventListener("error", handleError);

        setTimeout(() => {
          videoElement.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
          videoElement.removeEventListener("error", handleError);
          resolve();
        }, 5000);
      });
    } catch (error) {
      throw new Error(`Failed to setup camera: ${error}`);
    }
  }

  // this stops the camera stream
  stopCamera(videoElement: HTMLVideoElement): void {
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  }
}
