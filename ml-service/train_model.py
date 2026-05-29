import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
df = pd.read_csv("student_data.csv")

# Use score columns
df['ca_score'] = df[['math score', 'reading score']].mean(axis=1) * 0.30
df['participation'] = 5
df['exam_score'] = df['writing score'] * 0.65

# Calculate total
df['total'] = df['ca_score'] + df['participation'] + df['exam_score']

# Grade classification
def classify(total):
    if total >= 70:
        return "Distinction"
    elif total >= 45:
        return "Pass"
    elif total >= 40:
        return "At Risk"
    else:
        return "Fail"

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

df['performance'] = df['total'].apply(classify)
df['grade'] = df['total'].apply(get_grade)

X = df[['ca_score', 'participation', 'exam_score']]
y = df['performance']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print("Accuracy:", accuracy)

joblib.dump(model, "model.pkl")
print("Model saved successfully!")