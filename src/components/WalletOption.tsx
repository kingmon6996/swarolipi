import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { ProviderId } from "@/services/walletService";

export interface WalletProviderInfo {
  id: ProviderId;
  name: string;
  description: string;
  icon: string;
  downloadUrl: string;
}

export interface WalletOptionProps {
  provider: WalletProviderInfo;
  index: number;
  isInstalled: boolean;
  onSelect: (provider: WalletProviderInfo) => void;
}

export function WalletOption({
  provider,
  index,
  isInstalled,
  onSelect,
}: WalletOptionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(provider)}
      className="group flex w-full items-center gap-3.5 rounded-xl border border-purple-500/15 bg-card/60 px-4 py-3.5 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-card/85 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
    >
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-purple-500/20 bg-background/80 transition-transform duration-300 group-hover:scale-105">
        <img
          src={provider.icon}
          alt={`${provider.name} logo`}
          width={44}
          height={44}
          loading="lazy"
          className="size-8 object-contain"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-sm font-bold text-foreground">{provider.name}</span>
          {isInstalled && (
            <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[0.65rem] font-bold text-purple-300">
              Installed
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground">{provider.description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  );
}
