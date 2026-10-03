import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { profileService, UserProfile } from "@/services/profileService";

export type { UserProfile };

export function useProfile() {
  const { walletAddress, walletProvider, chain, isConnected } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isNewConnection, setIsNewConnection] = useState<boolean>(false);

  useEffect(() => {
    if (isConnected && walletAddress) {
      const loaded = profileService.loadOrCreateProfile(
        walletAddress,
        walletProvider || undefined,
        chain || undefined
      );
      setProfile(loaded);
      setIsNewConnection(profileService.isNewConnection());
    } else {
      profileService.clearActiveProfile();
      setProfile(null);
      setIsNewConnection(false);
    }
  }, [isConnected, walletAddress, walletProvider, chain]);

  useEffect(() => {
    const unsubscribe = profileService.subscribe((updatedProfile) => {
      setProfile(updatedProfile);
    });
    return unsubscribe;
  }, []);

  const updateName = (name: string) => {
    return profileService.updateProfile({ name });
  };

  const updateAvatar = (avatarUrl: string | null) => {
    return profileService.updateProfile({ avatarUrl });
  };

  const completeHumanVerification = () => {
    return profileService.completeHumanVerification();
  };

  const completeIdentityVerification = (country: string, documentType: string, documentHash?: string) => {
    return profileService.completeIdentityVerification(country, documentType, documentHash);
  };

  const resetVerifications = () => {
    return profileService.resetVerifications();
  };

  const dismissWelcome = () => {
    profileService.dismissWelcomeBanner();
    setIsNewConnection(false);
  };

  return {
    profile,
    profileName: profile?.name || "",
    profileImage: profile?.avatarUrl || null,
    profileInitialized: Boolean(profile?.initialized),
    walletVerified: Boolean(profile?.walletVerified),
    humanVerified: Boolean(profile?.humanVerified),
    humanVerifiedAt: profile?.humanVerifiedAt || null,
    identityVerified: Boolean(profile?.identityVerified),
    identityCountry: profile?.identityCountry || null,
    identityDocumentType: profile?.identityDocumentType || null,
    identityDocumentHash: profile?.identityDocumentHash || null,
    identityVerifiedAt: profile?.identityVerifiedAt || null,
    isNewConnection,
    updateName,
    updateAvatar,
    completeHumanVerification,
    completeIdentityVerification,
    resetVerifications,
    dismissWelcome,
  };
}
