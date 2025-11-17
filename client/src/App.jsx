import React, { useState, useRef, useEffect } from "react";
import { WebRTCProvider, useWebRTC } from "./contexts/WebRTCContext";

function RoomControls() {
  const { audioEnabled, videoEnabled, toggleAudio, toggleVideo, quality, setQuality } = useWebRTC();

  return (
    <div className="flex gap-3 items-center flex-wrap">
      <button
        onClick={toggleAudio}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition transform hover:scale-105"
      >
        {audioEnabled ? "Mute Audio" : "Unmute Audio"}
      </button>
      <button
        onClick={toggleVideo}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition transform hover:scale-105"
      >
        {videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
      </button>
      <select
        value={`${quality.width}x${quality.height}`}
        onChange={(e) => {
          const [w, h] = e.target.value.split("x").map(Number);
          setQuality({ width: w, height: h });
        }}
        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow transition"
      >
        <option value="1280x720">720p</option>
        <option value="1920x1080">1080p</option>
        <option value="3840x2160">4K</option>
      </select>
    </div>
  );
}

function VideoArea() {
  const { localStream, remoteStreams } = useWebRTC();
  const localRef = useRef(null);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <div className="flex flex-wrap gap-6 p-6 justify-center">
      {/* Local Video */}
      <div className="flex flex-col items-center w-[300px] md:w-[400px]">
        <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">You</div>
        <video
          ref={localRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-xl shadow-lg bg-black"
        />
      </div>

      {/* Remote Videos */}
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <div key={id} className="flex flex-col items-center w-[300px] md:w-[400px]">
          <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">{id}</div>
          <video
            autoPlay
            playsInline
            ref={(el) => el && (el.srcObject = stream)}
            className="w-full rounded-xl shadow-lg bg-black"
          />
        </div>
      ))}
    </div>
  );
}

function RoomSetup() {
  const { currentRoom, setCurrentRoom } = useWebRTC();
  const [roomInput, setRoomInput] = useState("");

  const startMeeting = () => {
    const id = "room_" + Math.random().toString(36).substring(2, 10);
    setCurrentRoom(id);
  };

  const joinMeeting = () => {
    if (!roomInput.trim()) return;
    setCurrentRoom(roomInput.trim());
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(`${window.location.origin}?room=${currentRoom}`).then(() => {
      alert("Room link copied!");
    });
  };

  return (
    <header className="p-6 flex flex-col md:flex-row justify-between items-center bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl shadow-md gap-4">
      <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        WebRTC HD Meeting
      </h1>

      <div className="flex gap-3 items-center flex-wrap">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition transform hover:scale-105" onClick={startMeeting}>
          Start
        </button>
        <input
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Room ID"
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow transition"
        />
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition transform hover:scale-105" onClick={joinMeeting}>
          Join
        </button>
        <RoomControls />
        {currentRoom && (
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition transform hover:scale-105" onClick={copyRoomLink}>
            Copy Link
          </button>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <WebRTCProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors">
        <RoomSetup />
        <VideoArea />
      </div>
    </WebRTCProvider>
  );
}
