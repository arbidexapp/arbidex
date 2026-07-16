# Arbidex - DEX Aggregator on Base

A secure and efficient DEX aggregator that finds the best swap rates across **Uniswap V3**, **PancakeSwap V3**, **Aerodrome V2**, and **Aerodrome Slipstream** on the Base network (Chain ID: 8453).

## 🎯 Features

- ✅ **Multi-DEX Comparison**: Compare prices across 4 major DEXes on Base
- ✅ **Native ETH Support**: Seamless ETH swaps without seeing WETH
- ✅ **Best Route Selection**: Automatically finds the optimal swap route
- ✅ **Smart Approval System**: Only approves when necessary
- ✅ **Slippage Protection**: Customizable slippage tolerance settings
- ✅ **Direct Execution**: No intermediary smart contracts - swaps execute directly on DEX routers
- ✅ **Security First**: No custody of funds, all approvals go directly to audited DEX contracts
- ✅ **Multicall Optimization**: Token → ETH swaps use multicall (swap + unwrap in one TX)

## 🏗️ Architecture

**CRITICAL**: This aggregator does **NOT** use a custom smart contract for swaps. All swap transactions are sent directly to the respective DEX's audited router contract, eliminating smart contract risk.

### Supported DEXes:
1. **Uniswap V3** - All fee tiers (0.01%, 0.05%, 0.3%, 1%)
2. **PancakeSwap V3** - All fee tiers (Fork of Uniswap V3)
3. **Aerodrome V2** - Stable and volatile pools
4. **Aerodrome Slipstream** - Concentrated liquidity pools (V3-style)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Base network configured in your wallet
- **WalletConnect Project ID** (get from https://cloud.walletconnect.com/)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arbidex
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_CHAIN_ID=8453
```

**⚠️ IMPORTANT:** Get your WalletConnect Project ID from: https://cloud.walletconnect.com/

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage

### Basic Swap Flow

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Select Tokens**: Choose the tokens you want to swap
   - Default: ETH → USDC
   - Native ETH is fully supported (no WETH confusion!)
3. **Enter Amount**: Enter the amount you want to swap
4. **Review Routes**: The app will show the best route across all DEXes
5. **Adjust Slippage**: Set your slippage tolerance (default 0.5%)
6. **Approve (if needed)**: For ERC-20 tokens, approve once
7. **Execute Swap**: Click "Swap" and confirm in your wallet

### Special Cases

**ETH → Token Swap:**
- No approval needed
- Directly send ETH value with transaction

**Token → ETH Swap:**
- Approve token first
- Multicall automatically unwraps WETH to ETH

**ETH ↔ WETH:**
- 1:1 ratio, no fees
- Instant wrap/unwrap

## 🔒 Security

- **No Custom Contracts**: All swaps execute on audited DEX contracts
- **Direct Approvals**: Token approvals only go to official DEX routers
- **Non-Custodial**: We never have access to your funds
- **Client-Side Routing**: All quote calculations happen on your device

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: wagmi, viem, RainbowKit
- **Network**: Base Mainnet (Chain ID: 8453)

## 📋 Project Structure

```
arbidex/
├── app/                    # Next.js app router pages
│   ├── swap/              # Swap interface (main page)
│   ├── send/              # Token transfer
│   ├── leaderboard/       # User rankings
│   ├── tasks/             # Rewards & tasks
│   ├── portfolio/         # Portfolio view
│   ├── history/           # Transaction history
│   └── profile/           # User settings
├── components/            # React components
│   ├── Navigation.tsx     # Main navigation
│   ├── SwapInterface.tsx  # Swap UI
│   ├── TokenInput.tsx     # Token input field
│   ├── RouteDisplay.tsx   # Route comparison display
│   └── SwapButton.tsx     # Swap execution button
├── lib/                   # Core libraries
│   ├── contracts.ts       # Contract addresses & types
│   ├── routing.ts         # Route finding logic
│   ├── wagmi.ts           # Wagmi configuration
│   └── abis/              # Contract ABIs
└── providers/             # React providers
    └── Web3Provider.tsx   # Web3 context provider
```

## 🔗 Contract Addresses (Base Mainnet)

### Uniswap V3
- QuoterV2: `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a`
- SwapRouter02: `0x2626664c2603336E57B271c5C0b26F421741e481`

### PancakeSwap V3
- QuoterV2: `0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997`
- SwapRouter: `0x1b81D678ffb9C0263b24A97847620C99d213eB14`

### Aerodrome
- V2 Router: `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43`
- Slipstream Router: `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5`

## 🚧 Current Status

✅ **Fully Implemented:**
- Project setup and configuration
- Navigation and page structure (7 pages)
- Token input with native ETH support
- Multi-DEX quote fetching (4 DEXes)
- Route comparison and display
- Slippage settings
- **Token approval flow** with smart detection
- **Swap execution logic** for all DEX types
- **Native ETH handling** (wrap/unwrap, direct swaps)
- **Multicall support** for Token → ETH swaps
- Transaction status tracking
- Send tokens functionality
- Portfolio view with balance display
- Transaction history page
- Tasks & rewards system
- Leaderboard with rankings
- Profile page skeleton

🎯 **Production Ready:** Swap functionality is fully operational!

📝 **Future Enhancements:**
- Builder Code Attribution (ERC-8021)
- Multicall3 batch quote fetching
- Transaction history database integration
- Advanced analytics and charts

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. Always verify transaction details before confirming swaps.
