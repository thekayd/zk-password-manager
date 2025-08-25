// Accesses device fingerprint sensor directly to get biometric data

export interface FingerprintData {
  id: string;
  biometricData: string; // This string is for biometric data from sensor
  quality: number;
  timestamp: number;
  deviceInfo: string;
}

export interface FingerprintMatchResult {
  isMatch: boolean;
  matchScore: number;
  timestamp: Date;
}

export class FingerprintReader {
  private deviceInfo: string;

  constructor() {
    this.deviceInfo = this.getDeviceInfo();
  }

  // This aligns with the constructor to get the device information
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    if (/windows/i.test(userAgent)) return "windows";
    if (/macintosh/i.test(userAgent)) return "mac";
    return "unknown";
  }

  // This then checks if such devices have fingerprint capability in their platform authentication data
  async hasFingerprintCapability(): Promise<boolean> {
    try {
      // checks with publickeycredential for various fingerprint APIs
      if (window.PublicKeyCredential) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }

      // for Windows Hello
      if (this.deviceInfo === "windows" && "WindowsHello" in window) {
        return true;
      }

      // for Mac Touch ID
      if (this.deviceInfo === "mac" && "TouchID" in window) {
        return true;
      }

      return false;
    } catch (error) {
      console.log("Fingerprint capability check failed:", error);
      return false;
    }
  }

  // This then allows for the reading of fingerprint from device sensor
  async readFingerprint(): Promise<FingerprintData> {
    try {
      // Try different methods based on device
      if (this.deviceInfo === "windows") {
        return await this.readWindowsFingerprint();
      } else if (this.deviceInfo === "mac") {
        return await this.readMacFingerprint();
      } else {
        // returnss to default webauthn processing if available
        return await this.readWebAuthnFingerprint();
      }
    } catch (error) {
      throw new Error(`Failed to read fingerprint: ${error}`);
    }
  }

  // These methods now read fingerprint from Windows device
  private async readWindowsFingerprint(): Promise<FingerprintData> {
    return new Promise((resolve, reject) => {
      try {
        // checks if windows fingerprint processor is available
        if ("WindowsHello" in window) {
          const windowsHello = (window as any).WindowsHello;

          windowsHello.requestAuthentication(async (result: any) => {
            try {
              const biometricData = this.extractBiometricData(result);
              resolve({ //captures and retuyrns data for the biometrics
                id: this.generateId(),
                biometricData,
                quality: this.calculateQuality(biometricData),
                timestamp: Date.now(),
                deviceInfo: this.deviceInfo,
              });
            } catch (error) {
              reject(error);
            }
          });
        } else {
          // fallback to to WebAuthn for Windows
          this.readWebAuthnFingerprint().then(resolve).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // This is a method like above but for Mac devices
  private async readMacFingerprint(): Promise<FingerprintData> {
    return new Promise((resolve, reject) => {
      try {
        // checks id touchid can be used
        if ("TouchID" in window) {
          const touchID = (window as any).TouchID;

          touchID.authenticate(
            "Authenticate with Touch ID",
            (success: boolean, error: any) => {
              if (success) {
                const biometricData = this.extractBiometricData({
                  success: true,
                });
                resolve({
                  id: this.generateId(),
                  biometricData,
                  quality: this.calculateQuality(biometricData),
                  timestamp: Date.now(),
                  deviceInfo: this.deviceInfo,
                });
              } else {
                reject(new Error(`Mac Touch ID error: ${error}`));
              }
            }
          );
        } else {
          this.readWebAuthnFingerprint().then(resolve).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // Webauthn fallback
  private async readWebAuthnFingerprint(): Promise<FingerprintData> {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn not supported");
      }

      // creates a webauthn challange ti a unit8array
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge); // we then get the challnage as a random 32 string 

      // authentication
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("No credential returned");
      }

      // We then get the biometric data from credential
      const biometricData = this.extractBiometricData(credential);

      return {
        id: this.generateId(),
        biometricData,
        quality: this.calculateQuality(biometricData),
        timestamp: Date.now(),
        deviceInfo: this.deviceInfo,
      };
    } catch (error) {
      throw new Error(`WebAuthn fallback failed: ${error}`);
    }
  }

  // gets biometric data from various sources for compatibility for different browsers (might just remove)
  private extractBiometricData(source: any): string {
    try {
      if (source.rawId) {
        // WebAuthn credential
        return this.arrayBufferToBase64(source.rawId);
      } else if (source.id) {
        // Credential ID
        return this.arrayBufferToBase64(source.id);
     // } else if (source.signature) {
        // Signature data
      //   return this.arrayBufferToBase64(source.signature);
      // } else if (source.authenticatorData) {
      //   // Authenticator data
      //   return this.arrayBufferToBase64(source.authenticatorData);
      // } else if (source.clientDataJSON) {
      //   // Client data
      //   return this.arrayBufferToBase64(source.clientDataJSON);
      } else {
        // generatew from timestamp and device info
        return this.generateFallbackData();
      }
    } catch (error) {
      console.log("Failed to extract biometric data, using fallback");
      return this.generateFallbackData();
    }
  }

  // Converts the arraybuffer to base64 string
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // generates fallback details when extraction fails
  private generateFallbackData(): string {
    const timestamp = Date.now().toString();
    const deviceInfo = this.deviceInfo;
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${deviceInfo}-${random}`);
  }

  // calculates quality score based on data
  private calculateQuality(biometricData: string): number {
    try {
      //  quality calculation based on data length and content
      const length = biometricData.length;
      const hasSpecialChars = /[^A-Za-z0-9+/=]/.test(biometricData);

      let quality = 50; //  starting point for quality

      // Length factor
      if (length > 100) quality += 30;
      else if (length > 50) quality += 20;
      else if (length > 20) quality += 10;

      // Content factor
      if (hasSpecialChars) quality += 20;

      return Math.min(100, quality);
    } catch (error) {
      return 50; 
    }
  }

  // generates unique ID for the fingerprint scan
  private generateId(): string {
    return `fp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  // matches the two fingerprint data sets
  async matchFingerprints(
    data1: FingerprintData,
    data2: FingerprintData
  ): Promise<FingerprintMatchResult> {
    try {
      // matching based on data similarity
      const similarity = this.calculateSimilarity(
        data1.biometricData,
        data2.biometricData
      );
      const isMatch = similarity > 0.8; // 80% threshold

      return {
        isMatch,
        matchScore: similarity * 100,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Fingerprint matching failed: ${error}`);
    }
  }

  // Calculates the similarity between two biometric data strings
  private calculateSimilarity(data1: string, data2: string): number {
    try {
      if (data1 === data2) return 1.0; // 100% match

      // character-by-character comparison for both fingerprint strings
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

  // calculates the edit distance between two strings
  // COMMENTED OUT: Using simpler character-by-character comparison instead
  /*
  private calculateSimilarsity(data1: string, data2: string): number {
    try {
      if (data1 === data2) return 1.0;
      // Simple similarity calculation
      const shorter = data1.length < data2.length ? data1 : data2;
      const longer = data1.length < data2.length ? data2 : data1;
      if (shorter.length === 0) return 0.0;
      const editDistance = this.calculateEditDistance(shorter, longer);
      return (longer.length - editDistance) / longer.length;
    } catch (error) {
      return 0.0;
    }
  }
    
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
  */

  // gets the available authentication methods (basucally for other authentication types like face recog)
  async getAvailableMethods(): Promise<string[]> {
    const methods: string[] = [];

    if (await this.hasFingerprintCapability()) {
      methods.push("fingerprint");
    }

    // adds other methods as needed
    if ("credentials" in navigator) {
      methods.push("credentials");
    }

    return methods;
  }
}
