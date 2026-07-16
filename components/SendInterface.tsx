'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { TokenSelectModal } from './TokenSelectModal';
import { NATIVE_ETH, TOKENS } from '@/lib/contracts';
import ERC20ABI from '@/lib/abis/ERC20.json';
import { saveTx } from '@/lib/tx-history';
import { saveTxToSupabase, updateLeaderboard } from '@/lib/supabase-db';

const trustBase = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets';

const TOKEN_LOGOS: Record<string, string> = {
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  '0x4200000000000000000000000000000000000006': `${trustBase}/0x4200000000000000000000000000000000000006/logo.png`,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': `${trustBase}/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png`,
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': `${trustBase}/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png`,
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': `${trustBase}/0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2/logo.png`,
};

const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  [NATIVE_ETH.toLowerCase()]:    { symbol: 'ETH',  decimals: 18 },
  [TOKENS.WETH.toLowerCase()]:   { symbol: 'WETH', decimals: 18 },
  [TOKENS.USDC.toLowerCase()]:   { symbol: 'USDC', decimals: 6  },
  [TOKENS.DAI.toLowerCase()]:    { symbol: 'DAI',  decimals: 18 },
  [TOKENS.USDT.toLowerCase()]:   { symbol: 'USDT', decimals: 6  },
};

function TokenLogo({ address }: { address: string }) {
  const [err, setErr] = useState(false);
  const logo = TOKEN_LOGOS[address?.toLowerCase() ?? ''];
  const symbol = KNOWN_TOKENS[address?.toLowerCase() ?? '']?.symbol ?? '?';

  if (!logo || err) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {symbol[0]}
      </div>
    );
  }
  return (
    <img src={logo} alt={symbol} width={32} height={32}
      className="w-8 h-8 rounded-full object-cover shrink-0"
      onError={() => setErr(true)}
    />
  );
}

