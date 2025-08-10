'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LobbyPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/collab-test/room/${roomId}`);
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setRoom(data.room);
        setIsHost(data.isHost);
      } catch (err) {
        toast.error("Failed to load room");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!room) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/collab-test/room/${roomId}`);
        const data = await res.json();

        if (data?.room?.status === 'active') {
          toast.success("Quiz is starting!");
          router.push(`/collab-test/${roomId}/quiz`);
        }
        
        // Update participants in real-time
        if (data?.room?.participants) {
          setRoom(prevRoom => ({
            ...prevRoom,
            participants: data.room.participants
          }));
        }
      } catch (err) {
        // Silent fail for polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, router, room]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/collab-test/get-room`, {
        method: 'POST',
        body: JSON.stringify({ roomId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Starting quiz for all participants!");
        router.push(`/collab-test/${roomId}/quiz`);
      } else {
        toast.error(data.error || 'Failed to start test');
      }
    } catch (error) {
      toast.error("Failed to start test. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <p className="text-gray-700 font-medium">Room not found or failed to load.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Room Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Room: {room.roomCode}</h1>
          <p className="text-gray-600 font-medium">Waiting for participants to join...</p>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">👥</span>
            Participants ({room.participants.length})
          </h2>
          
          {room.participants.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👤</div>
              <p className="text-gray-500">No participants yet</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {room.participants.map((participant, idx) => (
                <div
                  key={idx}
                  className="flex items-center p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-800">{participant.name}</span>
                  {isHost && idx === 0 && (
                    <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        {isHost && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">
              Ready to begin? Make sure all participants have joined.
            </p>
            <button
              onClick={handleStart}
              disabled={starting || room.participants.length === 0}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                starting || room.participants.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {starting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting...
                </div>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Start Quiz
                </>
              )}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600 font-medium">
              Waiting for the host to start the quiz...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}