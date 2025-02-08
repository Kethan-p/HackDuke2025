import React, { useEffect, useState } from 'react';
import { auth } from '../firebase'; // Adjust the import path as needed
import { onAuthStateChanged, User } from 'firebase/auth';

const MapPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const username = user ? (user.displayName || user.email) : 'Guest';

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-green-800 mb-4">Forest Map</h2>
      
      <p className="mb-4 text-lg">
        Welcome, <span className="font-semibold">{username}</span>!
      </p>

      <div className="w-full h-96 border-2 border-dashed border-gray-300 flex items-center justify-center">
        <p className="text-gray-500">Map would display here</p>
      </div>
    </div>
  );
};

export default MapPage;
