# MultiSwap - Multi-Token Swap Protocol

🏆 **ETHRome Hackathon Project** 🏆

A revolutionary DeFi protocol that enables batch swapping of multiple tokens in a single transaction, with integrated limit orders functionality on Base mainnet.

## ✨ Features

- **🔄 Batch Swaps**: Execute multiple token swaps in one transaction using EIP-5792 sendCalls
- **⚡ Gasless Transactions**: Free swaps powered by 1inch Fusion SDK (no gas fees!)
- **⏰ Limit Orders**: Set price targets and trade automatically with 1inch integration
- **🚀 Dual Mode**: Choose between Fusion (gasless) or Standard (with gas) batch swaps
- **⚡ Base Optimized**: Built specifically for Base mainnet with low fees
- **🎨 Beautiful UI**: Modern, responsive interface with real-time order tracking
- **🔐 Secure**: Non-custodial, decentralized trading

## 🛠 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Web3**: Wagmi v2, Viem, RainbowKit
- **Swapping**: 1inch Fusion SDK (gasless), 1inch Limit Order SDK
- **Blockchain**: Base Mainnet (Chain ID: 8453)
- **Batch Transactions**: EIP-5792 sendCalls + Fusion Resolvers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn
- Web3 wallet (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd multi-token-swap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your API keys:
   - Get WalletConnect Project ID: https://cloud.walletconnect.com/
   - Get 1inch API Key: https://portal.1inch.dev/

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

## 🔧 Configuration

### API Keys Configuration

1. **WalletConnect Project ID** (REQUIRED)
   - Go to https://cloud.walletconnect.com/
   - Create a new project
   - Copy the Project ID
   - **Required for wallet connections**

2. **1inch API Key** (REQUIRED for full features)
   - Go to https://portal.1inch.dev/
   - Create an account and generate API key
   - **Features availability**:
     - ✅ **With API Key**: 
       - Gasless swaps via Fusion SDK (no gas fees!)
       - Real-time quotes and optimal routing
       - Limit orders functionality
       - High rate limits
     - ⚠️ **Without API Key** (Demo Mode):
       - Basic batch swaps work
       - Simulated quotes
       - Limited functionality
       - Rate limited

### 🚀 Quick Start (No API Key Needed!)

You can run the app immediately without any API keys:

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd multi-token-swap
   npm install
   ```

2. **Start development**
   ```bash
   npm run dev
   ```

3. **Add WalletConnect ID later** (for wallet connections)
   - Copy `env.example` to `.env.local`
   - Add your WalletConnect Project ID

### Optional Configuration

- **Custom RPC**: Set `NEXT_PUBLIC_BASE_RPC_URL` for custom Base RPC endpoint
- **Analytics**: Add analytics tracking ID

## 🎯 How It Works

### Fusion Batch Swaps (Gasless ⚡)
1. Add multiple token swap routes
2. Configure slippage and deadline
3. Select **Fusion Mode** (enabled by default)
4. Click "Swap Multiple Tokens (Gasless ⚡)"
5. Create Fusion orders - resolvers execute them for free!
6. Track order status in real-time

**How Gasless Works:**
- Creates off-chain orders through 1inch Fusion SDK
- Resolvers (third-party relayers) execute orders
- Resolvers pay gas fees and take small commission
- You pay ZERO gas fees!

### Standard Batch Swaps (With Gas)
1. Add multiple token swap routes
2. Select **Standard Mode**
3. Click "Swap Multiple Tokens"
4. Uses EIP-5792 sendCalls for batch transactions
5. Approve tokens if needed (batched with swaps)
6. Execute all swaps in one transaction

### Limit Orders
1. Go to "Limit Orders" tab
2. Set sell token and amount
3. Set minimum buy token amount
4. Create limit order via 1inch Limit Order SDK
5. Order executes automatically when price target is met

## 🏗 Architecture

```
├── components/                # React components
│   ├── SwapInterface.tsx         # Main swap interface
│   ├── SwapRoute.tsx             # Individual swap route
│   ├── TokenSelector.tsx         # Token selection modal
│   ├── AmountInput.tsx           # Amount input with validation
│   ├── BatchSwapButton.tsx       # Batch execution (Fusion + Standard)
│   └── LimitOrdersPanel.tsx      # Limit orders interface
├── hooks/                     # Custom React hooks
│   ├── useBatchSwap.ts           # Dual-mode batch swap (Fusion/Standard)
│   ├── useLimitOrders.ts         # Limit orders management
│   └── useTokenBalance.ts        # Token balance tracking
├── lib/                       # Services and utilities
│   ├── wagmi.ts                  # Wagmi v2 configuration
│   ├── 1inch-fusion.ts           # Fusion SDK service (gasless)
│   ├── 1inch-limit-order.ts      # Limit Order SDK service
│   ├── fusion-utils.ts           # Fusion helper utilities
│   └── 1inch-sdk.ts              # Legacy SDK wrapper
├── pages/                     # Next.js pages
│   ├── _app.tsx                  # App wrapper with providers
│   ├── index.tsx                 # Main swap page
│   └── api/1inch/[...path].ts    # 1inch API proxy
└── types/                     # TypeScript definitions
    └── index.ts                  # Shared types
```

### Key Components

- **`lib/1inch-fusion.ts`**: Fusion SDK integration for gasless swaps
- **`lib/fusion-utils.ts`**: Helper functions for Fusion orders
- **`hooks/useBatchSwap.ts`**: Dual-mode hook (Fusion/Standard)
- **`components/BatchSwapButton.tsx`**: Smart button with mode selection

## 🔐 Security Features

- **Non-custodial**: Users maintain full control of their funds
- **Smart Contract Audited**: Using battle-tested 1inch protocols
- **Slippage Protection**: Configurable slippage tolerance
- **Transaction Simulation**: Preview before execution

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Powered by Framer Motion
- **Dark/Light Mode**: Adaptive theming
- **Real-time Updates**: Live price feeds and order status
- **Transaction History**: Track all your swaps and orders

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

## 📱 Supported Wallets

- MetaMask
- WalletConnect compatible wallets
- Coinbase Wallet
- Rainbow Wallet
- And more...

## 🌐 Supported Tokens

Currently supports major tokens on Base mainnet:
- ETH (Native)
- WETH
- USDC
- DAI
- And more ERC-20 tokens available through 1inch

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏆 Hackathon Submission

**Event**: ETHRome 2025  
**Track**: DeFi Innovation  
**Team**: [Your Team Name]

### Key Innovations

1. **Gasless Batch Swaps**: Revolutionary implementation of 1inch Fusion SDK for batch swaps with ZERO gas fees
2. **Dual-Mode Architecture**: Flexible switching between Fusion (gasless) and Standard (EIP-5792 sendCalls) modes
3. **Smart Order Routing**: Automatic optimal routing through Fusion resolvers
4. **UX Innovation**: Seamless multi-token trading with real-time order tracking
5. **Base Integration**: Native optimization for Base ecosystem with low latency

### Technical Highlights

- **1inch Fusion SDK**: Leverages off-chain orders executed by resolvers
- **EIP-5792 sendCalls**: Batch transaction standard for on-chain swaps
- **Wagmi v2**: Modern Web3 React hooks with sendCalls support
- **TypeScript**: Full type safety across the entire stack
- **Real-time Updates**: Live order status tracking for Fusion orders

## 📞 Support

For questions or support:
- GitHub Issues: [Link to issues]
- Discord: [Your Discord]
- Email: [Your Email]

## 🙏 Acknowledgments

- **1inch**: For the excellent DEX aggregation API
- **Wagmi**: For the amazing Web3 React hooks
- **Base**: For the fast and cheap L2 infrastructure
- **ETHRome**: For organizing this amazing hackathon

---

Built with ❤️ for ETHRome Hackathon 2025
