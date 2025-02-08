interface PlantCardProps {
  name: string;
  image: string;
  latitude: number;
  longitude: number;
  description: string;
  onClose: () => void;
  onDelete: (name: string, latitude: number, longitude: number) => void; // Function to delete the marker
}

const PlantCard: React.FC<PlantCardProps> = ({ name, image, latitude, longitude, description, onClose, onDelete }) => {
  return (
    <div className="relative bg-white shadow-lg rounded-lg p-4 w-80 mx-auto mt-10">
      <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
        ❌
      </button>
      <img src={image} alt={name} className="w-full h-40 object-cover rounded-lg" />
      <h2 className="text-lg font-bold mt-2">{name}</h2>
      <p className="text-gray-600 text-sm">📍 {latitude}, {longitude}</p>
      <p className="mt-2 text-gray-700">{description}</p>
      
      <button
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md w-full hover:bg-red-600"
        onClick={() => onDelete(name, latitude, longitude)}
      >
        Delete Marker
      </button>
    </div>
  );
};

export default PlantCard;
