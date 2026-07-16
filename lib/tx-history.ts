export type TxType = 'swap' | 'send';

export interface TxRecord {
  hash: string;
  type: TxType;
  tokenIn: string;   // symbol
  tokenOut: string;  // symbol (swap) or '' (send)
  amountIn: string;  // human readable
  timestamp: number; // unix ms
  wallet: string;    // lowercase adres
}

const KEY = 'arbidex_tx_history';
const MAX = 200;

function load(): TxRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(records: TxRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX)));
}

export function saveTx(record: TxRecord) {
  const existing = load();
  // skip if same hash already exists
  if (existing.some((r) => r.hash === record.hash)) return;
  save([record, ...existing]);
  // notify listeners on the same tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('arbidex_tx_update'));
  }
}

export function getTxHistory(wallet: string): TxRecord[] {
  return load().filter((r) => r.wallet === wallet.toLowerCase());
}
