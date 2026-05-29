from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib

app = Flask(__name__)
CORS(app)

model = joblib.load("model.pkl")

def get_grade(total):
    if total >= 70:
        return "A"
    elif total >= 60:
        return "B"
    elif total >= 50:
        return "C"
    elif total >= 45:
        return "D"
    elif total >= 40:
        return "E"
    else:
        return "F"

def get_performance(total):
    if total >= 70:
        return "Distinction"
    elif total >= 45:
        return "Pass"
    elif total >= 40:
        return "At Risk"
    else:
        return "Fail"

def marks_to_next_grade(total):
    grades = [40, 45, 50, 60, 70]
    for g in grades:
        if total < g:
            return round(g - total, 1)
    return 0

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    ca = float(data["ca"])
    participation = float(data["participation"])
    exam = float(data["exam"])

    total = ca + participation + exam

    features = np.array([[ca, participation, exam]])
    prediction = model.predict(features)[0]

    grade = get_grade(total)
    performance = get_performance(total)
    needed = marks_to_next_grade(total)

    return jsonify({
        "prediction": performance,
        "grade": grade,
        "total": round(total, 1),
        "needed": needed
    })

if __name__ == "__main__":
    app.run(debug=True)