export function SendInterface() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [selectedToken, setSelectedToken] = useState<string>('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [tokenSymbol, setTokenSymbol]     = useState<string>('');
  const [rawBalance, setRawBalance]       = useState<bigint | null>(null);
  const [recipient, setRecipient]         = useState<string>('');
  const [amount, setAmount]               = useState<string>('');
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isSending, setIsSending]         = useState(false);
  const [txHash, setTxHash]               = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);

  const isNativeETH = selectedToken.toLowerCase() === NATIVE_ETH.toLowerCase();

  // Fetch balance whenever token or wallet changes
  useEffect(() => {
    if (!address || !selectedToken || !publicClient) {
      setRawBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        if (isNativeETH) {
          const bal = await publicClient.getBalance({ address });
          setRawBalance(bal);
        } else {
          const bal = await publicClient.readContract({
            address: selectedToken as `0x${string}`,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
          setRawBalance(bal);
        }
      } catch {
        setRawBalance(null);
      }
    };

    fetchBalance();
  }, [address, selectedToken, publicClient, isNativeETH]);

  // Resolve token metadata when selection changes
  const handleTokenSelect = (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    setAmount('');
    setTxHash(null);
    setError(null);

    const known = KNOWN_TOKENS[tokenAddress.toLowerCase()];
    if (known) {
      setTokenSymbol(known.symbol);
      setTokenDecimals(known.decimals);
    } else {
      setTokenSymbol(tokenAddress.slice(0, 6) + '...');
      setTokenDecimals(18);
    }
  };

  const formattedBalance = rawBalance !== null
    ? parseFloat(formatUnits(rawBalance, tokenDecimals)).toFixed(6)
    : null;

  const handleMax = () => {
    if (rawBalance === null) return;
    setAmount(formatUnits(rawBalance, tokenDecimals));
  };

  const handleSend = async () => {
    if (!walletClient || !publicClient || !address) {
      setError('Wallet not connected'); return;
    }
    if (!isAddress(recipient)) {
      setError('Invalid recipient address'); return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount'); return;
    }
    if (!selectedToken) {
      setError('Select a token'); return;
    }

    setIsSending(true);
    setError(null);
    setTxHash(null);

    try {
      const amountBigInt = parseUnits(amount, tokenDecimals);

      let hash: `0x${string}`;

      if (isNativeETH) {
        // Native ETH — use sendTransaction, NOT writeContract
        hash = await walletClient.sendTransaction({
          to: recipient as `0x${string}`,
          value: amountBigInt,
        });
      } else {
        // ERC-20 — use transfer()
        hash = await walletClient.writeContract({
          address: selectedToken as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, amountBigInt],
        });
      }

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      // Kaydet
      saveTx({
        hash,
        type: 'send',
        tokenIn: tokenSymbol,
        tokenOut: '',
        amountIn: amount,
        timestamp: Date.now(),
        wallet: address.toLowerCase(),
      });
      // Save to Supabase (fire and log errors)
      saveTxToSupabase({
        hash,
        wallet:    address,
        type:      'send',
        token_in:  tokenSymbol,
        token_out: '',
        amount_in: amount,
        timestamp: Date.now(),
      }).catch(console.error);
      updateLeaderboard(address, 'send').catch(console.error);

      // Reset form after success
      setAmount('');
      setRecipient('');

      // Refresh balance
      if (isNativeETH) {
        const bal = await publicClient.getBalance({ address });
        setRawBalance(bal);
      } else {
        const bal = await publicClient.readContract({
          address: selectedToken as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;
        setRawBalance(bal);
      }

    } catch (err) {
      console.error('Send error:', err);
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      if (msg.includes('User rejected') || msg.includes('User denied')) {
        setError('Transaction rejected in wallet.');
      } else if (msg.includes('insufficient funds')) {
        setError('Insufficient balance for this transfer.');
      } else {
        setError(msg.length > 100 ? msg.slice(0, 100) + '…' : msg);
      }
    } finally {
      setIsSending(false);
    }
  };

  const canSend = isConnected && !!selectedToken && isAddress(recipient) && !!amount && parseFloat(amount) > 0 && !isSending;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-orange-100 max-w-md w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Send</h1>

      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">Token</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between bg-orange-50/60 hover:bg-orange-50 px-4 py-3 rounded-xl border border-orange-100 transition-all"
        >
          {selectedToken ? (
            <div className="flex items-center gap-3">
              <TokenLogo address={selectedToken} />
              <div className="text-left">
                <p className="font-semibold text-gray-900">{tokenSymbol}</p>
                {formattedBalance !== null && (
                  <p className="text-xs text-gray-400">Balance: {formattedBalance}</p>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Select token</span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Recipient */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className={`w-full px-4 py-3 bg-orange-50/60 rounded-xl border outline-none transition-all text-sm font-mono
            ${recipient && !isAddress(recipient)
              ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : 'border-orange-100 focus:border-orange-300 focus:ring-2 focus:ring-orange-100'
            }`}
        />
        {recipient && !isAddress(recipient) && (
          <p className="text-xs text-red-500 mt-1">Invalid address</p>
        )}
      </div>

      {/* Amount */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-gray-500">Amount</label>
          {formattedBalance !== null && (
            <button onClick={handleMax} className="text-xs text-orange-600 hover:text-orange-700 font-semibold">
              MAX
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            placeholder="0.0"
            className="w-full px-4 py-3 bg-orange-50/60 rounded-xl border border-orange-100 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all text-2xl font-bold text-gray-900 placeholder-gray-300"
          />
          {tokenSymbol && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
              {tokenSymbol}
            </span>
          )}
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
      >
        {isSending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Sending…
          </span>
        ) : !isConnected ? 'Connect Wallet' : 'Send'}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
          <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-700 text-sm font-medium">
            Transfer successful!{' '}
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              className="underline hover:text-green-800">
              View on BaseScan ↗
            </a>
          </p>
        </div>
      )}

      <TokenSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(token) => { handleTokenSelect(token); setIsModalOpen(false); }}
      />
    </div>
  );
}
