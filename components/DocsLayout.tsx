'use client';

import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  title: string;
  group?: string;
}

interface DocPage {
  id: string;
  label: string;
  group: string;
  sections: Section[];
  content: React.ReactNode;
}

// ── Hint boxes ────────────────────────────────────────────────────────────────
function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 text-sm text-blue-800">
      <span className="text-blue-500 text-base shrink-0">ℹ️</span>
      <div>{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 text-sm text-amber-800">
      <span className="text-amber-500 text-base shrink-0">⚠️</span>
      <div>{children}</div>
    </div>
  );
}

function Danger({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 my-4 text-sm text-red-800">
      <span className="text-red-500 text-base shrink-0">🚨</span>
      <div>{children}</div>
    </div>
  );
}

// ── Reusable table ────────────────────────────────────────────────────────────
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4 rounded-xl border border-orange-100">
      <table className="w-full text-sm">
        <thead className="bg-orange-50 border-b border-orange-100">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-50 bg-white">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-orange-50/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-gray-700 font-mono text-xs">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-orange-50 border border-orange-100 text-orange-700 rounded px-1.5 py-0.5 text-xs font-mono">
      {children}
    </code>
  );
}

// ── Section heading helper ────────────────────────────────────────────────────
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-gray-900 mt-10 mb-3 scroll-mt-24 border-b border-orange-100 pb-2">
      {children}
    </h2>
  );
}

function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-bold text-gray-800 mt-6 mb-2 scroll-mt-24">
      {children}
    </h3>
  );
}

// ── PAGE CONTENTS ─────────────────────────────────────────────────────────────

const whatIsArbidex = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      Arbidex is a <strong>DEX Aggregator</strong> running on{' '}
      <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Base</a>.
      It lets users swap tokens from a single interface while scanning multiple decentralized exchanges at once to find the <strong>best price</strong>.
    </p>
    <Info>Arbidex is currently active on <strong>Base Mainnet</strong> (Chain ID: <Code>8453</Code>).</Info>

    <H2 id="why-arbidex">Why Arbidex?</H2>
    <p className="text-gray-600 leading-relaxed mb-3">
      Liquidity on Base is spread across many DEXs — Uniswap, PancakeSwap, Aerodrome, and others.
      A user swapping on a single DEX won't always get the best price. Arbidex solves this:
    </p>
    <ul className="list-none space-y-2 mb-4">
      {[
        ['🔀', 'One interface, multiple liquidity sources', '— compares prices across several DEXs from a single screen.'],
        ['🏆', 'Best route suggestion', '— automatically selects the DEX that gives the highest output for the entered token pair and amount.'],
        ['🔒', 'Zero intermediary contract risk', '— transactions always go directly through the relevant DEX\'s own (already audited) router contract, signed from the user\'s wallet.'],
      ].map(([icon, title, desc]) => (
        <li key={title} className="flex gap-2 text-sm text-gray-600">
          <span className="shrink-0">{icon}</span>
          <span><strong className="text-gray-800">{title}</strong>{desc}</span>
        </li>
      ))}
    </ul>

    <H2 id="core-principle">Core Architectural Principle</H2>
    <blockquote className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50 rounded-r-xl my-4 text-gray-700 italic text-sm">
      Arbidex is a <strong>pure price-comparison and routing layer</strong>. User funds are never sent to a contract owned by Arbidex; a swap always goes to the selected DEX's own router.
    </blockquote>

    <H2 id="modules">What's Inside the Product?</H2>
    <Table
      headers={['Module', 'Description']}
      rows={[
        ['Swap', 'Exchanges tokens by finding the best route among Uniswap V3, PancakeSwap V3, and Aerodrome'],
        ['Send', 'Direct wallet-to-wallet token transfer'],
        ['Leaderboard', 'User ranking based on trading volume and points'],
        ['Tasks & Rewards', 'Points earned for swap/send activity and social tasks'],
        ['History', 'Status and on-chain record of past transactions'],
        ['Portfolio', 'Wallet token balances and total portfolio value'],
      ]}
    />
  </div>
);

