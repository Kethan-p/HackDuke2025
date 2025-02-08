from openai import OpenAI
import os
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()


#to run python /Users/billym./HackDuke2025/HackDuke2025/Backend/checkinvasive.py

def check_invasive_plant(plant_name):
    
    try:
        prompt = f"Is the plant '{plant_name}' an invasive species? If yes, return 'true' and list its harmful effects. If no, return 'false' and an empty string."

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

        print(completion.choices[0].message)


        # print(f"Answer: {answer}")

        # if "true" in answer.lower():
        #     is_invasive = True
        #     harmful_effects = answer.replace("true", "").strip()
        # else:
        #     is_invasive = False
        #     harmful_effects = ""


        return
    except Exception as e:
        print(f"Error: {e}")
        return None, None

if __name__ == "__main__":
    plant_name = "Lonicera japonica"  # Replace with any plant name
    # is_invasive, harmful_effects =
    check_invasive_plant(plant_name)

    # if is_invasive:
    #     print(f"⚠️ {plant_name} is invasive.")
    #     print(f"Harmful Effects: {harmful_effects}")
    # else:
    #     print(f"{plant_name} is not invasive.")
