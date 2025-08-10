import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

# Sample mock training data
data = pd.DataFrame({
    'score': [80, 60, 45, 90, 30, 70, 55],
    'time_taken': [300, 600, 800, 250, 1000, 350, 750],
    'difficulty': ['Medium', 'Medium', 'Hard', 'Easy', 'Hard', 'Easy', 'Hard']
})

# Convert labels to numeric
label_map = {'Easy': 0, 'Medium': 1, 'Hard': 2}
data['difficulty'] = data['difficulty'].map(label_map)

# Train the model
model = DecisionTreeClassifier()
model.fit(data[['score', 'time_taken']], data['difficulty'])

# Save the model
joblib.dump(model, 'difficulty_predictor.pkl')
print("✅ Model trained and saved as difficulty_predictor.pkl")
