import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  authService,
  AuthRequest,
  AuthorizedApp,
  DEMO_VOTEDAO_APP,
} from "@/services/authService";

export type { AuthRequest, AuthorizedApp };
export { DEMO_VOTEDAO_APP };

export function useAuth() {
  const { walletAddress } = useWallet();
  const [authorizedApps, setAuthorizedApps] = useState<AuthorizedApp[]>(() =>
    authService.getAuthorizedApps(walletAddress)
  );

  useEffect(() => {
    setAuthorizedApps(authService.getAuthorizedApps(walletAddress));

    const unsubscribe = authService.subscribe(() => {
      setAuthorizedApps(authService.getAuthorizedApps(walletAddress));
    });
    return unsubscribe;
  }, [walletAddress]);

  const isAuthorized = (appId: string) => authService.isAppAuthorized(walletAddress, appId);

  const authorizeApp = (request: AuthRequest) => authService.authorizeApp(walletAddress, request);

  const revokeApp = (appId: string) => authService.revokeApp(walletAddress, appId);

  return {
    authorizedApps,
    isAuthorized,
    authorizeApp,
    revokeApp,
  };
}
