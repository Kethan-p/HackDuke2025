import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()  # Load local .env variables

# Get the Base64-encoded JSON string from the environment variable.
firebase_config_b64 = os.getenv("FIREBASE_CONFIG_BASE64")
if not firebase_config_b64:
    raise ValueError("Missing FIREBASE_CONFIG_BASE64 environment variable.")

# Decode the Base64 string to get the JSON string.
firebase_config_json = base64.b64decode(firebase_config_b64).decode('utf-8')

# Parse the JSON string.
firebase_config = json.loads(firebase_config_json)

# Initialize Firebase Admin with the parsed credentials.
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred)

# Create and export a Firestore client.
db = firestore.client()
