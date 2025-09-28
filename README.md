# MultiSwap - Multi-Token Swap Protocol

🏆 **ETHRome Hackathon Project** 🏆

A revolutionary DeFi protocol that enables batch swapping of multiple tokens in a single transaction, with integrated limit orders functionality on Base mainnet.

## ✨ Features

- **🔄 Batch Swaps**: Execute multiple token swaps in one transaction using EIP-5792 sendCalls
- **⏰ Limit Orders**: Set price targets and trade automatically with 1inch integration
- **⚡ Base Optimized**: Built specifically for Base mainnet with low fees
- **🎨 Beautiful UI**: Modern, responsive interface inspired by bebop.xyz
- **🔐 Secure**: Non-custodial, decentralized trading

## 🛠 Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit
- **Swapping**: 1inch API/SDK, 1inch Fusion SDK
- **Blockchain**: Base Mainnet
- **Batch Transactions**: EIP-5792 sendCalls

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

2. **1inch API Key** (OPTIONAL)
   - Go to https://portal.1inch.dev/
   - Create an account and generate API key
   - **App works without API key** but with limitations:
     - ✅ Batch swaps work perfectly
     - ✅ Token quotes available
     - ❌ Limit orders require API key
     - ⚠️ Rate limited to 1 request/second

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

### Batch Swaps
1. Add multiple token swap routes
2. Configure slippage and deadline
3. Click "Swap Multiple Tokens"
4. Approve tokens if needed (batched with swaps)
5. Execute all swaps in one transaction

### Limit Orders
1. Go to "Limit Orders" tab
2. Set sell token and amount
3. Set minimum buy token amount
4. Create limit order
5. Order executes automatically when price target is met

## 🏗 Architecture

```
├── components/          # React components
│   ├── SwapInterface.tsx    # Main swap interface
│   ├── SwapRoute.tsx        # Individual swap route
│   ├── TokenSelector.tsx    # Token selection modal
│   ├── AmountInput.tsx      # Amount input with validation
│   ├── BatchSwapButton.tsx  # Batch execution button
│   └── LimitOrdersPanel.tsx # Limit orders interface
├── hooks/              # Custom React hooks
│   ├── useBatchSwap.ts     # Batch swap functionality
│   └── useLimitOrders.ts   # Limit orders management
├── lib/                # Utilities and configurations
│   ├── wagmi.ts           # Wagmi configuration
│   └── 1inch.ts          # 1inch API integration
├── pages/              # Next.js pages
│   ├── _app.tsx          # App wrapper with providers
│   └── index.tsx         # Main page
└── types/              # TypeScript type definitions
    └── index.ts
```

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

1. **Batch Swapping**: First implementation of EIP-5792 sendCalls for DeFi
2. **Gas Optimization**: Significant gas savings through transaction batching
3. **UX Innovation**: Seamless multi-token trading experience
4. **Base Integration**: Native optimization for Base ecosystem

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
