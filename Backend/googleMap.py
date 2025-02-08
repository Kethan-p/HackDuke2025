import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from flask import Flask, request, jsonify

# Load environment variables from .env file
load_dotenv()

# Initialize the Firebase Admin SDK with a service account key.
SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH")
if not SERVICE_ACCOUNT_KEY_PATH:
    raise ValueError("Please set SERVICE_ACCOUNT_KEY_PATH in your .env file.")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred)

# Get a Firestore client
db = firestore.client()

# Initialize Flask app
app = Flask(__name__)

def getMarkers():
    """
    Queries the 'markers' collection in Firestore and returns a list of POI dictionaries.
    
    Each POI dictionary is in the form:
      {
        "key": <string>,         # The title (or document ID if title is missing)
        "location": {
          "lat": <float>,        # Latitude value
          "lng": <float>         # Longitude value
        }
      }
    """
    markers_ref = db.collection('markers')
    docs = markers_ref.stream()

    poi_list = []
    for doc in docs:
        data = doc.to_dict()
        # Use the document's title as the key if available; otherwise, fallback to the document ID.
        title = data.get("title", doc.id)
        lat = data.get("latitude")
        lng = data.get("longitude")

        # Skip documents with missing coordinate data.
        if lat is None or lng is None:
            continue

        poi = {
            "key": title,
            "location": {
                "lat": lat,
                "lng": lng
            }
        }
        poi_list.append(poi)
    
    return poi_list

@app.route('/markers', methods=['POST'])
def add_marker():
    """
    POST endpoint to add a new marker.
    
    Expected JSON payload:
      {
        "title": "NameOfMarker",
        "latitude": <float>,
        "longitude": <float>
      }
    
    Returns the created marker data with its Firestore document ID.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate required fields
    title = data.get('title')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if title is None or latitude is None or longitude is None:
        return jsonify({
            'error': 'Missing required fields: title, latitude, and longitude'
        }), 400

    marker_data = {
        'title': title,
        'latitude': latitude,
        'longitude': longitude,
    }

    # Create a new document in the 'markers' collection with an auto-generated ID.
    doc_ref = db.collection('markers').document()
    doc_ref.set(marker_data)

    # Optionally, include the document ID in the returned data.
    marker_data['id'] = doc_ref.id

    return jsonify(marker_data), 201

@app.route('/markers', methods=['GET'])
def get_markers_json():
    """
    GET endpoint to retrieve all markers.
    Returns markers in the format:
      [
         {
             "key": "marker title",
             "location": { "lat": latitude, "lng": longitude }
         },
         ...
      ]
    """
    return jsonify(getMarkers())

if __name__ == "__main__":
    # Run the Flask development server
    app.run(debug=True)
