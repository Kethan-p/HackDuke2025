import requests
from dotenv import load_dotenv
import os
import json
from pprint import pprint

# Returns a tuple of (Boolean, string)
# Boolean indicates if the image is recognized as a plant.
# String is either the plant name (if recognized) or an error message.
def getPlant(image) -> tuple:
    load_dotenv()
    API_KEY = os.getenv("PLANTAPIKEY")
    PROJECT = "all"
    api_endpoint = f"https://my-api.plantnet.org/v2/identify/{PROJECT}?api-key={API_KEY}"
    
    try:
        # Construct the files dictionary.
        # Here we assume that the image is in PNG format.
        # If your image might be JPEG, you can adjust the filename and MIME type accordingly.
        files = {
            'images': ('capture.png', image, 'image/png')
        }
        
        # Create and prepare the request.
        req = requests.Request('POST', url=api_endpoint, files=files)
        prepared = req.prepare()
        s = requests.Session()
        response = s.send(prepared)
        
        # Parse the JSON response.
        json_result = response.json()
        if response.status_code == 200:
            pprint(json_result.get('bestMatch'))
            best_match = json_result.get('bestMatch')
            # best_match is expected to be a dictionary.
            # Adjust the following extraction based on the actual API response.
            if isinstance(best_match, dict) and "species" in best_match:
                species = best_match["species"]
                # Extract the scientific name (or any other field you prefer).
                plant_name = species.get("scientificNameWithoutAuthor", str(best_match))
            else:
                plant_name = str(best_match)
                print(f"Plant: {plant_name}")
            return (True, plant_name)
        else:
            return (False, "error: try again")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return (False, f"Request failed: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        return (False, f"Unexpected error: {e}")
