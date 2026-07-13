import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Clean environment variables from UTF-8 BOM if written by PowerShell
for key in list(os.environ.keys()):
    if key.startswith('\ufeff'):
        os.environ[key.replace('\ufeff', '')] = os.environ[key]

key = os.environ.get("GEMINI_API_KEY")
print("Key:", key[:5] + "..." + key[-5:] if key else "None")
genai.configure(api_key=key)

try:
    model = genai.GenerativeModel(model_name="gemini-3.5-flash")
    response = model.generate_content("Hello")
    print("Success!")
    print(response.text)
except Exception as e:
    import traceback
    print("Error traceback:")
    traceback.print_exc()
