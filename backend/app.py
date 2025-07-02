from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
import requests
import json

load_dotenv()
app = Flask(__name__)
CORS(app)

client = genai.Client()

@app.route("/api/process", methods=["POST"])
def data_processing():
    data = request.get_json()

    match data['type']:
        case 'text':
            output = process_text(data['value'])
        case 'image':
            output = process_image(data['value'])
    
    return jsonify(json.loads(output))

def process_image(img_url):
    image_bytes = requests.get(img_url).content
    image = types.Part.from_bytes(
        data=image_bytes, mime_type="image/jpeg"
    )

    client = genai.Client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        # system_instruction="You are a Fake news detection tool. You are a strict JSON API. Do not say anything outside the format.",
        contents=["Determine if the input is Fake or Real by extracting the texts inside the image and list top 5 words that made you say it is fake or real and decimal weight that made the word lean towards fake or real with negative values being the real and positive being fake", image],
        config={
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "object",
                "properties": {
                    "verdict": {
                        "type": "string",
                        "enum": ["Fake", "Real"]
                    },
                    "words": {
                        "type": "array",
                        "minItems": 5,
                        "maxItems": 5,
                        "items": {
                            "type": "object",
                            "properties": {
                                "word": {
                                    "type": "string"
                                },
                                "weight": {
                                    "type": "number"
                                }
                            },
                            "required": ["word", "weight"]
                        }
                    }
                },
                "required": ["verdict", "words"]
            }
        }
    )
    print(response.text)
    return response.text

def process_text(text_input):
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        # system_instruction="You are a Fake news detection tool. You are a strict JSON API. Do not say anything outside the format.",
        contents=f"Determine if the input is Fake or Real and list top 5 words that made you say it is fake or real and decimal weight that made the word lean towards fake or real with negative values being the real and positive being fake. Here is the client content: {text_input}",
        config={
            "response_mime_type": "application/json",
            "response_schema": {
                "type": "object",
                "properties": {
                    "verdict": {
                        "type": "string",
                        "enum": ["Fake", "Real"]
                    },
                    "words": {
                        "type": "array",
                        "minItems": 5,
                        "maxItems": 5,
                        "items": {
                            "type": "object",
                            "properties": {
                                "word": {
                                    "type": "string"
                                },
                                "weight": {
                                    "type": "number"
                                }
                            },
                            "required": ["word", "weight"]
                        }
                    }
                },
                "required": ["verdict", "words"]
            }
        }
    )
    print(response.text)
    return response.text

if __name__ == '__main__':
    app.run(
        port=1234,
        debug=True
    )