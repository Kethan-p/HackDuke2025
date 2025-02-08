import requests
from dotenv import load_dotenv
import os
import json
from pprint import pprint

#returns a tuple of Boolean, string
#boolean is if it is a plant
#string is either name of plant or error message
def getPlant(image_path)->tuple:
    load_dotenv()
    API_KEY = os.getenv("PLANTAPIKEY")

    PROJECT = "all"
    api_endpoint = f"https://my-api.plantnet.org/v2/identify/{PROJECT}?api-key={API_KEY}"

    image_data = open(image_path, 'rb')
    files = [ ('images', (image_path, image_data))]
    try: 
        req = requests.Request('POST', url=api_endpoint, files=files)

        prepared = req.prepare()

        s = requests.Session()
        response = s.send(prepared)
        json_result = json.loads(response.text)
        if response.status_code == 200:
            pprint(json_result['bestMatch'])
            return (True, json_result['bestMatch'])
        else:
            print("error: try again")
            return (False, "error: try again")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return (False, f"Request failed: {e}")

    except Exception as e:
        print(f"Unexpected error: {e}")
        return (False, f"Unexpected error: {e}")

        

getPlant('/Users/kethanpoduri/Desktop/image_1.jpeg')










