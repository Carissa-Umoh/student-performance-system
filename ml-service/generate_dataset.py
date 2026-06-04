import pandas as pd
import numpy as np

np.random.seed(42)

num_students = 1500

ca_scores = []
participations = []
exam_scores = []

for _ in range(num_students):

    ability = np.random.choice(
        ["weak","average","strong"],
        p=[0.25,0.50,0.25]
    )

    if ability == "weak":
        ca = np.random.randint(0,13)
        participation = np.random.randint(0,3)
        exam = np.random.randint(0,30)

    elif ability == "average":
        ca = np.random.randint(10,23)
        participation = np.random.randint(1,5)
        exam = np.random.randint(25,50)

    else:
        ca = np.random.randint(20,31)
        participation = np.random.randint(3,6)
        exam = np.random.randint(45,66)

    ca_scores.append(ca)
    participations.append(participation)
    exam_scores.append(exam)

total = (
    np.array(ca_scores)
    + np.array(participations)
    + np.array(exam_scores)
)

def classify(score):
    if score >= 70:
        return "Distinction"
    elif score >= 45:
        return "Pass"
    elif score >= 40:
        return "At Risk"
    else:
        return "Fail"

df = pd.DataFrame({
    "ca_score": ca_scores,
    "participation": participations,
    "exam_score": exam_scores,
    "total": total
})

df["performance"] = df["total"].apply(classify)

df.to_csv("saps_dataset.csv", index=False)

print("Dataset generated")