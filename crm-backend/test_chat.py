import os
import requests
import json
from dotenv import load_dotenv
load_dotenv()

response = requests.post(
    url='https://openrouter.ai/api/v1/chat/completions',
    headers={
        'Authorization': f'Bearer {os.getenv("OPENROUTER_API_KEY")}',
        'Content-Type': 'application/json'
    },
    data=json.dumps({
        'model': 'openai/gpt-oss-20b:free',
        'messages': [{'role': 'user', 'content': 'hello'}]
    })
)
print(response.status_code)
print(response.text)