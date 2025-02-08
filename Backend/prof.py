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

def getProfileInfo(email):
    """
    Retrieves user profile information based on their email.

    Parameters:
        email (str): The email of the user.

    Returns:
        JSON response with user profile data or an error message.
    """
    users_ref = db.collection('users') 
    query = users_ref.where('email', '==', email).stream()

    user_data = None
    for doc in query:
        user_data = doc.to_dict()
        user_data["id"] = doc.id  
        break  

    if user_data:
        return jsonify(user_data)
    else:
        return jsonify({'error': 'User not found'}), 404