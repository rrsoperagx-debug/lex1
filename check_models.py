import os
import sys
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
load_dotenv(dotenv_path)

# Adding backend to sys.path so it works locally if needed
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from google import genai

def main():
    try:
        # Initialize the client without hardcoding the key.
        # It automatically picks up the GEMINI_API_KEY environment variable.
        client = genai.Client()
        print("Listing available models...")
        
        # The list method returns an iterable/pager
        for model in client.models.list():
            print(f"Name: {model.name}")
            print(f"Display Name: {model.display_name}")
            
            # Limit output to Gemini models
            if model.name and "gemini" in model.name.lower():
                print(f"Full info: {model}")
            print("-" * 20)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()