import requests

from ..core import settings

url = "https://api.openai.com/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {settings.openai_api_key}"
}

def get_chatbot_response(contents):
    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": contents
            }
        ]
    }
    response = requests.post(url, headers=headers, json=data)

    response_data = response.json()
    message = response_data['choices'][0]['message']['content']

    return message