import openai
import os
from dotenv import load_dotenv

# Load API key from .env


def check_invasive_plant(plant_name):
    load_dotenv()
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    openai.api_key = OPENAI_API_KEY
    try:
        prompt = f"Is the plant '{plant_name}' an invasive species? If yes, return 'true' and list its harmful effects. If no, return 'false' and an empty string."

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You are a knowledgeable bot about plant species."},
                      {"role": "user", "content": prompt}]
        )

        answer = response["choices"][0]["message"]["content"].strip()

        if "true" in answer.lower():
            is_invasive = True
            harmful_effects = answer.replace("true", "").strip()
        else:
            is_invasive = False
            harmful_effects = ""

        return is_invasive, harmful_effects

    except Exception as e:
        print(f"Error: {e}")
        return None, None

if __name__ == "__main__":
    plant_name = "Kudzu"  # Replace with any plant name
    is_invasive, harmful_effects = check_invasive_plant(plant_name)

    if is_invasive:
        print(f"⚠️ {plant_name} is invasive.")
        print(f"Harmful Effects: {harmful_effects}")
    else:
        print(f"{plant_name} is not invasive.")
