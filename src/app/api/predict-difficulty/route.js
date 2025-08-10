export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { score, time_taken, userId, subject } = body;

    // Log the received data for debugging
    console.log('Received data:', { score, time_taken, userId, subject });

    // Validate input
    if (score === undefined || time_taken === undefined) {
      return Response.json(
        { error: 'Missing required fields: score and time_taken' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || typeof time_taken !== 'number') {
      return Response.json(
        { error: 'Invalid input: score and time_taken must be numbers' },
        { status: 400 }
      );
    }

    // Simple AI logic for difficulty prediction
    let predicted_difficulty = 'medium'; // default
    let confidence = 70;

    // Calculate performance ratio (score per minute)
    const performance_ratio = score / Math.max(1, time_taken / 60);
    
    // Determine difficulty based on multiple factors
    if (score >= 85 && time_taken <= 300) {
      predicted_difficulty = 'hard';
      confidence = 85;
    } else if (score >= 80 && performance_ratio > 2.5) {
      predicted_difficulty = 'hard';
      confidence = 80;
    } else if (score >= 70 && time_taken <= 600) {
      predicted_difficulty = 'medium';
      confidence = 75;
    } else if (score >= 60 && performance_ratio > 1.5) {
      predicted_difficulty = 'medium';
      confidence = 70;
    } else {
      predicted_difficulty = 'easy';
      confidence = 65;
    }

    // Prepare response
    const response = {
      success: true,
      predicted_difficulty: predicted_difficulty.charAt(0).toUpperCase() + predicted_difficulty.slice(1),
      confidence: confidence,
      factors: {
        score: score,
        time_taken: time_taken,
        performance_ratio: Math.round(performance_ratio * 100) / 100
      },
      suggestion: getDifficultyExplanation(predicted_difficulty)
    };

    console.log('Sending response:', response);

    return Response.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in predict-difficulty API:', error);
    return Response.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function for explanations
function getDifficultyExplanation(difficulty) {
  const explanations = {
    easy: "Based on your performance, an easier test will help build confidence.",
    medium: "Your performance suggests you're ready for a moderate challenge.",
    hard: "Your strong performance indicates you're ready for a challenging test."
  };
  
  return explanations[difficulty.toLowerCase()] || explanations.medium;
}

// Handle GET requests
export async function GET() {
  return Response.json(
    { 
      message: 'AI Difficulty Prediction API',
      methods: ['POST'],
      required_fields: ['score', 'time_taken']
    },
    { status: 200 }
  );
}