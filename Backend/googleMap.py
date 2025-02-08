import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from flask import Flask, request, jsonify

#load environment variables from .env file
load_dotenv()

#initialize the Firebase Admin SDK with a service account key.
SERVICE_ACCOUNT_KEY_PATH = os.getenv("SERVICE_ACCOUNT_KEY_PATH")
if not SERVICE_ACCOUNT_KEY_PATH:
    raise ValueError("Please set SERVICE_ACCOUNT_KEY_PATH in your .env file.")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred)

#get a Firestore client
db = firestore.client()

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

        title = data.get("title", doc.id)
        lat = data.get("latitude")
        lng = data.get("longitude")

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

def add_marker(title, latitude, longitude):
    """
    Adds a new marker directly without using request.get_json().
    
    Parameters:
        title (str): Name of the marker.
        latitude (float): Latitude coordinate.
        longitude (float): Longitude coordinate.
    
    Returns:
        dict: The created marker data.
    """
    if title is None or latitude is None or longitude is None:
        return {'error': 'Missing required fields: title, latitude, and longitude'}

    marker_data = {
        'title': title,
        'latitude': latitude,
        'longitude': longitude,
    }

    doc_ref = db.collection('markers').document()
    doc_ref.set(marker_data)

    marker_data['id'] = doc_ref.id

    return marker_data 


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

def delete_marker(title, lat, lng):
    """
    Deletes a marker from the 'markers' collection in Firestore.

    Parameters:
        title (str): Name of the marker to delete.
        lat (float): Latitude coordinate of the marker.
        lng (float): Longitude coordinate of the marker.

    Returns:
        dict: A dictionary with the result of the deletion operation.
    """
    if title is None or lat is None or lng is None:
        return {'error': 'Missing required fields: title, latitude, and longitude'}
    
    markers_ref = db.collection('markers')
    query = (
        markers_ref
        .where('title', '==', title)
        .where('latitude', '==', lat)
        .where('longitude', '==', lng)
    )

    docs = query.stream()

    deleted = False
    for doc in docs:
        doc.reference.delete()
        deleted = True
        break 

    if deleted:
        return {'success': f'Marker "{title}" at ({lat}, {lng}) deleted.'}
    
    return {'error': f'Marker "{title}" at ({lat}, {lng}) not found.'}


