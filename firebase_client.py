import os
import json
import base64
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv  # For local development

load_dotenv()  # Load local .env variables

# Get the Base64 string from the environment variable
firebase_config_b64 = os.getenv("FIREBASE_CONFIG_BASE64")
if not firebase_config_b64:
    raise ValueError("Missing FIREBASE_CONFIG_BASE64 environment variable.")

# Strip any extra whitespace
firebase_config_b64 = firebase_config_b64.strip()

# Check and add missing padding if necessary
missing_padding = len(firebase_config_b64) % 4
if missing_padding:
    firebase_config_b64 += '=' * (4 - missing_padding)

# Decode and parse the JSON credentials
try:
    firebase_config_json = base64.b64decode(firebase_config_b64).decode('utf-8')
except Exception as e:
    raise ValueError(f"Error decoding Base64 string: {e}")

firebase_config = json.loads(firebase_config_json)

# Initialize Firebase Admin if not already initialized.
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred)

# Create and export a Firestore client.
db = firestore.client()
