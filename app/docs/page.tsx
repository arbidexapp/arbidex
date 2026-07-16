import { Navigation } from '@/components/Navigation';
import { DocsLayout } from '@/components/DocsLayout';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <DocsLayout />
    </div>
  );
}
