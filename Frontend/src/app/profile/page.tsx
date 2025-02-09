'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Optionally, you might redirect the user to the login page after sign out.
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // While determining auth state, show a loading indicator.
  if (loading) {
    return (
      <>
        <Navbar isAuthenticated={false} />
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
          <h2 className="text-3xl font-bold text-green-800 mb-6">Profile</h2>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </>
    );
  }

  // If no user is signed in after loading, inform the user.
  if (!user) {
    return (
      <>
        <Navbar isAuthenticated={false} />
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
          <h2 className="text-3xl font-bold text-green-800 mb-6">Profile</h2>
          <p className="text-lg text-gray-600">
            No user information available. Please log in.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar isAuthenticated={true} />
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-100">
        <h2 className="text-3xl font-bold text-green-800 mb-6">Your Profile</h2>
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full border border-green-700">
          <p className="text-lg text-green-900">
            <span className="font-bold">Name: </span>
            {user.displayName || 'No name provided'}
          </p>
          <p className="text-lg text-green-900 mt-4">
            <span className="font-bold">Email: </span>
            {user.email}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full mt-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfilePage; 