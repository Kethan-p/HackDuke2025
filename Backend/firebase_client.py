import os
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin if not already initialized.
if not firebase_admin._apps:
    cred = credentials.Certificate(os.getenv("SERVICE_ACCOUNT_KEY_PATH"))  # Ensure the env variable is set
    firebase_admin.initialize_app(cred)

# Create and export a Firestore client.
db = firestore.client()
