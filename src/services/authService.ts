export type PermissionType = "name" | "image" | "wallet" | "human" | "identity";

export interface AuthRequest {
  applicationId: string;
  name: string;
  domain: string;
  logo?: string;
  verified: boolean;
  requestedPermissions: PermissionType[];
}

export interface AuthorizedApp {
  applicationId: string;
  name: string;
  domain: string;
  grantedPermissions: PermissionType[];
  authorizedAt: number;
}

export const DEMO_VOTEDAO_APP: AuthRequest = {
  applicationId: "demo-votedao",
  name: "VoteDAO",
  domain: "votedao.example",
  verified: true,
  requestedPermissions: ["name", "image", "wallet", "human", "identity"],
};

export type AuthListener = () => void;

class AuthService {
  private listeners: Set<AuthListener> = new Set();

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getAuthorizedApps(walletAddress: string | null): AuthorizedApp[] {
    if (!walletAddress || typeof window === "undefined") return [];
    try {
      const key = `voxauth_authorized_apps_${walletAddress.toLowerCase()}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read authorized apps:", e);
    }
    return [];
  }

  public isAppAuthorized(walletAddress: string | null, applicationId: string): boolean {
    const apps = this.getAuthorizedApps(walletAddress);
    return apps.some((app) => app.applicationId === applicationId);
  }

  public authorizeApp(walletAddress: string | null, request: AuthRequest): AuthorizedApp | null {
    if (!walletAddress || typeof window === "undefined") return null;

    const apps = this.getAuthorizedApps(walletAddress);
    const existingIndex = apps.findIndex((a) => a.applicationId === request.applicationId);

    const newAuth: AuthorizedApp = {
      applicationId: request.applicationId,
      name: request.name,
      domain: request.domain,
      grantedPermissions: request.requestedPermissions,
      authorizedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      apps[existingIndex] = newAuth;
    } else {
      apps.push(newAuth);
    }

    try {
      const key = `voxauth_authorized_apps_${walletAddress.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(apps));
      this.notify();
    } catch (e) {
      console.warn("Could not save authorized app:", e);
    }

    return newAuth;
  }

  public revokeApp(walletAddress: string | null, applicationId: string) {
    if (!walletAddress || typeof window === "undefined") return;

    const apps = this.getAuthorizedApps(walletAddress);
    const filtered = apps.filter((a) => a.applicationId !== applicationId);

    try {
      const key = `voxauth_authorized_apps_${walletAddress.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(filtered));
      this.notify();
    } catch (e) {
      console.warn("Could not revoke app:", e);
    }
  }
}

export const authService = new AuthService();
