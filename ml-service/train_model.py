import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# Load dataset
df = pd.read_csv("student_data.csv")

# Use score columns
X = df[['math score', 'reading score', 'writing score']]

# Create prediction categories
def classify(avg):
    if avg < 50:
        return "At Risk"
    elif avg < 75:
        return "Average"
    else:
        return "Excellent"

# Create target column
df['performance'] = df[
    ['math score', 'reading score', 'writing score']
].mean(axis=1).apply(classify)

y = df['performance']

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
model = RandomForestClassifier()

model.fit(X_train, y_train)

# Test accuracy
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Accuracy:", accuracy)

# Save model
joblib.dump(model, "model.pkl")

print("Model saved successfully!")