'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebase';
import { User } from 'firebase/auth';
import Navbar from '../components/Navbar';




function CameraReport() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }, []);

    
      

  // Set the user's email (update this as needed)

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
              formData.append('email', user!.email!);         // Assert that user.email is not null.
              formData.append('lat', lat.toString());          // Convert the number to a string.
              formData.append('lng', lng.toString());      
              const url = `/create_report`;

              // Post the FormData to the backend using axios.
              axios.post(url, formData, {
                  headers: { 'Content-Type': '/form-data' },
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
  const email = user.email;


  return (
    <div>
      <h2>Submit Invasive Plant Report</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <video ref={videoRef} autoPlay playsInline style={{ width: '400px' }} />
      {/* Hidden canvas used only for capturing the snapshot */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <br />
      <button onClick={captureAndSubmit}>Capture and Submit Report</button>
    </div>
  );
}

export default CameraReport;
