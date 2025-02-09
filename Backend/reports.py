import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from flask import Flask, request, jsonify

# Load environment variables from .env file.
load_dotenv()

# Initialize the Firebase Admin SDK with a service account key.
from firebase_client import db

def storeInfo(User_Email, plant_name, image_data, lat, lng, description, invasive_info, is_removed=False):
    """
    Stores plant information in Firestore under the 'plant_info' collection.

    Parameters:
        User_Email (str): Email of the user who submitted the report.
        plant_name (str): The identified name of the plant.
        image_data (binary): The binary data of the plant image.
        lat (str or float): The latitude coordinate.
        lng (str or float): The longitude coordinate.
        description (str): A description of the plant/report.
        invasive_info (str): Additional invasive plant information (e.g. risk level).
        is_removed (bool): Whether the marker is marked as removed.

    Returns:
        None
    """
    try:
        
        plant_data = {
            'userEmail': User_Email,
            'plant_name': plant_name,
            'image': image_data,  # Store the Firestore Blob in the document.
            'lat': str(lat),      # Storing as string; conversion happens on retrieval.
            'lng': str(lng),
            'description': description,
            'invasive_info': invasive_info,
            'removed': is_removed,
        }
        
        # Add a new document with an auto-generated ID in the 'plant_info' collection.
        db.collection('plant_info').add(plant_data)
        print("Plant information stored successfully.")
        
    except Exception as e:
        print(f"Error storing plant information: {e}")

def getUserReportsInfo(email):
    """
    Retrieves user reports (plant info) based on the user's email.

    Parameters:
        email (str): The user's email.

    Returns:
        A list of plant information dictionaries or a JSON error response.
    """
    users_ref = db.collection('plant_info') 
    query = users_ref.where('userEmail', '==', email).stream()

    user_data = []
    for doc in query:
        data = doc.to_dict()
        data["id"] = doc.id  
        user_data.append(data)

    if user_data:
        return user_data
    else:
        return jsonify({'error': 'User not found'}), 404

def getMarkerInfo(lat, lng, NameOfPlant):
    """
    Retrieves marker information from Firestore based on latitude, longitude, and plant name.

    Parameters:
        lat (str or float): The latitude coordinate.
        lng (str or float): The longitude coordinate.
        NameOfPlant (str): The name of the plant.

    Returns:
        A list of matching marker data dictionaries if found, otherwise a JSON error response.
    """
    try:
        markers_ref = db.collection('plant_info')
        query = markers_ref.where('lat', '==', str(lat)) \
                           .where('lng', '==', str(lng)) \
                           .where('plant_name', '==', NameOfPlant) \
                           .stream()
        
        marker_data = []
        for doc in query:
            data = doc.to_dict()
            data['id'] = doc.id
            marker_data.append(data)
        
        if marker_data:
            return marker_data
        else:
            return jsonify({'error': 'Marker not found'}), 404
    except Exception as e:
        print(f"Error retrieving marker information: {e}")
        return jsonify({'error': f"Error retrieving marker information: {e}"}), 500

def getMarkers():
    """
    Queries the 'plant_info' collection in Firestore and returns a list of POI dictionaries for invasive markers
    that are not marked as removed.

    Each POI dictionary is in the form:
      {
        "key": <string>,         # The plant name (or document ID if plant_name is missing)
        "location": {
          "lat": <float>,        # Latitude value
          "lng": <float>         # Longitude value
        }
      }

    Only documents with a non-empty 'invasive_info' field and 'removed' == False are returned.
    """
    try:
        markers_ref = db.collection('plant_info')
        # Query for documents where removed is False.
        # We assume that a non-empty invasive_info (i.e. greater than empty string) indicates an invasive plant.
        query = markers_ref.where('removed', '==', False).where('invasive_info', '>', '')
        docs = query.stream()

        poi_list = []
        for doc in docs:
            data = doc.to_dict()

            # Use 'plant_name' if available, otherwise fall back to document ID.
            key = data.get('plant_name', doc.id)
            lat = data.get('lat')
            lng = data.get('lng')

            # Skip if coordinates are missing.
            if lat is None or lng is None:
                continue

            poi = {
                "key": key,
                "location": {
                    "lat": float(lat),
                    "lng": float(lng)
                }
            }
            poi_list.append(poi)
        
        return poi_list
    except Exception as e:
        print(f"Error retrieving markers: {e}")
        return jsonify({'error': f"Error retrieving markers: {e}"}), 500

def markMarkerAsRemoved(marker_id, is_removed=True):
    """
    Updates the 'removed' status of a marker in Firestore.

    Parameters:
        marker_id (str): The Firestore document ID of the marker.
        is_removed (bool): True if the marker is removed; False otherwise.

    Returns:
        A dictionary with a success message or an error message.
    """
    try:
        marker_ref = db.collection('plant_info').document(marker_id)
        marker_ref.update({'removed': is_removed})
        print("Marker updated successfully.")
        return {"message": "Marker updated successfully"}
    except Exception as e:
        print(f"Error updating marker: {e}")
        return {"error": f"Error updating marker: {e}"}


