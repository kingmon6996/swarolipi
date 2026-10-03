export interface UserProfile {
  id?: number;
  walletAddress: string;
  name: string;
  avatarUrl: string | null;
  walletProvider?: string | null;
  chain?: string | null;
  bio?: string | null;
  initialized: boolean;
  walletVerified: boolean;
  humanVerified: boolean;
  humanVerifiedAt: number | null;
  identityVerified: boolean;
  identityCountry: string | null;
  identityDocumentType: string | null;
  identityDocumentHash: string | null;
  identityVerifiedAt: number | null;
  createdAt: number;
}

export type ProfileListener = (profile: UserProfile | null) => void;

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5634";

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

  public loadOrCreateProfile(walletAddress: string, provider?: string, chain?: string): UserProfile {
    const address = (walletAddress || "").toLowerCase();
    this.activeAddress = address;
    const storageKey = `swarolipi_profile_${address}`;

    let localProfile: UserProfile | null = null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        localProfile = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read profile from storage:", e);
    }

    if (!localProfile) {
      const initialName = this.getRandomName(address);
      localProfile = {
        walletAddress: walletAddress || "",
        name: initialName,
        avatarUrl: null,
        walletProvider: provider || null,
        chain: chain || null,
        initialized: true,
        walletVerified: true,
        humanVerified: false,
        humanVerifiedAt: null,
        identityVerified: false,
        identityCountry: null,
        identityDocumentType: null,
        identityDocumentHash: null,
        identityVerifiedAt: null,
        createdAt: Date.now(),
      };
      this.isNewConnectionFlag = true;
    } else {
      if (provider) localProfile.walletProvider = provider;
      if (chain) localProfile.chain = chain;
    }

    this.currentProfile = localProfile;
    this.saveProfile(localProfile);
    this.notify();

    // Trigger backend connection to insert/update SQLModel Postgres 'profile' table
    this.syncConnectWithBackend(walletAddress, provider, chain, localProfile);

    return localProfile;
  }

  private async syncConnectWithBackend(
    walletAddress: string,
    provider?: string,
    chain?: string,
    localProfile?: UserProfile
  ) {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: walletAddress,
          wallet_provider: provider || localProfile?.walletProvider,
          chain: chain || localProfile?.chain,
          display_name: localProfile?.name,
          avatar_url: localProfile?.avatarUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const dbProf = data.profile;
          const merged: UserProfile = {
            id: dbProf.id,
            walletAddress: dbProf.wallet_address,
            name: dbProf.display_name || localProfile?.name || this.getRandomName(walletAddress),
            avatarUrl: dbProf.avatar_url || localProfile?.avatarUrl || null,
            walletProvider: dbProf.wallet_provider || provider || null,
            chain: dbProf.chain || chain || null,
            bio: dbProf.bio || null,
            initialized: true,
            walletVerified: Boolean(dbProf.wallet_verified),
            humanVerified: Boolean(dbProf.human_verified),
            humanVerifiedAt: dbProf.human_verified_at ? new Date(dbProf.human_verified_at).getTime() : localProfile?.humanVerifiedAt || null,
            identityVerified: Boolean(dbProf.identity_verified),
            identityCountry: dbProf.identity_country || localProfile?.identityCountry || null,
            identityDocumentType: dbProf.identity_document_type || localProfile?.identityDocumentType || null,
            identityDocumentHash: dbProf.identity_document_hash || localProfile?.identityDocumentHash || null,
            identityVerifiedAt: dbProf.identity_verified_at ? new Date(dbProf.identity_verified_at).getTime() : localProfile?.identityVerifiedAt || null,
            createdAt: dbProf.created_at ? new Date(dbProf.created_at).getTime() : localProfile?.createdAt || Date.now(),
          };

          if (data.is_new) {
            this.isNewConnectionFlag = true;
          }

          this.currentProfile = merged;
          this.saveProfile(merged);
          this.notify();
        }
      }
    } catch (err) {
      console.warn("[ProfileService] Backend connect sync offline/skipped:", err);
    }
  }

  private async syncUpdateWithBackend(walletAddress: string, updates: Record<string, any>) {
    try {
      await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(walletAddress)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn("[ProfileService] Backend update sync offline/skipped:", err);
    }
  }

  public updateProfile(updates: Partial<Pick<UserProfile, "name" | "avatarUrl" | "bio">>): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const updated: UserProfile = {
      ...this.currentProfile,
      ...updates,
    };

    this.currentProfile = updated;
    this.isNewConnectionFlag = false;
    this.saveProfile(updated);
    this.notify();

    this.syncUpdateWithBackend(this.activeAddress, {
      display_name: updates.name,
      avatar_url: updates.avatarUrl,
      bio: updates.bio,
    });

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

    this.syncUpdateWithBackend(this.activeAddress, {
      human_verified: true,
    });

    return updated;
  }

  public completeIdentityVerification(country: string, documentType: string, documentHash?: string): UserProfile | null {
    if (!this.currentProfile || !this.activeAddress) return null;

    const hash = documentHash || null;
    const updated: UserProfile = {
      ...this.currentProfile,
      identityVerified: true,
      identityCountry: country,
      identityDocumentType: documentType,
      identityDocumentHash: hash,
      identityVerifiedAt: Date.now(),
    };

    this.currentProfile = updated;
    this.saveProfile(updated);
    this.notify();

    this.syncUpdateWithBackend(this.activeAddress, {
      identity_verified: true,
      identity_country: country,
      identity_document_type: documentType,
      identity_document_hash: hash,
    });

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
      identityDocumentHash: null,
      identityVerifiedAt: null,
    };

    this.currentProfile = updated;
    this.saveProfile(updated);
    this.notify();

    this.syncUpdateWithBackend(this.activeAddress, {
      human_verified: false,
      identity_verified: false,
      identity_country: null,
      identity_document_type: null,
      identity_document_hash: null,
    });

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
      const key = `swarolipi_profile_${profile.walletAddress.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.warn("Could not save profile:", e);
    }
  }
}

export const profileService = new ProfileService();
