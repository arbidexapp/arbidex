import { Navigation } from '@/components/Navigation';
import { SendInterface } from '@/components/SendInterface';

export default function SendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <SendInterface />
        </div>
      </main>
    </div>
  );
}
