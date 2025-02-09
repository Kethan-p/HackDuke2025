'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { signOut, User } from 'firebase/auth';
import axios from 'axios';
import PlantCard from '../plantcard';

// Define a type for the reports array elements
interface Report {
  plant_name: string;
  lat: string;
  lng: string;
  img_path: string;
  description: string;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Use our Report type here
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch user reports by email
      axios
        .get(`/getUserReportsInfo/${user.email}`)
        .then((response) => {
          // Ensure we map the incoming data to our Report interface (if needed).
          setReports(response.data);
        })
        .catch(console.error);
    }
  }, [user]);

  const handleDeleteReport = (
    name: string,
    latitude: string,
    longitude: string
  ) => {
    setReports((prev) =>
      prev.filter(
        (report) =>
          !(
            report.plant_name === name &&
            report.lat === latitude &&
            report.lng === longitude
          )
      )
    );
  };

  const handleCloseReport = (
    name: string,
    latitude: string,
    longitude: string
  ) => {
    setReports((prev) =>
      prev.filter(
        (report) =>
          !(
            report.plant_name === name &&
            report.lat === latitude &&
            report.lng === longitude
          )
      )
    );
  };

  if (loading) {
    return (
      <>
        <Navbar isAuthenticated={false} />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-100">
          <p className="text-lg text-gray-600">Loading profile...</p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar isAuthenticated={false} />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-100">
          <h2 className="text-3xl font-bold text-green-800 mb-6">Profile</h2>
          <p className="text-lg text-gray-600">
            Please log in to view your profile
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar isAuthenticated={true} />
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-green-800 text-center mb-8 pt-6">
            Your Profile
          </h1>

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-green-100 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">
                  Full Name
                </label>
                <p className="text-lg text-green-900 p-3 bg-green-50 rounded-lg">
                  {user.displayName || 'Not provided'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">
                  Email Address
                </label>
                <p className="text-lg text-green-900 p-3 bg-green-50 rounded-lg">
                  {user.email}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">
                  Account Since
                </label>
                <p className="text-lg text-green-900 p-3 bg-green-50 rounded-lg">
                  {new Date(user.metadata.creationTime!).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Sign-out error:', error);
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.01]"
            >
              Sign Out
            </button>
          </div>

          {/* User Posts Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-green-800 mb-6 text-center">
              Your Plant Reports
            </h2>

            {reports.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-green-100">
                <p className="text-gray-600 text-lg">
                  No reports submitted yet. Start by reporting an invasive
                  plant!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <PlantCard
                    key={`${report.plant_name}-${report.lat}-${report.lng}`}
                    name={report.plant_name}
                    image={report.img_path}
                    latitude={report.lat}
                    longitude={report.lng}
                    description={report.description}
                    onClose={() =>
                      handleCloseReport(report.plant_name, report.lat, report.lng)
                    }
                    onDelete={handleDeleteReport}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
