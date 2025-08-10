'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTest } from "@/actions/testActions";
import toast from "react-hot-toast";
import Link from "next/link";
import Lottie from 'lottie-react';
import loadingAnimation from '../../../public/loading2.json';
import loadingAnimationDark from '../../../public/loading.json';

const TestStartPage = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [userPerformanceData, setUserPerformanceData] = useState(null);
  const router = useRouter();

  const [testDetails, setTestDetails] = useState({
    title: "",
    description: "",
    numQuestions: 10,
    difficulty: "medium", // default difficulty
    timeLimit: 30,
    tags: "",
  });

  // Function to fetch user's performance data
  const fetchUserPerformance = async () => {
    try {
      const res = await fetch('/api/user-performance', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch performance data: ${res.status}`);
      }

      const data = await res.json();
      console.log('User Performance Data:', data);

      if (data.success) {
        setUserPerformanceData(data.data);
        return data.data;
      } else {
        throw new Error('Invalid response format from performance API');
      }
    } catch (err) {
      console.error("Failed to fetch user performance:", err);
      // Return default values for new users
      return {
        averageScore: 65, // Default for new users
        averageTimePerQuestion: 45,
        totalTests: 0,
        difficultyPerformance: {},
        performanceTrends: { improving: false, stable: true, declining: false }
      };
    }
  };

  // Function to fetch AI predicted difficulty
  const fetchAIPredictedDifficulty = async (performanceData) => {
    setIsLoadingAI(true);
    try {
      // Use real user performance data instead of hardcoded values
      const requestData = {
        score: performanceData.averageScore || 65, // Use actual average score
        time_taken: performanceData.averageTimePerQuestion || 45, // Use actual average time
        userId: session?.user?.id || null,
        subject: testDetails.tags || 'general',
        // Additional context for better AI predictions
        totalTests: performanceData.totalTests || 0,
        difficultyPerformance: performanceData.difficultyPerformance || {},
        performanceTrends: performanceData.performanceTrends || { stable: true },
        learningPattern: performanceData.learningPattern || 'balanced_learner',
        recommendedDifficulty: performanceData.recommendedDifficulty
      };

      console.log('Sending request to AI with real user data:', requestData);

      const res = await fetch('/api/predict-difficulty', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error('AI API Error Response:', errorData);
        throw new Error(`Server error: ${res.status} - ${errorData?.error || 'Unknown error'}`);
      }

      const data = await res.json();
      console.log('AI Response:', data);

      if (data.success && data.predicted_difficulty) {
        setTestDetails((prev) => ({
          ...prev,
          difficulty: data.predicted_difficulty.toLowerCase(),
        }));
        
        // Show success message with confidence and reasoning
        const confidenceText = data.confidence ? ` (${data.confidence}% confidence)` : '';
        const reasoningText = data.suggestion ? ` - ${data.suggestion}` : '';
        
        toast.success(
          `AI suggested "${data.predicted_difficulty}" difficulty${confidenceText}${reasoningText}`, 
          {
            position: "top-center",
            duration: 5000,
          }
        );
        
        // Log detailed AI analysis for debugging
        if (data.factors) {
          console.log('AI Analysis Factors:', data.factors);
        }
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (err) {
      console.error("AI prediction failed:", err);
      
      // Fallback to rule-based recommendation if AI fails
      const fallbackDifficulty = getFallbackDifficulty(performanceData);
      if (fallbackDifficulty !== testDetails.difficulty) {
        setTestDetails((prev) => ({
          ...prev,
          difficulty: fallbackDifficulty,
        }));
        toast.success(`Based on your performance, we recommend "${fallbackDifficulty}" difficulty`, {
          position: "top-center",
          duration: 4000,
        });
      } else {
        toast.error("Failed to get AI difficulty suggestion. Using your current selection.", {
          position: "top-center",
          duration: 3000,
        });
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Fallback difficulty recommendation based on user performance
  const getFallbackDifficulty = (performanceData) => {
    if (!performanceData || performanceData.totalTests === 0) {
      return "medium"; // Default for new users
    }

    // Use the recommended difficulty from performance analysis if available
    if (performanceData.recommendedDifficulty) {
      return performanceData.recommendedDifficulty;
    }

    // Fallback logic based on average score
    const avgScore = performanceData.averageScore;
    if (avgScore >= 80) {
      return "hard";
    } else if (avgScore >= 60) {
      return "medium";
    } else {
      return "easy";
    }
  };

  // Check user session and fetch performance data + AI prediction
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please log in to create a test", {
        duration: 3000,
        position: "top-center",
      });
      router.push("/signin");
      return;
    }

    if (status === "authenticated") {
      // Fetch user performance data first, then get AI prediction
      fetchUserPerformance().then((performanceData) => {
        fetchAIPredictedDifficulty(performanceData);
      });
    }
  }, [status, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await createTest(testDetails);

      if (response.success) {
        console.log("Test created successfully with ID:", response.testId);
        toast.success("Test created successfully!", {
          position: "top-center",
          duration: 3000,
        });
        router.push(`/test/${response.testId}`);
      } else {
        toast.error("Failed to create test. Please try again.");
      }
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  // Function to manually refresh AI recommendation
  const refreshAIRecommendation = async () => {
    if (userPerformanceData) {
      await fetchAIPredictedDifficulty(userPerformanceData);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isLoading) {
    const animationData = document.body.classList.contains('dark') ? loadingAnimationDark : loadingAnimation;
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-white dark:bg-black fixed top-0 left-0 z-50">
        <Lottie animationData={animationData} loop={true} className="w-1/2 h-1/2" />
        <p className="mt-4 text-lg text-gray-800 dark:text-white bounce">Creating test...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Link href="/dashboard" className="right-4 z-10 flex justify-end">
        <Button variant="secondary" className="bg-black text-white dark:bg-white dark:text-black">
          Back to Dashboard
        </Button>
      </Link>

      <div className="bg-white dark:bg-black border dark:border-zinc-800 shadow-lg rounded-lg p-6 mt-12">
        <h1 className="text-3xl font-bold mb-6">Initialize Test</h1>
        
        {/* User Performance Summary */}
        {userPerformanceData && userPerformanceData.totalTests > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                <p className="font-medium">{userPerformanceData.averageScore?.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Tests Taken:</span>
                <p className="font-medium">{userPerformanceData.totalTests}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Avg Time/Question:</span>
                <p className="font-medium">{userPerformanceData.averageTimePerQuestion}s</p>
              </div>
            </div>
            {userPerformanceData.performanceTrends && (
              <div className="mt-2">
                <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  userPerformanceData.performanceTrends.improving 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : userPerformanceData.performanceTrends.declining 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {userPerformanceData.performanceTrends.improving ? 'Improving' : 
                   userPerformanceData.performanceTrends.declining ? 'Needs Focus' : 'Stable'}
                </span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Test Title</Label>
            <Input
              id="title"
              name="title"
              value={testDetails.title}
              onChange={handleInputChange}
              required
              className="dark:bg-neutral-800 dark:text-white"
              placeholder="Enter test title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={testDetails.description}
              onChange={handleInputChange}
              required
              className="dark:bg-neutral-800 dark:text-white"
              placeholder="Enter test description"
            />
          </div>

          <div>
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              type="number"
              id="numQuestions"
              name="numQuestions"
              value={testDetails.numQuestions}
              onChange={handleInputChange}
              min="1"
              max="50"
              required
              className="dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshAIRecommendation}
                disabled={isLoadingAI}
                className="text-xs"
              >
                {isLoadingAI ? "Analyzing..." : "Refresh AI Suggestion"}
              </Button>
            </div>
            <select
              id="difficulty"
              name="difficulty"
              value={testDetails.difficulty}
              onChange={handleInputChange}
              className="w-full mt-1 rounded-md border border-gray-300 dark:border-neutral-600 shadow-sm px-4 py-2 bg-white dark:bg-neutral-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select Difficulty Level"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {isLoadingAI ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⚡</span>
                  AI is analyzing your performance...
                </span>
              ) : userPerformanceData && userPerformanceData.totalTests > 0 ? (
                "AI recommendation based on your test history (you can change it)."
              ) : (
                "Default difficulty for new users (AI will learn from your performance)."
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="timeLimit">Time Limit (minutes): {testDetails.timeLimit}</Label>
            <input
              type="range"
              id="timeLimit"
              name="timeLimit"
              value={testDetails.timeLimit}
              onChange={handleInputChange}
              min="5"
              max="180"
              step="5"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 min</span>
              <span>180 min</span>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              value={testDetails.tags}
              onChange={handleInputChange}
              placeholder="e.g., math, science, history"
              className="dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Creating test..." : "Create Test With AI"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TestStartPage;