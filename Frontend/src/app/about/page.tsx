'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import Image from 'next/image';

const AboutPage: React.FC = () => {
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

  // While determining auth state, show a loading indicator.
  if (loading) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-20">
          <Navbar isAuthenticated={false} />
        </div>
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 font-serif pt-24">
          <h2 className="text-3xl font-bold text-green-800 mb-6">About Us</h2>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Fixed Navbar container (same as in the maps page) */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <Navbar
          isAuthenticated={true}
          displayName={user ? (user.displayName ?? user.email ?? undefined) : undefined}
        />
      </div>

      {/* Page content container with top padding to prevent overlap with fixed Navbar */}
      <div className="min-h-screen p-6 bg-green-100 font-serif pt-24">
        {/* Mission Statement Section */}
        <section className="max-w-3xl mx-auto mb-10 mt-19">
          <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">Our Mission</h2>
          <p className="text-lg text-green-700 leading-relaxed">
            At Path and Petal, we believe in the power of technology to protect and preserve our planet. Our mission is to empower outdoor enthusiasts, conservationists, and communities to combat the spread of invasive plant species through accessible, user-driven data collection. By mapping and monitoring these threats, we aim to safeguard native ecosystems, promote biodiversity, and ensure that future generations can continue to explore and enjoy the beauty of nature.
          </p>
        </section>

        {/* Team Members Section */}
        <section className="max-w-5xl mx-auto mb-8">
          <h2 className="text-3xl font-bold text-green-800 mb-4 text-center">Meet the Team</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex flex-col items-center">
              <Image src="/charles.png" alt="Charles Kirby" width={165} height={165} className="rounded-lg" />
              <p className="mt-2 text-green-800 font-semibold">Charles Kirby</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src="/daniel.png" alt="Daniel Cohen" width={165} height={165} className="rounded-lg" />
              <p className="mt-2 text-green-800 font-semibold">Daniel Cohen</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src="/billy.png" alt="Billy McCune" width={165} height={165} className="rounded-lg" />
              <p className="mt-2 text-green-800 font-semibold">Billy McCune</p>
            </div>
            <div className="flex flex-col items-center">
              <Image src="/kethan.png" alt="Kethan Poduri" width={165} height={165} className="rounded-lg" />
              <p className="mt-2 text-green-800 font-semibold">Kethan Poduri</p>
            </div>
          </div>
        </section>

        {/* About Us Text Section */}
        <section className="max-w-3xl mx-auto mt-6">
          <p className="text-lg text-green-700 leading-relaxed">
            We are a team of four computer science students at Duke University who love spending time in nature and want to use our skills to make a difference. Path and Petal provides a simple yet effective tool for hikers, environmentalists, and conservationists to fight the spread of invasive plant life. By crowdsourcing data and visualizing invasive plant populations on an interactive map, our goal is to raise awareness and encourage hands-on conservation efforts.
          </p>
          <p className="mt-2 text-lg text-green-700 leading-relaxed">
            Together, we can help restore balance to our environment—one hike and one photo at a time!
          </p>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
