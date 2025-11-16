import React, { useState, useEffect } from "react";

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState("");

  // Load Jitsi
  useEffect(() => {
    if (!currentRoom) return;
    const container = document.getElementById("video-container");
    if (!container) return;

    container.innerHTML = "";

    const domain = "meet.jit.si";

    const options = {
      roomName: currentRoom,
      height: "100%",
      width: "100%",
      parentNode: container,

      // ============ UNLIMITED MEETING + HD SETTINGS ============
      configOverwrite: {
        prejoinPageEnabled: false,

        // NO TIME LIMIT + NO AUTO-DISCONNECT
        enableClosePage: false,
        enableForcedReload: false,
        deploymentInfo: { allowThirdPartyRequests: true },
        analytics: false,
        inactivity_timeout: 0,
        startAudioMuted: 0,
        startVideoMuted: 0,
        disableModeratorIndicator: false,
        enableLobby: false,

        p2p: { enabled: true },

        // HD VIDEO (1080p)
        resolution: 1080,
        constraints: {
          video: {
            height: {
              ideal: 1080,
              max: 1080,
              min: 720,
            },
          },
        },

        startWithAudioMuted: true,
        startWithVideoMuted: true,
      },

      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "desktop",
          "fullscreen",
          "hangup",
          "chat",
          "settings",
          "raisehand",
        ],
        DEFAULT_BACKGROUND: darkMode ? "#0f172a" : "#ffffff",
      },
    };

    const initJitsi = () => new window.JitsiMeetExternalAPI(domain, options);

    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = initJitsi;
      document.body.appendChild(script);
    } else {
      initJitsi();
    }
  }, [currentRoom, darkMode]);

  // Auto-join via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) setCurrentRoom(room);
  }, []);

  const startMeeting = () =>
    setCurrentRoom("room_" + Math.random().toString(36).substring(2, 10));

  const joinMeeting = () => {
    if (roomId.trim()) setCurrentRoom(roomId.trim());
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}?room=${currentRoom}`;
    navigator.clipboard.writeText(link).then(() => {
      setToast("Room link copied!");
      setTimeout(() => setToast(""), 2400);
    });
  };

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition`}
    >
      {/* HEADER */}
      <header className="p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl font-extrabold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HD Video Meeting (Unlimited)
        </h1>

        <div className="flex items-center gap-3">
          {/* Start */}
          <button
            onClick={startMeeting}
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl text-lg shadow hover:scale-105 active:scale-95 transition"
          >
            Start
          </button>

          {/* Room Input */}
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 rounded-xl w-40 md:w-52 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 transition"
          />

          {/* Join */}
          <button
            onClick={joinMeeting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow hover:scale-105 active:scale-95 transition"
          >
            Join
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-xl hover:scale-105 active:scale-95 transition"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      {!currentRoom && (
        <section className="flex flex-col justify-center items-center flex-1 px-6 text-center space-y-5 animate-fadeIn">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Unlimited HD Video Meetings
          </h2>
          <p className="text-lg md:text-xl max-w-2xl text-gray-700 dark:text-gray-300">
            Create or join a high-quality meeting. No limits. No accounts.
          </p>
          <button
            onClick={startMeeting}
            className="mt-2 px-10 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-xl shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Start Now
          </button>
        </section>
      )}

      {/* VIDEO AREA */}
      {currentRoom && (
        <main
          id="video-container"
          className="flex-1 min-h-[500px] bg-gray-200 dark:bg-slate-800 rounded-xl shadow-inner m-4 overflow-hidden"
        ></main>
      )}

      {/* FOOTER */}
      {currentRoom && (
        <footer className="p-5 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl shadow-md flex justify-center border-t border-gray-200 dark:border-slate-700 relative">
          <button
            onClick={copyRoomLink}
            className="px-6 py-3 bg-yellow-500 text-white rounded-xl shadow hover:scale-105 active:scale-95 transition"
          >
            Copy Link
          </button>

          {toast && (
            <span className="absolute top-2 right-4 bg-black/80 text-white px-4 py-2 rounded-xl text-sm animate-fadeIn">
              {toast}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}
