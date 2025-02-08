from flask import Flask, render_template, request, redirect, url_for, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import prof as userprofile
import idplant as idplant
import checkinvasive as ci
import reports as rp

app = Flask(__name__)

# Initialize Firebase Admin with your service account key.
cred = credentials.Certificate("path/to/serviceAccountKey.json")  # <-- Update this path
firebase_admin.initialize_app(cred)

# Create a Firestore client.
db = firestore.client()

@app.route('/')
def index():
    """
    Displays the index page. In this example, we query the 'markers' collection
    (which might be used for non-invasive markers or different mapping data)
    and pass them to the template.
    """
    markers = rp.getMarkers()

    return render_template('index.html', markers=markers)

@app.route('/create_report/<email>/<img_path>/<lat>/<lng>/', methods=['POST'])
def create_report(email, img_path, lat, lng):
    """
    Processes a new invasive plant report. It:
      1. Identifies the plant using the provided image.
      2. Checks whether it is invasive.
      3. Adds a marker to the map.
      4. Stores the report in Firestore.
    
    The URL parameters include the reporting user's email, the image path,
    and the coordinates (latitude and longitude).
    """
    # Identify the plant.
    plantResult = idplant.getPlant(img_path)
    if plantResult[0]:
        # Check invasive information (assumes check_invasive_plant returns a tuple
        # where the first element indicates the invasive status and the second a description).
        invasiveResult = ci.check_invasive_plant(plantResult[1], lat, lng)
    else:
        return jsonify({"error": "Not a plant"}), 400

    # If the invasive check indicates "Not a plant", abort.
    if invasiveResult[0] == "Not a plant":
        return jsonify({"error": "Not a plant"}), 400

    # Store the report in Firestore using your reports module.
    rp.storeInfo(email, plantResult[1], img_path, lat, lng, invasiveResult[1], invasiveResult[0])
    return redirect(url_for('index'))

@app.route('/getUserReportsInfo/<email>', methods=['GET'])
def get_user_reports_info(email):
    """
    Returns all reports for the given user (based on email) as JSON.
    """
    return jsonify(rp.getUserReportsInfo(email))

@app.route('/getMarkerInfo/<lat>/<lng>/<nameOfPlant>', methods=['GET'])
def get_marker_info(lat, lng, nameOfPlant):
    """
    Returns marker information for a specific invasive plant report identified by its
    latitude, longitude, and plant name.
    """
    info = rp.getMarkerInfo(lat, lng, nameOfPlant)
    return jsonify(info)

@app.route('/getPlantInfoandCreateReport/<img_path>/<lat>/<lng>/email', methods=['GET'])
def get_plant_info(img_path, lat, lng,email):
    """
    Alternative endpoint to process a plant image:
      1. Identify the plant.
      2. Check if it is invasive.
      3. Add a map marker.
      4. Store the report in Firestore.
    
    Since no user email is provided here, a default email is used.
    """
    plantResult = idplant.getPlant(img_path)
    if plantResult[0]:
        invasiveResult = ci.check_invasive_plant(plantResult[1], lat, lng)
    else:
        return jsonify({"error": "Not a plant"}), 400

    if invasiveResult[0] == "Not a plant":
        return jsonify({"error": "Not a plant"}), 400
    # Use a default email since none is provided.
    rp.storeInfo(email, plantResult[1], img_path, lat, lng, invasiveResult[1], invasiveResult[0])
    return jsonify({"message": "Plant info stored successfully"})

@app.route('/get_marker/<marker_id>', methods=['GET'])
def get_marker(marker_id):
    """
    Retrieves a single marker (report) from Firestore based on its document ID.
    """
    try:
        doc_ref = db.collection('plant_info').document(marker_id)
        doc = doc_ref.get()
        if doc.exists:
            marker = doc.to_dict()
            marker["id"] = doc.id
            return jsonify(marker)
        else:
            return jsonify({'error': 'Marker not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_marker/<name>/<lat>/<lng>', methods=['DELETE'])
def delete_marker(name, lat, lng):
    """
    Marks a marker as removed. This endpoint queries Firestore for reports that match
    the provided plant name and coordinates, then updates their 'removed' field.
    Removed markers will no longer be returned by the /getMarkers endpoint.
    """
    try:
        markers_ref = db.collection('plant_info')
        query = markers_ref.where('plant_name', '==', name) \
                           .where('lat', '==', str(lat)) \
                           .where('lng', '==', str(lng)).stream()
        found = False
        for doc in query:
            rp.markMarkerAsRemoved(doc.id, True)
            found = True
        if found:
            return jsonify({"message": "Marker(s) marked as removed"})
        else:
            return jsonify({"error": "No marker found with provided criteria"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getMarkers', methods=['GET'])
def get_markers():
    """
    Returns a list of invasive plant markers that have not been marked as removed.
    Each marker is formatted as a point of interest (POI) with a key and location.
    """
    markers = rp.getMarkers()
    return jsonify(markers)

@app.route('/getProfileInfo/<email>', methods=['GET'])
def get_profile_info(email):
    """
    Returns the user profile information for the specified email.
    """
    return userprofile.getProfileInfo(email)

if __name__ == '__main__':
    app.run(debug=True)
