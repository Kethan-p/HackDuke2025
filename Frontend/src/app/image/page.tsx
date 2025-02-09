'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Image from 'next/image';

function CameraReport() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Listen for auth state changes.
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Request access to the camera when the component mounts.
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access the camera: ' + err);
      }
    }
    startCamera();
  }, []);

  // Capture the image, get geolocation, and post to the backend.
  const captureAndSubmit = () => {
    setError('');
    setMessage('');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Set the canvas dimensions to match the video.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the user's geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Convert the canvas image to a Blob (as a PNG image).
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                setError('Error capturing image.');
                return;
              }

              // Create a File object from the Blob (to include a filename).
              const file = new File([blob], 'capture.png', { type: 'image/png' });
              // Create FormData and append the image file.
              const formData = new FormData();
              formData.append('image', file);
              formData.append('email', user!.email!);
              formData.append('lat', lat.toString());
              formData.append('lng', lng.toString());
              const url = `${backendUrl}/create_report`;

              // Post the FormData to the backend using axios.
              axios
                .post(url, formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                })
                .catch((err) => {
                  console.error('Error submitting report:', err);
                  setError('Error submitting report: ' + err.message);
                });
            },
            'image/png'
          );
        },
        (geoError) => {
          console.error('Error getting geolocation:', geoError);
          setError('Error obtaining geolocation: ' + geoError.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  if (!user || !user.email) {
    return <p>Loading user information...</p>;
  }

  return (
    <div className="min-h-screen relative bg-black">
      {/* Fixed Navbar overlay */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <Navbar
          isAuthenticated={true}
          displayName={user ? (user.displayName || user.email) : undefined}
        />
      </div>

      {/* Fullscreen video container */}
      <div className="w-full h-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Optional overlay messages */}
        {error && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-red-600">
            {error}
          </div>
        )}
        {message && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-green-600">
            {message}
          </div>
        )}

        {/* New capture button: a larger dark green circle with the camera image */}
        <button
          onClick={captureAndSubmit}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-[104px] h-[104px] rounded-full bg-green-700 hover:bg-green-800 shadow-lg"
        >
          <Image src="/green_camera.png" alt="Capture Report" width={60} height={60} />
        </button>
      </div>
    </div>
  );
}

export default CameraReport;