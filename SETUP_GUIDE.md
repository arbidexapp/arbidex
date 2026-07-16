# Arbidex Setup Guide

## ✅ Project Successfully Created!

Your project is up and running! 🎉

**Dev server running:**
- Local: http://localhost:3000
- Network: http://192.168.1.113:3000

## 🚀 Quick Start

### 1. Get a WalletConnect Project ID

A WalletConnect Project ID is required for RainbowKit to work:

1. Go to https://cloud.walletconnect.com/
2. Create an account (free)
3. Create a new project
4. Copy the Project ID
5. Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your `.env.local` file

### 2. Start the Development Server

```bash
cd arbidex
npm run dev
```

Open http://localhost:3000 in your browser.

### 3. Connect Your Wallet

1. Click the "Connect Wallet" button
2. Select your preferred wallet (MetaMask, Coinbase Wallet, etc.)
3. **IMPORTANT:** Make sure you are on the Base Mainnet network!

## 📋 Completed Features

### ✅ Core Infrastructure
- [x] Next.js 15 + TypeScript + Tailwind CSS setup
- [x] Wagmi + Viem + RainbowKit integration
- [x] Base Mainnet configuration
- [x] Navigation structure (7 pages)

### ✅ Swap Interface
- [x] Token input component
- [x] Token selection modal
- [x] Slippage settings
- [x] Balance display
- [x] MAX button

### ✅ Routing Engine
- [x] Uniswap V3 quote integration (all fee tiers)
- [x] PancakeSwap V3 quote integration
- [x] Aerodrome V2 (stable/volatile) integration
- [x] Aerodrome Slipstream integration
- [x] Parallel quote fetching
- [x] Best route calculation
- [x] Route comparison display

### ✅ UI/UX
- [x] Orange/cream color theme
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Animations

## 🔨 Todo

### Token Approval Flow
```typescript
// To be implemented in components/SwapButton.tsx
- Token allowance check
- Send approve transaction
- Wait for approval confirmation
- Show approval status in UI
```

### Swap Execution
```typescript
// Swap functions for each DEX type:
- Uniswap V3: exactInputSingle
- PancakeSwap V3: exactInputSingle
- Aerodrome V2: swapExactTokensForTokens
- Aerodrome Slipstream: exactInputSingle
```

### Transaction Tracking
- Get transaction hash
- Wait for confirmation
- Show success/fail status
- BaseScan link

### Other Pages
- [ ] Send - Token transfer
- [ ] Portfolio - Balance view
- [ ] History - Transaction history
- [ ] Leaderboard - User rankings
- [ ] Tasks - Tasks and rewards
- [ ] Profile - User settings

## 🔗 Important Contract Addresses

### Uniswap V3 (Base)
```
QuoterV2: 0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a
SwapRouter02: 0x2626664c2603336E57B271c5C0b26F421741e481
Factory: 0x33128a8fC17869897dcE68Ed026d694621f6FDfD
```

### PancakeSwap V3 (Base)
```
QuoterV2: 0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997
SwapRouter: 0x1b81D678ffb9C0263b24A97847620C99d213eB14
Factory: 0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865
```

### Aerodrome (Base)
```
V2 Router: 0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43
V2 PoolFactory: 0x420DD381b31aEf6683db6B902084cB0FfECe40Da
Slipstream QuoterV2: 0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0
Slipstream SwapRouter: 0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5
```

### Common Tokens (Base)
```
WETH: 0x4200000000000000000000000000000000000006
USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
DAI: 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb
USDT: 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2
```

## 📁 Project Structure

```
arbidex/
├── app/                          # Next.js pages
│   ├── page.tsx                 # Swap (home page)
│   ├── send/page.tsx            # Token transfer
│   ├── leaderboard/page.tsx     # Rankings
│   ├── tasks/page.tsx           # Tasks & rewards
│   ├── portfolio/page.tsx       # Portfolio
│   ├── history/page.tsx         # History
│   ├── profile/page.tsx         # Profile
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── Navigation.tsx           # Main navigation
│   ├── SwapInterface.tsx        # Swap interface
│   ├── TokenInput.tsx           # Token input field
│   ├── TokenSelectModal.tsx     # Token select modal
│   ├── SlippageSettings.tsx     # Slippage settings
│   ├── RouteDisplay.tsx         # Route display
│   └── SwapButton.tsx           # Swap button
│
├── lib/                          # Core logic
│   ├── contracts.ts             # Contract addresses & types
│   ├── routing.ts               # Routing engine
│   ├── wagmi.ts                 # Wagmi config
│   └── abis/                    # Contract ABIs
│       ├── QuoterV2.json
│       ├── SwapRouter02.json
│       ├── AerodromeRouter.json
│       └── ERC20.json
│
├── providers/                    # Context providers
│   └── Web3Provider.tsx         # Web3 provider
│
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                # TypeScript config
└── tailwind.config.ts           # Tailwind config
```

## 🔐 Security Notes

1. **No custom contracts**: All swaps go directly to DEX routers
2. **Approval safety**: Always review the approval amount
3. **Slippage**: High slippage is risky — use with care
4. **Test first**: Test with small amounts before larger swaps
5. **Network check**: Always make sure you are on Base Mainnet

## 🐛 Troubleshooting

### "WALLETCONNECT_PROJECT_ID not found" error
Fill in `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local` and restart the dev server.

### "Wrong network" error
Switch to Base Mainnet in MetaMask:
- Network: Base Mainnet
- Chain ID: 8453
- RPC URL: https://mainnet.base.org

### Token balance not showing
In wagmi v2, the `useBalance` hook behaves differently. `useReadContract` may be required for ERC-20 tokens.

### Quote fetching failed
- May have hit RPC rate limit
- Pool may not exist for that token pair
- Check your network connection

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Base Docs](https://docs.base.org/)
- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Aerodrome Docs](https://aerodrome.finance/docs)

## 🎯 Next Steps

1. **Add WalletConnect ID** - `.env.local`
2. **Complete token approval flow** - `SwapButton.tsx`
3. **Implement swap execution** - For each DEX
4. **Add transaction tracking** - Wait for confirmation
5. **Test** - Try on Base testnet first
6. **Build other pages** - Send, Portfolio, etc.

## 💡 Development Tips

- `npm run dev` — Development server
- `npm run build` — Test production build
- `npm run lint` — Code linting
- Ctrl+C — Stop the dev server

---

**Project status:** 🟢 Running
**Build status:** ✅ Successful
**Dev server:** 🟢 http://localhost:3000

Happy coding! 🚀
