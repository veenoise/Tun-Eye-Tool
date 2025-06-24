from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/process", methods=["POST"])
def hello_world():
    data = request
    print(data)