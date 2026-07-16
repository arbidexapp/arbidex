import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http, fallback } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Multiple public RPCs — falls back to next on rate limit
const baseTransport = fallback([
  http('https://base.llamarpc.com'),
  http('https://base-rpc.publicnode.com'),
  http('https://1rpc.io/base'),
  http('https://mainnet.base.org'),
]);

export const config = getDefaultConfig({
  appName: 'Arbidex - DEX Aggregator',
  projectId,
  chains: [base],
  transports: { [base.id]: baseTransport },
  ssr: true,
});
