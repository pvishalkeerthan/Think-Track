import sys
import json
import joblib

# Load the model
model = joblib.load('difficulty_predictor.pkl')
label_map = {0: 'Easy', 1: 'Medium', 2: 'Hard'}

# Get input from JS via stdin
user_input = json.loads(sys.argv[1])
score = user_input.get('score')
time_taken = user_input.get('time_taken')

# Predict
pred = model.predict([[score, time_taken]])[0]
result = {'predicted_difficulty': label_map[pred]}

print(json.dumps(result))
