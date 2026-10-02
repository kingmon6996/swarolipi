import { useEffect, useState } from "react";
import {
  walletService,
  ProviderId,
  WalletState,
  ConnectionStatus,
} from "@/services/walletService";

export type { ProviderId, ConnectionStatus, WalletState };

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => walletService.getState());

  useEffect(() => {
    // Subscribe to state changes from walletService
    const unsubscribe = walletService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    walletProvider: state.walletProvider,
    walletAddress: state.walletAddress,
    chain: state.chain,
    connectionStatus: state.connectionStatus,
    error: state.error,
    isConnected: state.connectionStatus === "connected",
    isConnecting: state.connectionStatus === "connecting",
    connectWallet: (providerId: ProviderId) => walletService.connectWallet(providerId),
    disconnectWallet: () => walletService.disconnectWallet(),
    getPublicAddress: () => walletService.getPublicAddress(),
    getConnectedWallet: () => walletService.getConnectedWallet(),
    isProviderInstalled: (providerId: ProviderId) => walletService.isProviderInstalled(providerId),
  };
}
