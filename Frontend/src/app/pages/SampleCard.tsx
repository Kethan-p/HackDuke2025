import React, { useState } from "react";
import axios from "axios";
import PlantCard from "../plantcard";

const PlantCardPage: React.FC = () => {
  const [showCard, setShowCard] = useState(true);

  const samplePlant = {
    name: "Japanese Knotweed",
    image: "https://example.com/knotweed.jpg",
    latitude: 40.7128,
    longitude: -74.006,
    description: "An aggressive plant that damages buildings and waterways.",
  };

  // Function to delete the marker by sending a POST request to the backend
  const deleteMarker = async (name: string, latitude: number, longitude: number) => {
    try {
      // POST request to the Flask API to delete the marker
      const response = await axios.post("http://localhost:5000/delete-marker", {
        latitude,
        longitude,
      });

      // Handle success response
      console.log("Delete response:", response.data);
      setShowCard(false); // Hide the card after deletion
    } catch (error) {
      // Handle error
      console.error("Error deleting marker:", error);
      alert("Error deleting marker. Try again later.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Sample Plant Card</h1>
      {showCard && (
        <PlantCard
          name={samplePlant.name}
          image={samplePlant.image}
          latitude={samplePlant.latitude}
          longitude={samplePlant.longitude}
          description={samplePlant.description}
          onClose={() => setShowCard(false)}
          onDelete={deleteMarker}
        />
      )}
      {!showCard && <p className="text-gray-500 mt-4">Marker deleted. Refresh to add again.</p>}
    </div>
  );
};

export default PlantCardPage;