const gettingStarted = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">Get up and running with Arbidex in a few steps.</p>

    <H2 id="connect-wallet">1. Connect Your Wallet</H2>
    <p className="text-gray-600 leading-relaxed mb-3">
      Click the connect button in the top-right corner. Supports MetaMask, Coinbase Wallet, Rabby, and any WalletConnect-compatible wallet.
      After connecting, your shortened address appears in the header (e.g. <Code>0xEE...ae9f</Code>).
    </p>

    <H2 id="right-network">2. Make Sure You're on the Right Network</H2>
    <p className="text-gray-600 leading-relaxed mb-2">
      Arbidex only works on <strong>Base Mainnet</strong> (Chain ID: <Code>8453</Code>). If your wallet is on a different network, the app automatically prompts a network switch.
    </p>
    <Warning>Never attempt to send a transaction on a network other than Base — contracts won't be found or the transaction will fail.</Warning>

    <H2 id="navigation">3. Navigation</H2>
    <p className="text-gray-600 leading-relaxed mb-3">
      The top menu contains: <Code>Swap</Code> · <Code>Send</Code> · <Code>Leaderboard</Code> · <Code>Tasks</Code> · <Code>History</Code> · <Code>Docs</Code> · <Code>Portfolio</Code>
    </p>

    <H2 id="first-swap">4. Your First Swap</H2>
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4 pl-2">
      <li>Go to the <strong>Swap</strong> tab.</li>
      <li>In "You pay", select the token and enter the amount (25% / 50% / 75% / MAX shortcuts available).</li>
      <li>In "You receive", select the token you want.</li>
      <li>Arbidex queries prices across Uniswap V3, PancakeSwap V3, and Aerodrome, and shows the best route.</li>
      <li>Check your slippage tolerance (default <Code>0.5%</Code>).</li>
      <li>Confirm — your wallet sends the transaction directly to the selected DEX's router contract.</li>
    </ol>
    <Info>Only <strong>single-hop</strong> routes are supported (Token A → Token B, through one DEX's one pool). Multi-hop and split-routing are not supported yet.</Info>
  </div>
);

const swapDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      The main feature and default landing page. Finds the best swap route across multiple DEXs.
    </p>

    <H2 id="swap-ui">UI Components</H2>
    <ul className="list-none space-y-2 mb-4 text-sm text-gray-600">
      {[
        ['You pay', 'Token and amount to send. Shows wallet balance with 25% / 50% / 75% / MAX shortcuts.'],
        ['You receive', 'Token to receive, with estimated output shown.'],
        ['Slippage setting', 'Top right, default 0.5%, adjustable.'],
        ['Direction toggle (⇅)', 'Swaps "you pay" and "you receive" tokens.'],
        ['Action button', 'Shows "Enter an amount" when empty, becomes "Swap" once an amount and route are ready.'],
      ].map(([label, desc]) => (
        <li key={label} className="flex gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
          <span><strong className="text-gray-800">{label}</strong> — {desc}</span>
        </li>
      ))}
    </ul>

    <H2 id="route-finding">Route-Finding Logic</H2>
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4 pl-2">
      <li>Prices are fetched in parallel from <strong>Uniswap V3</strong>, <strong>PancakeSwap V3</strong>, and <strong>Aerodrome</strong>.</li>
      <li>Multiple fee tiers are scanned for Uniswap and PancakeSwap: <Code>0.01%</Code>, <Code>0.05%</Code>, <Code>0.3%</Code>, <Code>1%</Code>.</li>
      <li>Aerodrome is checked on both classic (stable/volatile) pools and Slipstream (concentrated liquidity) pools.</li>
      <li>The route with the highest output (<Code>amountOut</Code>) is selected as the "best route."</li>
    </ol>

    <H2 id="execution-flow">Execution Flow</H2>
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4 pl-2">
      <li>If the token hasn't been approved for the selected router, an <strong>ERC-20 approve</strong> transaction is requested first.</li>
      <li>The <strong>swap</strong> transaction is sent directly to the selected DEX's router — no Arbidex intermediary.</li>
      <li>The result appears under the <strong>History</strong> tab.</li>
    </ol>
    <Info>Only <strong>single-hop</strong> routes are supported. Multi-hop and split-routing are not supported yet.</Info>
  </div>
);

const sendDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      Lets a user transfer any token directly to another address on Base.
    </p>
    <H2 id="send-ui">UI Components</H2>
    <ul className="list-none space-y-2 mb-4 text-sm text-gray-600">
      {[
        ['Token selector', 'Pick any supported token from your wallet.'],
        ['Recipient Address', 'Paste the destination 0x address.'],
        ['Amount', 'Enter amount manually or tap MAX to fill the full balance.'],
        ['Send button', 'Disabled until all fields are valid.'],
      ].map(([label, desc]) => (
        <li key={label} className="flex gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
          <span><strong className="text-gray-800">{label}</strong> — {desc}</span>
        </li>
      ))}
    </ul>
    <H2 id="send-flow">Flow</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Enter token, recipient, and amount → native ETH triggers a plain transfer, ERC-20 triggers the token's <Code>transfer</Code> function → once confirmed, it appears in <strong>History</strong> and contributes to <strong>Tasks & Rewards</strong> points.
    </p>
    <Warning>Transfers on Base are <strong>irreversible</strong>. Arbidex performs no scam-address safety checks beyond basic address format validation.</Warning>
  </div>
);

const leaderboardDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">Ranks all users by trading activity and points.</p>
    <H2 id="lb-personal">Personal Summary Card</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Shows your <strong>Rank</strong> (e.g. <Code>#1</Code>), <strong>Points</strong> (e.g. <Code>3.1K</Code>), <strong>Volume</strong> in USD, and <strong>Trade count</strong>.
      Your row in the Top Traders table is highlighted with a <Code>YOU</Code> tag.
    </p>
    <H2 id="lb-table">Top Traders Table</H2>
    <p className="text-gray-600 text-sm leading-relaxed mb-3">
      Sorted by points descending. Shows rank, wallet address (or username if set), points, volume, and trade count.
      Points come directly from the <strong>Tasks & Rewards</strong> system.
    </p>
  </div>
);

const tasksDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">A points/quest system that rewards platform activity.</p>
    <H2 id="tasks-swap">Swap Transactions</H2>
    <Table
      headers={['Task', 'Reward']}
      rows={[
        ['Per swap', '+200 pts (unlimited, repeats every swap)'],
        ['10 Swaps milestone', '+2,500 pts (one-time)'],
        ['25 Swaps milestone', '+7,500 pts (one-time)'],
        ['50 Swaps milestone', '+20,000 pts (one-time)'],
      ]}
    />
    <H2 id="tasks-send">Token Transfer (Send)</H2>
    <Table
      headers={['Task', 'Reward']}
      rows={[
        ['Per send', '+100 pts (unlimited)'],
        ['10 Sends milestone', '+1,500 pts (one-time)'],
        ['25 Sends milestone', '+4,000 pts (one-time)'],
        ['50 Sends milestone', '+10,000 pts (one-time)'],
      ]}
    />
    <H2 id="tasks-social">Social Tasks</H2>
    <Table
      headers={['Task', 'Reward']}
      rows={[
        ['Follow on X', '+2,500 pts (one-time)'],
        ['Discord Membership', 'Coming soon'],
        ['Telegram Channel', 'Coming soon'],
        ['Refer a Friend', 'Coming soon'],
      ]}
    />
    <Info>All points earned here feed directly into the <strong>Leaderboard</strong> ranking.</Info>
  </div>
);

const architectureDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">
      No intermediary contract. Arbidex's core decision: <strong>no custom aggregator/swap smart contract is written or deployed.</strong>
    </p>
    <H2 id="arch-flow">How it Works</H2>
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 mb-4 pl-2">
      <li>Compares prices off-chain (in the frontend layer).</li>
      <li>Recommends the best route to the user.</li>
      <li>Sends the approved transaction <strong>directly</strong> to the selected DEX's own (already audited) router contract.</li>
    </ol>
    <H2 id="arch-comparison">Comparison</H2>
    <Table
      headers={['Criterion', 'Intermediary aggregator', 'Arbidex (direct router)']}
      rows={[
        ['Audit requirement', 'Own contract must be audited', 'None — only already-audited DEX contracts used'],
        ['Fund risk', 'Funds pass through an intermediary', 'Funds go directly to the DEX router'],
        ['Routing flexibility', 'Multi-hop / split-route possible', 'Single-hop only, currently'],
        ['Dev complexity', 'High (Solidity + audit)', 'Low (frontend integration only)'],
      ]}
    />
    <H2 id="supported-dexs">Supported DEXs</H2>
    <Info>All addresses below are for <strong>Base Mainnet</strong> (Chain ID <Code>8453</Code>).</Info>
    <H3>Uniswap V3</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['QuoterV2', '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'],
        ['SwapRouter02', '0x2626664c2603336E57B271c5C0b26F421741e481'],
        ['Factory', '0x33128a8fC17869897dcE68Ed026d694621f6FDfD'],
      ]}
    />
    <p className="text-xs text-gray-500 mb-4">Fee tiers scanned: <Code>0.01%</Code> <Code>0.05%</Code> <Code>0.3%</Code> <Code>1%</Code></p>
    <H3>PancakeSwap V3</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['SwapRouter', '0x1b81D678ffb9C0263b24A97847620C99d213eB14'],
        ['QuoterV2', '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997'],
        ['Factory', '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865'],
      ]}
    />
    <H3>Aerodrome Classic</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['Router', '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'],
        ['PoolFactory', '0x420DD381b31aEf6683db6B902084cB0FfECe40Da'],
      ]}
    />
    <H3>Aerodrome Slipstream</H3>
    <Table
      headers={['Contract', 'Address']}
      rows={[
        ['QuoterV2', '0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0'],
        ['SwapRouter', '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5'],
        ['PoolFactory', '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A'],
      ]}
    />
    <Danger>All addresses listed here belong to <strong>Base Mainnet</strong>. Base Sepolia (testnet) addresses are different and must never be used in production.</Danger>
  </div>
);

const securityDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-4">Security principles baked into Arbidex's design.</p>
    <H2 id="sec-principles">Core Principles</H2>
    <ul className="list-none space-y-3 mb-4">
      {[
        ['🔐', 'No smart contract of our own.', 'Arbidex never deploys a contract that holds or routes user funds, eliminating custom-contract risk entirely.'],
        ['🔀', 'Every transaction goes directly to the DEX router.', 'Approve and swap calls always target Uniswap\'s, PancakeSwap\'s, or Aerodrome\'s own already-audited contracts.'],
        ['🛡️', 'Slippage protection is mandatory.', 'amountOutMinimum is always calculated and included — a swap is never sent without it.'],
        ['⏱️', 'Deadline parameter.', 'Every transaction expires automatically if not confirmed in time (20 min default).'],
      ].map(([icon, title, desc]) => (
        <li key={title} className="flex gap-3 bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
          <span className="text-xl shrink-0">{icon}</span>
          <span className="text-gray-700"><strong className="text-gray-900">{title}</strong> {desc}</span>
        </li>
      ))}
    </ul>
    <H2 id="sec-user">User Responsibilities</H2>
    <ul className="list-none space-y-2 mb-4 text-sm text-gray-600">
      {[
        'Watch approval amounts — some routers may request unlimited approval; check what your wallet is granting.',
        'Verify recipient addresses (Send) — transfers on Base are irreversible.',
        'Token safety — Arbidex doesn\'t currently offer a comprehensive scam-token filter; research unfamiliar tokens before trading.',
      ].map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-orange-400 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <Warning>The app verifies the wallet is on <strong>Base Mainnet (Chain ID 8453)</strong> before every transaction and prompts a network switch otherwise.</Warning>
  </div>
);

const faqDocs = (
  <div>
    <p className="text-gray-600 text-lg leading-relaxed mb-6">Frequently asked questions about Arbidex.</p>
    <div className="space-y-4">
      {[
        ['Is Arbidex a DEX?', 'No. Arbidex has no liquidity pools of its own. It\'s an aggregator that scans existing DEXs — Uniswap V3, PancakeSwap V3, Aerodrome — and recommends the best route.'],
        ['Does Arbidex have its own smart contract?', 'No. Swaps always go directly to the selected DEX\'s own router contract; Arbidex is never an intermediary in that flow.'],
        ['Which networks are supported?', 'Currently only Base Mainnet (Chain ID: 8453).'],
        ['Is multi-hop or split-routing supported?', 'No, the current version only supports single-hop routes (one DEX, one pool).'],
        ['How do I earn points?', 'Every swap earns 200 points, every send earns 100 points. One-time bonuses at 10/25/50 milestones, plus extra points from social tasks (e.g. following on X).'],
        ['Do points have any redeemable value?', 'The current doc only describes the points/quest mechanism. Whether points will be redeemable for a token or other reward will be announced separately.'],
        ['Why did my transaction fail?', 'Most common reasons: insufficient balance, slippage tolerance too low (price moved during execution), or the deadline expired. Check History and inspect on BaseScan.'],
      ].map(([q, a]) => (
        <details key={q} className="group bg-white border border-orange-100 rounded-2xl overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-800 text-sm hover:bg-orange-50 transition-colors list-none">
            {q}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-orange-50 pt-3">{a}</div>
        </details>
      ))}
    </div>
  </div>
);

