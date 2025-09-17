"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Caricamento...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Il middleware reindirizza automaticamente
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              La Mia App
            </h1>
            <UserButton afterSignOutUrl="/signin" />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <WelcomeMessage user={user} />
        </div>
      </main>
    </div>
  );
}

function WelcomeMessage({ user }: { 
  user: UserResource | null | undefined
}) {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Benvenuto!
      </h2>
      {user && (
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Ciao {user.firstName || user.emailAddresses?.[0]?.emailAddress}! 
          Sei autenticato con successo!
        </p>
      )}
    </div>
  );
}
