import { Navigation } from '@/components/Navigation';
import { TransactionHistory } from '@/components/TransactionHistory';

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TransactionHistory />
      </main>
    </div>
  );
}
