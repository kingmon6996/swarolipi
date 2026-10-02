declare global {
  interface Window {
    ethereum?: any;
    phantom?: {
      solana?: any;
    };
    solana?: any;
  }
}

export type ProviderId = "metamask" | "phantom" | "walletconnect";

export type ConnectionStatus =
  | "disconnected"
  | "not_installed"
  | "connecting"
  | "connected"
  | "rejected"
  | "error";

export interface WalletState {
  walletProvider: ProviderId | null;
  walletAddress: string | null;
  chain: string | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
}

export type WalletListener = (state: WalletState) => void;

class WalletService {
  private state: WalletState = {
    walletProvider: null,
    walletAddress: null,
    chain: null,
    connectionStatus: "disconnected",
    error: null,
  };

  private listeners: Set<WalletListener> = new Set();
  private wcProvider: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initAutoListeners();
      this.restoreSession();
    }
  }

  public getState(): WalletState {
    return { ...this.state };
  }

  public subscribe(listener: WalletListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  private setState(partial: Partial<WalletState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public isProviderInstalled(providerId: ProviderId): boolean {
    if (typeof window === "undefined") return false;

    if (providerId === "metamask") {
      const eth = window.ethereum;
      if (!eth) return false;
      if (eth.isMetaMask) return true;
      if (Array.isArray(eth.providers)) {
        return eth.providers.some((p: any) => p.isMetaMask);
      }
      return false;
    }

    if (providerId === "phantom") {
      const phantomSol = window.phantom?.solana;
      const solana = window.solana;
      return Boolean(phantomSol?.isPhantom || solana?.isPhantom);
    }

    if (providerId === "walletconnect") {
      // WalletConnect modal / QR code is always available over web protocols
      return true;
    }

    return false;
  }

  public async connectWallet(providerId: ProviderId): Promise<WalletState> {
    this.setState({
      walletProvider: providerId,
      connectionStatus: "connecting",
      error: null,
    });

    try {
      if (providerId === "metamask") {
        return await this.connectMetaMask();
      } else if (providerId === "phantom") {
        return await this.connectPhantom();
      } else if (providerId === "walletconnect") {
        return await this.connectWalletConnect();
      } else {
        throw new Error(`Unsupported provider: ${providerId}`);
      }
    } catch (err: any) {
      console.error(`[WalletService] Connection error (${providerId}):`, err);

      const errorMessage = err?.message || String(err);
      const isNotInstalled = errorMessage.includes("NOT_INSTALLED") || errorMessage.includes("not installed");
      const isUserRejected =
        err?.code === 4001 ||
        err?.code === "ACTION_REJECTED" ||
        errorMessage.toLowerCase().includes("user rejected") ||
        errorMessage.toLowerCase().includes("cancelled") ||
        errorMessage.toLowerCase().includes("closed") ||
        errorMessage.toLowerCase().includes("rejected");

      const status: ConnectionStatus = isNotInstalled
        ? "not_installed"
        : isUserRejected
          ? "rejected"
          : "error";

      this.setState({
        walletAddress: null,
        chain: null,
        connectionStatus: status,
        error: isUserRejected
          ? "Wallet connection was cancelled."
          : isNotInstalled
            ? `${providerId === "metamask" ? "MetaMask" : "Phantom"} isn't installed.`
            : errorMessage,
      });

      return this.getState();
    }
  }

  private async connectMetaMask(): Promise<WalletState> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("NOT_INSTALLED");
    }

    let ethProvider = window.ethereum;
    if (Array.isArray(window.ethereum.providers)) {
      ethProvider = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
    }

    const accounts: string[] = await ethProvider.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0 || !accounts[0]) {
      throw new Error("No accounts returned from MetaMask.");
    }

    const address: string = accounts[0];
    let chainName = "Ethereum Mainnet";
    try {
      const chainIdHex = await ethProvider.request({ method: "eth_chainId" });
      chainName = this.formatChainId(chainIdHex);
    } catch (e) {
      console.warn("Could not fetch chain ID:", e);
    }

    this.saveSession("metamask", address);

    this.setState({
      walletProvider: "metamask",
      walletAddress: address,
      chain: chainName,
      connectionStatus: "connected",
      error: null,
    });

    return this.getState();
  }

  private async connectPhantom(): Promise<WalletState> {
    if (typeof window === "undefined") {
      throw new Error("NOT_INSTALLED");
    }

    const solana = window.phantom?.solana || window.solana;
    if (!solana || !solana.isPhantom) {
      throw new Error("NOT_INSTALLED");
    }

    const response = await solana.connect();
    const pubKey = response?.publicKey || solana.publicKey;

    if (!pubKey) {
      throw new Error("No public key returned from Phantom.");
    }

    const address: string = pubKey.toString();

    this.saveSession("phantom", address);

    this.setState({
      walletProvider: "phantom",
      walletAddress: address,
      chain: "Solana Mainnet",
      connectionStatus: "connected",
      error: null,
    });

    return this.getState();
  }

  private async connectWalletConnect(): Promise<WalletState> {
    try {
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");

      const provider = await EthereumProvider.init({
        projectId: "3a7002738f2f9fe45c9285097d4ed23c",
        chains: [1],
        optionalChains: [137, 42161, 10, 8453],
        showQrModal: true,
        metadata: {
          name: "Swarolipi",
          description: "Privacy-conscious Human Verification for Web3",
          url: typeof window !== "undefined" ? window.location.origin : "https://swarolipi.app",
          icons: ["https://swarolipi.app/icon.png"],
        },
      });

      this.wcProvider = provider;
      await provider.connect();

      const accounts = provider.accounts;
      if (!accounts || accounts.length === 0 || !accounts[0]) {
        throw new Error("No accounts returned from WalletConnect.");
      }

      const address: string = accounts[0];
      const chainId = provider.chainId;
      const chainName = this.formatChainId(`0x${chainId.toString(16)}`);

      this.saveSession("walletconnect", address);

      this.setState({
        walletProvider: "walletconnect",
        walletAddress: address,
        chain: chainName,
        connectionStatus: "connected",
        error: null,
      });

      return this.getState();
    } catch (err: any) {
      if (err?.message?.includes("User closed modal") || err?.message?.includes("User rejected")) {
        throw new Error("User cancelled WalletConnect session.");
      }
      throw err;
    }
  }

  public disconnectWallet() {
    if (this.wcProvider) {
      try {
        this.wcProvider.disconnect();
      } catch (e) {
        console.warn("WalletConnect disconnect error:", e);
      }
      this.wcProvider = null;
    }

    this.clearSession();

    this.setState({
      walletProvider: null,
      walletAddress: null,
      chain: null,
      connectionStatus: "disconnected",
      error: null,
    });
  }

  public getPublicAddress(): string | null {
    return this.state.walletAddress;
  }

  public getConnectedWallet(): WalletState {
    return this.getState();
  }

  private saveSession(provider: ProviderId, address: string) {
    if (typeof window === "undefined" || !address) return;
    try {
      localStorage.setItem("swarolipi_wallet_provider", provider);
      localStorage.setItem("swarolipi_wallet_address", address);
    } catch (e) {
      console.warn("Could not save wallet session:", e);
    }
  }

  private clearSession() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("swarolipi_wallet_provider");
      localStorage.removeItem("swarolipi_wallet_address");
    } catch (e) {
      console.warn("Could not clear wallet session:", e);
    }
  }

  private restoreSession() {
    try {
      const savedProvider = localStorage.getItem("swarolipi_wallet_provider") as ProviderId | null;
      const savedAddress = localStorage.getItem("swarolipi_wallet_address");

      if (savedProvider && savedAddress) {
        if (savedProvider === "metamask" && this.isProviderInstalled("metamask")) {
          let ethProvider = window.ethereum;
          if (Array.isArray(window.ethereum?.providers)) {
            ethProvider = window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum;
          }
          ethProvider
            ?.request({ method: "eth_accounts" })
            .then((accounts: string[]) => {
              const account = accounts && accounts[0];
              if (account && account.toLowerCase() === savedAddress.toLowerCase()) {
                this.setState({
                  walletProvider: "metamask",
                  walletAddress: account,
                  chain: "Ethereum Mainnet",
                  connectionStatus: "connected",
                  error: null,
                });
              } else {
                this.clearSession();
              }
            })
            .catch(() => this.clearSession());
        } else if (savedProvider === "phantom" && this.isProviderInstalled("phantom")) {
          const solana = window.phantom?.solana || window.solana;
          if (solana?.isConnected && solana.publicKey) {
            this.setState({
              walletProvider: "phantom",
              walletAddress: solana.publicKey.toString(),
              chain: "Solana Mainnet",
              connectionStatus: "connected",
              error: null,
            });
          } else {
            solana
              ?.connect({ onlyIfTrusted: true })
              .then((resp: any) => {
                if (resp?.publicKey) {
                  this.setState({
                    walletProvider: "phantom",
                    walletAddress: resp.publicKey.toString(),
                    chain: "Solana Mainnet",
                    connectionStatus: "connected",
                    error: null,
                  });
                }
              })
              .catch(() => this.clearSession());
          }
        } else if (savedProvider === "walletconnect") {
          this.setState({
            walletProvider: "walletconnect",
            walletAddress: savedAddress,
            chain: "Ethereum Mainnet",
            connectionStatus: "connected",
            error: null,
          });
        }
      }
    } catch (e) {
      console.warn("Error restoring wallet session:", e);
    }
  }

  private initAutoListeners() {
    if (typeof window === "undefined") return;

    if (window.ethereum) {
      const ethProvider = Array.isArray(window.ethereum.providers)
        ? window.ethereum.providers.find((p: any) => p.isMetaMask) || window.ethereum
        : window.ethereum;

      ethProvider?.on?.("accountsChanged", (accounts: string[]) => {
        if (this.state.walletProvider === "metamask") {
          const account = accounts && accounts[0];
          if (!account) {
            this.disconnectWallet();
          } else {
            this.setState({
              walletAddress: account,
              connectionStatus: "connected",
            });
            this.saveSession("metamask", account);
          }
        }
      });

      ethProvider?.on?.("chainChanged", (chainIdHex: string) => {
        if (this.state.walletProvider === "metamask") {
          this.setState({ chain: this.formatChainId(chainIdHex) });
        }
      });
    }

    const solana = window.phantom?.solana || window.solana;
    if (solana) {
      solana.on?.("accountChanged", (publicKey: any) => {
        if (this.state.walletProvider === "phantom") {
          if (publicKey) {
            const newAddr = publicKey.toString();
            this.setState({ walletAddress: newAddr });
            this.saveSession("phantom", newAddr);
          } else {
            this.disconnectWallet();
          }
        }
      });

      solana.on?.("disconnect", () => {
        if (this.state.walletProvider === "phantom") {
          this.disconnectWallet();
        }
      });
    }
  }

  private formatChainId(hexOrDec: string): string {
    const num = typeof hexOrDec === "string" && hexOrDec.startsWith("0x") ? parseInt(hexOrDec, 16) : Number(hexOrDec);
    switch (num) {
      case 1:
        return "Ethereum Mainnet";
      case 137:
        return "Polygon";
      case 42161:
        return "Arbitrum One";
      case 10:
        return "Optimism";
      case 8453:
        return "Base";
      case 11155111:
        return "Sepolia Testnet";
      default:
        return num ? `Chain ID ${num}` : "Ethereum Network";
    }
  }
}

export const walletService = new WalletService();
