import { Navigation } from '@/components/Navigation';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-orange-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile</h1>
          <p className="text-gray-600">Manage your account settings. Coming soon...</p>
        </div>
      </main>
    </div>
  );
}
