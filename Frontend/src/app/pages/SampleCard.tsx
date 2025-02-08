import React, { useState } from "react";
import PlantCard from "../plantcard";

const PlantCardPage: React.FC = () => {
  const [showCard, setShowCard] = useState(true);

  const samplePlant = {
    name: "Japanese Knotweed",
    image: "Frontend/public/globe.svg",
    latitude: 40.7128,
    longitude: -74.006,
    description: "An aggressive plant that damages buildings and waterways.",
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
        />
      )}
      {!showCard && <p className="text-gray-500 mt-4">Card closed</p>}
    </div>
  );
};

export default PlantCardPage;
