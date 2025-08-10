'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/collab-test/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Successfully joined the room!');
        router.push(`/collab-test/${data.roomId}/lobby`);
      } else {
        toast.error(data.error || 'Failed to join room');
      }
    } catch (err) {
      toast.error('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join Room</h1>
          <p className="text-gray-600">Enter the room code to join a quiz</p>
        </div>

        {/* Join Room Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter room code (e.g., ABC123)"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-700 font-medium text-center text-lg tracking-wider focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              maxLength={6}
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || !roomCode.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              loading || !roomCode.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Joining Room...
              </div>
            ) : (
              <>
                <span className="mr-2">🚪</span>
                Join Room
              </>
            )}
          </button>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Need help?</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Ask the host for the room code</li>
              <li>• Room codes are usually 6 characters long</li>
              <li>• Make sure you're connected to the internet</li>
              <li>• Join before the quiz starts</li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm mb-3">
              Don't have a room code?
            </p>
            <button
              onClick={() => router.push('/collab-test/create')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
              Create Your Own Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}