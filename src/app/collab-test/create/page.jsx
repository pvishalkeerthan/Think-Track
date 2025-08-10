'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CreateRoomPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTests, setFetchingTests] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch('/api/tests');
        const data = await res.json();
        setTests(data.tests || []);
      } catch (err) {
        toast.error('Failed to load available tests');
      } finally {
        setFetchingTests(false);
      }
    };

    fetchTests();
  }, []);

  const handleCreateRoom = async () => {
    if (!testId) {
      toast.error('Please select a test to create a room');
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch('/api/collab-test/create-room', {
        method: 'POST',
        body: JSON.stringify({ testId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (data.roomCode) {
        toast.success(`Room created successfully! Code: ${data.roomCode}`);
        router.push(`/collab-test/${data.roomId}/lobby`);
      } else {
        toast.error(data.error || 'Failed to create room');
      }
    } catch (err) {
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTests) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading available tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Room</h1>
          <p className="text-gray-600">Set up a collaborative quiz session</p>
        </div>

        {/* Create Room Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select a Test
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
              >
                <option value="">-- Choose a test --</option>
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {tests.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <span className="text-yellow-500 text-xl mr-2">⚠️</span>
                <p className="text-yellow-800 font-medium">No tests available</p>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please create some tests first before setting up a room.
              </p>
            </div>
          )}

          <button
            onClick={handleCreateRoom}
            disabled={loading || !testId || tests.length === 0}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              loading || !testId || tests.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Creating Room...
              </div>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                Create Room
              </>
            )}
          </button>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Select a test from your available quizzes</li>
              <li>• A unique room code will be generated</li>
              <li>• Share the code with participants</li>
              <li>• Start the quiz when everyone joins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
