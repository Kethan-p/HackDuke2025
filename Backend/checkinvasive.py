from openai import OpenAI
import os
from dotenv import load_dotenv
import re

# Load API key from .env
load_dotenv()


#to run python /Users/billym./HackDuke2025/HackDuke2025/Backend/checkinvasive.py
def clean_text(text):
    cleaned = text.replace("\n", " ")
    
    # Remove markdown bold markers
    cleaned = cleaned.replace("**", "")
    
    # Remove numbered list markers (e.g., "2. ", "3. ", etc.)
    cleaned = re.sub(r'\b\d+\.\s*', '', cleaned)
    
    # Remove any extra spaces (e.g., multiple spaces in a row)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # Trim leading/trailing whitespace
    return cleaned.strip()

def check_invasive_plant(plant_name, lat, long):
    try:
        prompt = f"Is the plant '{plant_name}' at these coordinates '{lat}' , '{long}' an invasive species? If yes, return 'true' and list its harmful effects. If no, return 'false' and basic information about the plant. Mention the location of the plant in your response, but do not mention anything regarding coordinates. It is crucial to start the response with true is the plant is invasive and false if it is not. The first word should be true or false."

        client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
        )
        completion = client.chat.completions.create(
        model="gpt-4o-mini",
         messages=[
                {"role": "system", "content": "You are a knowledgeable bot about plant species."},
                {"role": "user", "content": prompt}
            ],
        )

        content = completion.choices[0].message.content.strip()
        # Extract the first word (removing punctuation like '.' or ',')
        print(content)
        first_word = content.split()[0].strip(".,").lower()
        
        if first_word == "true":
            # Split off the first sentence (assumes the first period marks the end of the "True." marker)
            parts = content.split('.', 1)
            # parts[0] is "True", parts[1] is the rest of the message
            if len(parts) > 1:
                rest_of_text = parts[1].strip()
            else:
                rest_of_text = ""
            rest_of_text = clean_text(rest_of_text)
            return (True, rest_of_text)
        
        elif first_word == "false":
            return (False, "Not Invasive")
        else:
            return (False, "Invalid response")

        # print(f"Answer: {answer}")

        # if "true" in answer.lower():
        #     is_invasive = True
        #     harmful_effects = answer.replace("true", "").strip()
        # else:
        #     is_invasive = False
        #     harmful_effects = ""
    except Exception as e:
        print(f"Error: {e}")
        return None, None
'''
if __name__ == "__main__":
    plant_name = "Lonicera japonica"  # Replace with any plant name
    # is_invasive, harmful_effects =
    ret = check_invasive_plant(plant_name,"35.9940° N", "78.8986° W")
    #need to store UserId, name, isInvasive, info, location, image
    print(ret)
'''