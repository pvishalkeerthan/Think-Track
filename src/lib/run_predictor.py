import sys
import json
import joblib
import os

try:
    # Load model
    model_path = os.path.join(os.path.dirname(__file__), 'ml_models', 'difficulty_predictor.pkl')
    model = joblib.load(model_path)
    label_map = {0: 'Easy', 1: 'Medium', 2: 'Hard'}

    # Parse input
    user_input = json.loads(sys.argv[1])
    score = user_input.get('score')
    time_taken = user_input.get('time_taken')

    # Check if values are valid
    if score is None or time_taken is None:
        raise ValueError("Missing required input: 'score' and 'time_taken'")

    # Run prediction
    pred = model.predict([[score, time_taken]])[0]
    result = {'predicted_difficulty': label_map[pred]}
    
    # Return JSON result
    print(json.dumps(result))

except Exception as e:
    # Always return valid JSON error
    print(json.dumps({'error': str(e)}))
