import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

const infuraRpc = import.meta.env.VITE_SEPOLIA_RPC;

export const config = getDefaultConfig({
  appName: 'PriviPay',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(infuraRpc),
  },
  ssr: false,
});