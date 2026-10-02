export interface UserProfile {
  walletAddress: string;
  name: string;
  avatarUrl: string | null;
  initialized: boolean;
  walletVerified: boolean;
  humanVerified: boolean;
  humanVerifiedAt: number | null;
  identityVerified: boolean;
  identityCountry: string | null;
  identityDocumentType: string | null;
  identityVerifiedAt: number | null;
  createdAt: number;
}

export type ProfileListener = (profile: UserProfile | null) => void;

const RANDOM_NAMES = [
  "Silent Falcon",
  "Emerald Fox",
  "Lunar Cedar",
  "Green Nova",
  "Golden Sparrow",
  "Quiet Orbit",
  "Astral Heron",
  "Solar Lynx",
  "Cosmic Osprey",
  "Velvet Lynx",
  "Cipher Willow",
  "Radiant Beacon",
];

class ProfileService {
  private activeAddress: string | null = null;
  private currentProfile: UserProfile | null = null;
  private listeners: Set<ProfileListener> = new Set();
  private isNewConnectionFlag: boolean = false;

  public subscribe(listener: ProfileListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProfile);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentProfile));
  }

  public getRandomName(address?: string): string {
    if (address) {
      let hash = 0;
      for (let i = 0; i < address.length; i++) {
        hash = address.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % RANDOM_NAMES.length;
      return RANDOM_NAMES[index] || "Silent Falcon";
    }
    const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
    return RANDOM_NAMES[randomIndex] || "Silent Falcon";
  }

  public loadOrCreateProfile(walletAddress: string): UserProfile {
    const address = (walletAddress || "").toLowerCase();
    this.activeAddress = address;
    const storageKey = `voxauth_profile_${address}`;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        this.currentProfile = parsed;
        this.isNewConnectionFlag = false;
        this.notify();
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read profile from storage:", e);
    }

    const initialName = this.getRandomName(address);
    const newProfile: UserProfile = {
      walletAddress: walletAddress || "",
      name: initialName,
      avatarUrl: null,
      initialized: true,
      walletVerified: true,
      humanVerified: false,
      humanVerifiedAt: null,
      identityVerified: false,
      identityCountry: null,
      identityDocumentType: null,
      identityVerifiedAt: null,
      createdAt: Date.now(),
    };

    this.currentProfile = newProfile;
    this.isNewConnectionFlag = true;
    this.saveProfile(newProfile);
    this.notify();
    return newProfile;
  }

  public updateProfile(updates: Partial<Pick<UserProfile, "name" | "avatarUrl">>): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const updated: UserProfile = {
      ...this.currentProfile,
      ...updates,
    };

    this.currentProfile = updated;
    this.isNewConnectionFlag = false;
    this.saveProfile(updated);
    this.notify();
    return updated;
  }

  public completeHumanVerification(): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const updated: UserProfile = {
      ...this.currentProfile,
      humanVerified: true,
      humanVerifiedAt: Date.now(),
    };

    this.currentProfile = updated;
    this.saveProfile(updated);
    this.notify();
    return updated;
  }

  public completeIdentityVerification(country: string, documentType: string): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const updated: UserProfile = {
      ...this.currentProfile,
      identityVerified: true,
      identityCountry: country,
      identityDocumentType: documentType,
      identityVerifiedAt: Date.now(),
    };

    this.currentProfile = updated;
    this.saveProfile(updated);
    this.notify();
    return updated;
  }

  public resetVerifications(): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const updated: UserProfile = {
      ...this.currentProfile,
      humanVerified: false,
      humanVerifiedAt: null,
      identityVerified: false,
      identityCountry: null,
      identityDocumentType: null,
      identityVerifiedAt: null,
    };

    this.currentProfile = updated;
    this.saveProfile(updated);
    this.notify();
    return updated;
  }

  public clearActiveProfile() {
    this.activeAddress = null;
    this.currentProfile = null;
    this.isNewConnectionFlag = false;
    this.notify();
  }

  public isNewConnection(): boolean {
    return this.isNewConnectionFlag;
  }

  public dismissWelcomeBanner() {
    this.isNewConnectionFlag = false;
  }

  private saveProfile(profile: UserProfile) {
    if (typeof window === "undefined" || !profile.walletAddress) return;
    try {
      const key = `voxauth_profile_${profile.walletAddress.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.warn("Could not save profile:", e);
    }
  }
}

export const profileService = new ProfileService();
