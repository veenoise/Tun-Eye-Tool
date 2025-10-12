from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import easyocr
import numpy as np
import cv2
import json
from joblib import load
import torch
from lime.lime_text import LimeTextExplainer

app = Flask(__name__)
CORS(app)

# Load your fine-tuned model and tokenizer
loaded_model = load('./adaboost_rf_model.joblib')
loaded_tokenizer = load("./tfidf_vectorizer.joblib")
class_names = ["Fake News", "Real News"]

# Wrap the model in a prediction function for LIME
def predict_proba(texts):
    X = loaded_tokenizer.transform(texts)        # Convert text to TF-IDF features
    probs = loaded_model.predict_proba(X)        # Get probabilities
    return probs

# Create a LIME text explainer
explainer = LimeTextExplainer(class_names=class_names)

# Flask endpoint for frontend
@app.route("/api/process", methods=["POST"])
def data_processing():
    data = request.get_json()

    match data['type']:
        case 'text':
            output = process_text(data['value'])
        case 'image':
            output = process_image(data['value'])

    return jsonify(output)

# Data processing if image
def process_image(img_url):
    # Convert url to image bytes
    url = img_url
    resp = requests.get(url, stream=True).raw
    image = np.asarray(bytearray(resp.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    
    # Use easyocr to extract text from image
    reader = easyocr.Reader(['en', 'tl'], gpu=False)
    results = reader.readtext(image)
    texts = [text for _, text, _ in results]
    joined_text = " ".join(texts)
    
    # Call the distilmbert function to return the results
    return process_text(joined_text)
    
# Data processing if text
def process_text(text_input):
    exp = explainer.explain_instance(
        text_input,        # the input text
        predict_proba,     # function that returns probability
        num_features=5,    # how many words to highlight
        num_samples=300    # number of perturbations
    )
    
    results = {
        "verdict": "",
        "words": []
    }
    
    # prediction probabilities
    probs = predict_proba([text_input])[0]
    
    # find the label with the highest probability
    max_index = probs.argmax()
    predicted_label = class_names[max_index]
    results["verdict"] = predicted_label

    # features and their weights
    for feature, weight in exp.as_list():
        results["words"].append({"word": feature, "weight": f"{weight:.4f}"})
    
    return results

if __name__ == '__main__':
    app.run(
        port=1234,
        debug=True
    )