import React, { useState, useEffect } from "react";

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Auto-join if URL has ?room=
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
      joinMeeting(roomFromUrl);
    }
  }, []);

  const startMeeting = () => {
    const id = "room_" + Math.random().toString(36).substring(2, 10);
    setCurrentRoom(id);
    loadJitsi(id);
  };

  const joinMeeting = (id) => {
    const joinId = id || roomId;
    if (!joinId) return;
    setCurrentRoom(joinId);
    loadJitsi(joinId);
  };

  const loadJitsi = (roomName) => {
    const domain = "meet.jit.si";
    const options = {
      roomName,
      width: "100%",
      height: "100%",
      parentNode: document.getElementById("video-container"),
    };
    new window.JitsiMeetExternalAPI(domain, options);
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}?room=${currentRoom}`;
    navigator.clipboard.writeText(link);
    alert("Room link copied to clipboard!");
  };

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
    >
      {/* Header with buttons */}
      <header className="p-6 bg-white dark:bg-gray-800 shadow flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold">🌐 My Video Meeting</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={startMeeting}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700 transition"
          >
            Start Meeting
          </button>
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 border rounded-lg w-32 md:w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={() => joinMeeting()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Join
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      {!currentRoom && (
        <section className="flex flex-col justify-center items-center flex-1 text-center px-6 md:px-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">Host or Join a Video Meeting Instantly</h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg md:text-xl max-w-2xl">
            No sign-up required. Start a meeting, share a room link, and collaborate in real-time.
          </p>
          <button
            onClick={startMeeting}
            className="mt-4 px-8 py-4 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700 transition"
          >
            Start a Meeting Now
          </button>
        </section>
      )}

      {/* Video Container */}
      {currentRoom && (
        <main id="video-container" className="flex-1 min-h-[500px]"></main>
      )}

      {/* Copy Room Link Button */}
      {currentRoom && (
        <footer className="p-4 bg-white dark:bg-gray-800 shadow flex justify-center">
          <button
            onClick={copyRoomLink}
            className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition"
          >
            Copy Room Link
          </button>
        </footer>
      )}
    </div>
  );
}
