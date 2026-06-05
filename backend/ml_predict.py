import joblib
import sys
import json

# Load the model
model = joblib.load('../ml-service/model.pkl')

# Get input from command line
input_data = json.loads(sys.argv[1])
ca = float(input_data['ca'])
participation = float(input_data['participation'])

# Make prediction
features = [[ca, participation]]
prediction = model.predict(features)[0]

# Calculate grade and needed marks based on total
exam = float(input_data.get('exam', 0))
total = ca + participation + exam

if total >= 70:
    grade = "A"
    needed = 0
elif total >= 60:
    grade = "B"
    needed = 70 - total
elif total >= 50:
    grade = "C"
    needed = 60 - total
elif total >= 45:
    grade = "D"
    needed = 50 - total
elif total >= 40:
    grade = "E"
    needed = 45 - total
else:
    grade = "F"
    needed = 40 - total

# Output result as JSON
result = {
    "prediction": prediction,
    "grade": grade,
    "total": round(total, 1),
    "needed": round(needed, 1) if needed > 0 else 0
}

print(json.dumps(result))