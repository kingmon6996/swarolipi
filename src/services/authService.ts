const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5634";
const DEFAULT_WALLET = "0xaB526f986D85b926d37a19ea11DC0E5bfcb3630d";

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
  token?: string;
  tokenHash?: string;
  isRevoked?: boolean;
}

export const DEMO_VOTEDAO_APP: AuthRequest = {
  applicationId: "demo-votedao",
  name: "VoteDAO",
  domain: "votedao.example",
  verified: true,
  requestedPermissions: ["name", "image", "wallet", "human", "identity"],
};

export type AuthListener = () => void;

export function getEffectiveWallet(walletAddress: string | null): string {
  if (walletAddress && walletAddress.trim().length > 0) return walletAddress.toLowerCase();
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("swarolipi_wallet_address");
    if (saved && saved.trim().length > 0) return saved.toLowerCase();
  }
  return DEFAULT_WALLET.toLowerCase();
}

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

  public async syncTokensFromBackend(walletAddress: string | null): Promise<AuthorizedApp[]> {
    const effectiveWallet = getEffectiveWallet(walletAddress);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/tokens/${effectiveWallet}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tokens)) {
          const activeTokens = data.tokens.filter((t: any) => !t.is_revoked);
          const remoteApps: AuthorizedApp[] = activeTokens.map((t: any) => {
            const rawId = (t.dapp_name || "app").toLowerCase().replace(/\s+/g, "-");
            return {
              applicationId: rawId.includes("votedao") ? "demo-votedao" : rawId,
              name: t.dapp_name || "Authorized Application",
              domain: t.dapp_domain || "dapp.example.eth",
              grantedPermissions: t.scopes || ["name", "image", "wallet", "human", "identity"],
              authorizedAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
              token: t.token,
              tokenHash: t.token_hash,
              isRevoked: false,
            };
          });

          const key = `swarolipi_authorized_apps_${effectiveWallet}`;
          localStorage.setItem(key, JSON.stringify(remoteApps));
          this.notify();
          return remoteApps;
        }
      }
    } catch (e) {
      console.warn("Could not sync tokens from backend:", e);
    }
    return this.getAuthorizedApps(effectiveWallet);
  }

  public getAuthorizedApps(walletAddress: string | null): AuthorizedApp[] {
    const effectiveWallet = getEffectiveWallet(walletAddress);
    if (typeof window === "undefined") return [];
    try {
      const key = `swarolipi_authorized_apps_${effectiveWallet}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: AuthorizedApp[] = JSON.parse(saved);
        return parsed.filter((app) => !app.isRevoked);
      }
    } catch (e) {
      console.warn("Could not read authorized apps:", e);
    }
    return [];
  }

  public isAppAuthorized(walletAddress: string | null, applicationId: string): boolean {
    const apps = this.getAuthorizedApps(walletAddress);
    return apps.some((app) => app.applicationId === applicationId && !app.isRevoked);
  }

  public async authorizeAppAsync(
    walletAddress: string | null,
    request: AuthRequest
  ): Promise<AuthorizedApp | null> {
    const effectiveWallet = getEffectiveWallet(walletAddress);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: effectiveWallet,
          dapp_name: request.name,
          dapp_domain: request.domain,
          scopes: request.requestedPermissions,
        }),
      });

      const backendData = await res.json();

      const newAuth: AuthorizedApp = {
        applicationId: request.applicationId,
        name: request.name,
        domain: request.domain,
        grantedPermissions: request.requestedPermissions,
        authorizedAt: Date.now(),
        token: backendData.token || "",
        tokenHash: backendData.token_hash || "",
        isRevoked: false,
      };

      const apps = this.getAuthorizedApps(effectiveWallet);
      const existingIndex = apps.findIndex((a) => a.applicationId === request.applicationId);
      if (existingIndex >= 0) {
        apps[existingIndex] = newAuth;
      } else {
        apps.push(newAuth);
      }

      const key = `swarolipi_authorized_apps_${effectiveWallet}`;
      localStorage.setItem(key, JSON.stringify(apps));
      this.notify();

      return newAuth;
    } catch (e) {
      console.error("Backend authorization error, falling back to local:", e);
      return this.authorizeApp(effectiveWallet, request);
    }
  }

  public authorizeApp(walletAddress: string | null, request: AuthRequest): AuthorizedApp | null {
    const effectiveWallet = getEffectiveWallet(walletAddress);
    if (typeof window === "undefined") return null;

    const apps = this.getAuthorizedApps(effectiveWallet);
    const existingIndex = apps.findIndex((a) => a.applicationId === request.applicationId);

    const newAuth: AuthorizedApp = {
      applicationId: request.applicationId,
      name: request.name,
      domain: request.domain,
      grantedPermissions: request.requestedPermissions,
      authorizedAt: Date.now(),
      isRevoked: false,
    };

    if (existingIndex >= 0) {
      apps[existingIndex] = newAuth;
    } else {
      apps.push(newAuth);
    }

    try {
      const key = `swarolipi_authorized_apps_${effectiveWallet}`;
      localStorage.setItem(key, JSON.stringify(apps));
      this.notify();
    } catch (e) {
      console.warn("Could not save authorized app:", e);
    }

    this.authorizeAppAsync(effectiveWallet, request).catch(() => {});

    return newAuth;
  }

  public async revokeAppAsync(walletAddress: string | null, applicationId: string) {
    const effectiveWallet = getEffectiveWallet(walletAddress);

    // 1. Extract target token & details BEFORE modifying local storage
    const existingApps = this.getAuthorizedApps(effectiveWallet);
    const targetApp = existingApps.find(
      (a) =>
        a.applicationId === applicationId ||
        a.applicationId.toLowerCase() === applicationId.toLowerCase() ||
        a.name.toLowerCase() === applicationId.toLowerCase()
    );

    const targetToken = targetApp?.token || "";
    const targetName = targetApp?.name || applicationId;

    // 2. Immediately update local storage and notify React UI
    this.revokeApp(effectiveWallet, applicationId);

    // 3. Call backend POST /auth/revoke passing exact token & name (matching test/app.js)
    try {
      await fetch(`${BACKEND_URL}/auth/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: effectiveWallet,
          token: targetToken,
          dapp_name: targetName,
          applicationId: applicationId,
        }),
      });

      // 4. Re-sync with backend to guarantee database consistency
      await this.syncTokensFromBackend(effectiveWallet);
    } catch (e) {
      console.error("Backend revoke error:", e);
    }
  }

  public revokeApp(walletAddress: string | null, applicationId: string) {
    const effectiveWallet = getEffectiveWallet(walletAddress);
    if (typeof window === "undefined") return;

    const key = `swarolipi_authorized_apps_${effectiveWallet}`;
    const saved = localStorage.getItem(key);
    let apps: AuthorizedApp[] = [];
    if (saved) {
      try {
        apps = JSON.parse(saved);
      } catch (e) {}
    }

    const filtered = apps.filter(
      (a) =>
        a.applicationId !== applicationId &&
        a.applicationId.toLowerCase() !== applicationId.toLowerCase() &&
        a.name.toLowerCase() !== applicationId.toLowerCase()
    );

    try {
      localStorage.setItem(key, JSON.stringify(filtered));
      this.notify();
    } catch (e) {
      console.warn("Could not revoke app:", e);
    }
  }

  public async fetchThirdPartyScopeData(token: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    } catch (e) {
      console.error("Error fetching scope data:", e);
      return { success: false, error: String(e) };
    }
  }
}

export const authService = new AuthService();
