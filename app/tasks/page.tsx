import { Navigation } from '@/components/Navigation';
import { TasksRewards } from '@/components/TasksRewards';

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <TasksRewards />
      </main>
    </div>
  );
}
