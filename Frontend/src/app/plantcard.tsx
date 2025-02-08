import React from "react";

interface PlantCardProps {
  name: string;
  image: string;
  latitude: number;
  longitude: number;
  description: string;
  onClose: () => void;
}

const PlantCard: React.FC<PlantCardProps> = ({ name, image, latitude, longitude, description, onClose }) => {
  return (
    <div className="absolute top-10 left-10 bg-white shadow-lg rounded-lg p-4 w-80 z-50">
      <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
        ❌
      </button>
      <img src={image} alt={name} className="w-full h-40 object-cover rounded-lg" />
      <h2 className="text-lg font-bold mt-2">{name}</h2>
      <p className="text-gray-600 text-sm">📍 {latitude}, {longitude}</p>
      <p className="mt-2 text-gray-700">{description}</p>
    </div>
  );
};

export default PlantCard;