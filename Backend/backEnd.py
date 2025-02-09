from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import prof as userprofile
import idplant as idplant
import checkinvasive as ci
import reports as rp
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)
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

# Modified route: remove the image path parameter since we expect the image file in the POST body.
@app.route('/create_report/<email>/<lat>/<lng>/', methods=['POST'])
def create_report(email, lat, lng):
    """
    Processes a new invasive plant report by:
      1. Reading the image from the POST request.
      2. Ensuring the image is in JPEG or PNG format.
      3. Creating a Firestore Blob from the (converted) image data.
      4. Passing a file-like object to the plant identification function.
      5. Storing the report in Firestore via the rp module.
    """
    # Retrieve the image file from the request (expecting key 'image').
    image_file = request.files.get("image")
    if not image_file:
        return jsonify({"error": "No image provided"}), 400

    # Read the image file data.
    image_data = image_file.read()

    # Use BytesIO to work with the image data.
    image_stream = BytesIO(image_data)
    try:
        img = Image.open(image_stream)
    except Exception as e:
        return jsonify({"error": "Invalid image file"}), 400

    # Check the image format. If it's not JPEG or PNG, convert it to JPEG.
    if img.format not in ["JPEG", "PNG"]:
        output = BytesIO()
        # JPEG does not support transparency so convert the image to RGB if needed.
        if img.mode != "RGB":
            img = img.convert("RGB")
        img.save(output, format="JPEG")
        output.seek(0)
        image_for_plant = output
        # Use the converted bytes for storage.
        converted_data = output.getvalue()
        image_blob = firestore.Blob(converted_data)
    else:
        # The image is already JPEG or PNG.
        image_for_plant = BytesIO(image_data)
        image_blob = firestore.Blob(image_data)

    # Now, pass the file-like object (guaranteed to be JPEG or PNG) to the plant identification function.
    plantResult = idplant.getPlant(image_for_plant)
    if not plantResult[0]:
        return jsonify({"error": "Not a plant"}), 400

    # Check invasive information.
    invasiveResult = ci.check_invasive_plant(plantResult[1], lat, lng)
    if invasiveResult[0] == "Not a plant":
        return jsonify({"error": "Not a plant"}), 400

    # Store the report in Firestore via your reports module.
    rp.storeInfo(
        user_email=email,
        plant_name=plantResult[1],
        image=image_blob,  # This is the Firestore Blob (converted or original).
        lat=lat,
        lng=lng,
        description=invasiveResult[1],
        invasive_info=invasiveResult[0]
    )
    
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
