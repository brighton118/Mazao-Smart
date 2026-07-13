import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Clean environment variables from UTF-8 BOM if written by PowerShell
for key in list(os.environ.keys()):
    if key.startswith('\ufeff'):
        os.environ[key.replace('\ufeff', '')] = os.environ[key]

key = os.environ.get("GEMINI_API_KEY")
print("Key:", key)
genai.configure(api_key=key)
try:
    for m in genai.list_models():
        print(m.name, m.supported_generation_methods)
except Exception as e:
    print("Error listing models:", e)
