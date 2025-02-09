'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import Navbar from '../components/Navbar'; // ✅ Import the Navbar

const LoginPage: React.FC = () => {
  const router = useRouter();

  // ✅ Add missing state variables
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [hometown, setHometown] = useState<string>('');
  const isAuthenticated = false; // ✅ Ensure login page does NOT show profile or navigation links

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || (isRegistering && (!name || !hometown))) {
      alert(
        isRegistering
          ? 'Please enter full name, hometown, email, and password.'
          : 'Please enter both email and password.'
      );
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log('User account created:', userCredential.user);

        await updateProfile(userCredential.user, { displayName: name });
        console.log('Hometown provided:', hometown);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log('User signed in:', userCredential.user);
      }
      router.push('/map');
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Authentication error:', error);
      alert(errorMessage);
    }
  };

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} /> {/* ✅ Navbar added */}
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/forest-background.jpg')" }}
      >
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full border border-green-700">
          <h2 className="text-3xl font-bold text-green-800 mb-2 text-center">
            {isRegistering ? 'Create an Account' : 'Welcome Back!'}
          </h2>
          <p className="text-center text-green-600 mb-4 italic">
            {isRegistering
              ? 'Join our community of forest explorers'
              : 'Log in to continue your adventure'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Hometown"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  required
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition"
            >
              {isRegistering ? 'Sign Up' : 'Login'}
            </button>
          </form>
          <p className="text-green-800 mt-4 text-center">
            {isRegistering
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              type="button"
              className="text-green-600 font-semibold hover:underline"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