// ── Sidebar data ──────────────────────────────────────────────────────────────
const PAGES: DocPage[] = [
  {
    id: 'what-is-arbidex', label: 'What is Arbidex?', group: 'Protocol',
    sections: [
      { id: 'why-arbidex', title: 'Why Arbidex?' },
      { id: 'core-principle', title: 'Core Architectural Principle' },
      { id: 'modules', title: "What's Inside?" },
    ],
    content: whatIsArbidex,
  },
  {
    id: 'getting-started', label: 'Getting Started', group: 'Guides',
    sections: [
      { id: 'connect-wallet', title: 'Connect Your Wallet' },
      { id: 'right-network', title: 'Right Network' },
      { id: 'first-swap', title: 'Your First Swap' },
    ],
    content: gettingStarted,
  },
  {
    id: 'swap', label: 'Swap', group: 'Guides',
    sections: [
      { id: 'swap-ui', title: 'UI Components' },
      { id: 'route-finding', title: 'Route-Finding Logic' },
      { id: 'execution-flow', title: 'Execution Flow' },
    ],
    content: swapDocs,
  },
  {
    id: 'send', label: 'Send', group: 'Guides',
    sections: [
      { id: 'send-ui', title: 'UI Components' },
      { id: 'send-flow', title: 'Flow' },
    ],
    content: sendDocs,
  },
  {
    id: 'leaderboard', label: 'Leaderboard', group: 'Guides',
    sections: [
      { id: 'lb-personal', title: 'Personal Summary' },
      { id: 'lb-table', title: 'Top Traders Table' },
    ],
    content: leaderboardDocs,
  },
  {
    id: 'tasks', label: 'Tasks & Rewards', group: 'Guides',
    sections: [
      { id: 'tasks-swap', title: 'Swap Tasks' },
      { id: 'tasks-send', title: 'Send Tasks' },
      { id: 'tasks-social', title: 'Social Tasks' },
    ],
    content: tasksDocs,
  },
  {
    id: 'architecture', label: 'Architecture', group: 'Reference',
    sections: [
      { id: 'arch-flow', title: 'How it Works' },
      { id: 'arch-comparison', title: 'Comparison' },
      { id: 'supported-dexs', title: 'Supported DEXs' },
    ],
    content: architectureDocs,
  },
  {
    id: 'security', label: 'Security', group: 'Reference',
    sections: [
      { id: 'sec-principles', title: 'Core Principles' },
      { id: 'sec-user', title: 'User Responsibilities' },
    ],
    content: securityDocs,
  },
  {
    id: 'faq', label: 'FAQ', group: 'Reference',
    sections: [],
    content: faqDocs,
  },
];

// ── Main Layout ───────────────────────────────────────────────────────────────
export function DocsLayout() {
  const [activePage, setActivePage] = useState('what-is-arbidex');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = PAGES.find((p) => p.id === activePage) ?? PAGES[0];
  const groups = Array.from(new Set(PAGES.map((p) => p.group)));

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8 relative">

        {/* ── Left Sidebar ── */}
        {/* Mobile toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden fixed bottom-6 left-6 z-40 bg-orange-500 text-white rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Menu
        </button>

        {/* Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed lg:sticky top-0 lg:top-20 left-0 h-screen lg:h-[calc(100vh-5rem)] w-56 shrink-0 z-40 lg:z-auto
          bg-white lg:bg-transparent border-r lg:border-0 border-orange-100
          overflow-y-auto transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0 px-4 lg:px-0
        `}>
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">{group}</p>
              {PAGES.filter((p) => p.group === group).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePage(p.id); setSidebarOpen(false); window.scrollTo({ top: 0 }); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                    activePage === p.id
                      ? 'bg-orange-100 text-orange-700 font-semibold'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.label}</h1>
          <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-6" />
          <div className="prose-sm max-w-none text-gray-600 leading-relaxed">
            {page.content}
          </div>
          {/* Page nav */}
          <div className="mt-12 pt-6 border-t border-orange-100 flex items-center justify-between">
            {(() => {
              const idx = PAGES.findIndex((p) => p.id === activePage);
              const prev = PAGES[idx - 1];
              const next = PAGES[idx + 1];
              return (
                <>
                  {prev ? (
                    <button onClick={() => { setActivePage(prev.id); window.scrollTo({ top: 0 }); }}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      ← {prev.label}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => { setActivePage(next.id); window.scrollTo({ top: 0 }); }}
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      {next.label} →
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>

        {/* ── Right "On this page" ── */}
        {page.sections.length > 0 && (
          <aside className="hidden xl:block w-44 shrink-0 sticky top-20 h-fit">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">On this page</p>
            <ul className="space-y-1.5">
              {page.sections.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="text-xs text-gray-500 hover:text-orange-600 transition-colors text-left leading-snug"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

      </div>
    </div>
  );
}
