from flask import Flask, render_template, request, redirect, url_for, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import googleMap as gm
import prof as userprofile

app = Flask(__name__)

# Initialize Firebase Admin with your service account key.
cred = credentials.Certificate("path/to/serviceAccountKey.json")  # <-- Update this path
firebase_admin.initialize_app(cred)

# Create a Firestore client.
db = firestore.client()

@app.route('/')
def index():
    # Retrieve all marker documents from the 'markers' collection.
    markers_ref = db.collection('markers')
    marker_docs = markers_ref.stream()

    markers = []
    for doc in marker_docs:
        marker_data = doc.to_dict()
        # Include the Firestore document ID in the data.
        marker_data["id"] = doc.id
        markers.append(marker_data)

    return render_template('index.html', markers=markers)

    

@app.route('/add_marker', methods=['POST'])
def add_marker():
    gm.add_marker(request.form['name'], request.form['lat'], request.form['lng'])
    return redirect(url_for('index'))

@app.route('/get_marker/<marker_id>', methods=['GET'])
def get_marker(marker_id):
    # Query Firestore for the marker with the given ID.
    doc_ref = db.collection('markers').document(marker_id)
    doc = doc_ref.get()
    if doc.exists:
        marker = doc.to_dict()
        marker["id"] = doc.id
        return jsonify(marker)
    else:
        return jsonify({'error': 'Marker not found'}), 404
    
@app.route('delete_marker/name/lat/lng')
def delete_marker(name,lat,lng):
    gm.delete_marker(name,lat,lng)
    return redirect(url_for('index'))

@app.route('getMarkers', methods=['GET'])
def getMarkers():
    return jsonify(gm.getMarkers())

@app.route('/getProfileInfo/<email>', methods=['GET'])
def getProfileInfo(email):
    return userprofile.getProfileInfo(email)


if __name__ == '__main__':
    app.run(debug=True)


