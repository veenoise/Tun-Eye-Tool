from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import easyocr
import numpy as np
import cv2
import json
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification
)
import torch
from eli5.lime import TextExplainer
from sklearn.feature_extraction.text import CountVectorizer

app = Flask(__name__)
CORS(app)

# Load your fine-tuned model and tokenizer
loaded_model = AutoModelForSequenceClassification.from_pretrained("./distilmbert")
loaded_tokenizer = AutoTokenizer.from_pretrained("./distilmbert")
loaded_model.eval()
class_names = ["Fake News", "Real News"]

# Wrap the model in a prediction function for LIME/ELI5
def predict_proba(texts):
    inputs = loaded_tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        outputs = loaded_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1).cpu().numpy()
    return probs

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
    
    # Call the process_text function to return the results
    return process_text(joined_text)
    
# Data processing if text
def process_text(text_input):
    # Create a vectorizer with ngram_range (1,3) for unigrams to trigrams
    vectorizer = CountVectorizer(
        ngram_range=(1, 3),  # Capture 1-word, 2-word, and 3-word phrases
        lowercase=True,
        max_features=5000    # Limit features to avoid memory issues
    )
    
    # Use ELI5's TextExplainer with the custom vectorizer
    te = TextExplainer(
        random_state=42,
        n_samples=300,
        char_based=False,
        vec=vectorizer  # Use custom vectorizer for ngrams
    )
    
    # Fit the explainer
    te.fit(text_input, predict_proba)
    
    results = {
        "verdict": "",
        "confidence": {},
        "words": []
    }
    
    # prediction probabilities
    probs = predict_proba([text_input])[0]

    # dynamically assign label-confidence pairs
    results["confidence"] = {
        label: f"{probs[i]:.2f}"
        for i, label in enumerate(class_names)
    }
    
    # find the label with the highest probability
    max_index = probs.argmax()
    results["verdict"] = class_names[max_index]

    # Get explanation and extract features
    explanation = te.explain_prediction(target_names=class_names)
    
    # Extract feature weights for the predicted class
    try:
        if hasattr(explanation, 'targets') and explanation.targets:
            target_explanation = explanation.targets[0]
            
            # Get feature weights - handle different possible structures
            if hasattr(target_explanation, 'feature_weights'):
                fw = target_explanation.feature_weights
                
                # If it's a FeatureWeights object, extract pos and neg
                if hasattr(fw, 'pos') and hasattr(fw, 'neg'):
                    all_features = []
                    
                    # Add positive features
                    for item in fw.pos:
                        if hasattr(item, 'feature') and hasattr(item, 'weight'):
                            all_features.append((item.feature, item.weight))
                    
                    # Add negative features
                    for item in fw.neg:
                        if hasattr(item, 'feature') and hasattr(item, 'weight'):
                            all_features.append((item.feature, item.weight))
                    
                    # Sort by absolute weight
                    sorted_features = sorted(
                        all_features, 
                        key=lambda x: abs(x[1]), 
                        reverse=True
                    )[:10]  # Get top 10 features
                    
                    for feature, weight in sorted_features:
                        results["words"].append({
                            "word": feature, 
                            "weight": f"{weight:.4f}"
                        })
    except Exception as e:
        print(f"Error extracting features: {e}")
        # Fallback: if ELI5 fails, return empty words list
        results["words"] = []
    
    print(json.dumps(results, indent=4))
    
    return results


if __name__ == '__main__':
    app.run(
        port=1234,
        debug=True
    )