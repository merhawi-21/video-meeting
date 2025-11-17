import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState("");

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const ws = useRef(null);

  // HD video constraints
  const videoConfig = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  };

  // Start WebRTC after joining a room
  useEffect(() => {
    if (!currentRoom) return;

    ws.current = new WebSocket("ws://localhost:3001"); // <=== your signaling server
    ws.current.onopen = () => ws.current.send(JSON.stringify({ join: currentRoom }));
    ws.current.onmessage = handleSignal;

    startLocalVideo();
  }, [currentRoom]);

  // Handle WebSocket messages
  const handleSignal = async (msg) => {
    const data = JSON.parse(msg.data);
    if (!peerConnection.current) await createPeerConnection();

    if (data.offer) {
      await peerConnection.current.setRemoteDescription(data.offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      ws.current.send(JSON.stringify({ answer, room: currentRoom }));
    }

    if (data.answer) {
      await peerConnection.current.setRemoteDescription(data.answer);
    }

    if (data.iceCandidate) {
      await peerConnection.current.addIceCandidate(data.iceCandidate);
    }
  };

  // Local video
  const startLocalVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    localVideo.current.srcObject = stream;

    if (peerConnection.current) {
      stream.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, stream)
      );
    }
  };

  // Create peer connection
  const createPeerConnection = async () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (e) => {
      if (e.candidate) {
        ws.current.send(
          JSON.stringify({ iceCandidate: e.candidate, room: currentRoom })
        );
      }
    };

    peerConnection.current.ontrack = (e) => {
      remoteVideo.current.srcObject = e.streams[0];
    };

    // Add local tracks if already available
    if (localVideo.current?.srcObject) {
      localVideo.current.srcObject.getTracks().forEach((track) =>
        peerConnection.current.addTrack(track, localVideo.current.srcObject)
      );
    }

    // Send offer
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    ws.current.send(JSON.stringify({ offer, room: currentRoom }));
  };

  const startMeeting = () =>
    setCurrentRoom("room_" + Math.random().toString(36).substring(2, 10));

  const joinMeeting = () => {
    if (roomId.trim()) setCurrentRoom(roomId.trim());
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}?room=${currentRoom}`;
    navigator.clipboard.writeText(link).then(() => {
      setToast("Link copied!");
      setTimeout(() => setToast(""), 2000);
    });
  };

  return (
    <div className={`${darkMode ? "dark" : ""} h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100`}>
      {/* HEADER */}
      <header className="p-6 bg-white/60 dark:bg-slate-800/60 shadow flex justify-between">
        <h1 className="text-3xl font-bold">HD WebRTC Meeting</h1>

        <div className="flex gap-3">
          <button onClick={startMeeting} className="px-6 py-2 bg-blue-600 text-white rounded-xl">
            Start
          </button>

          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="px-4 py-2 rounded-xl"
          />

          <button onClick={joinMeeting} className="px-4 py-2 bg-green-600 text-white rounded-xl">
            Join
          </button>

          <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-gray-300 dark:bg-slate-700 rounded-xl">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* HERO */}
      {!currentRoom && (
        <div className="flex flex-col justify-center items-center flex-1">
          <h2 className="text-5xl font-bold">Unlimited HD Meetings</h2>
          <p className="text-xl mt-4">Peer-to-peer WebRTC. No limit. No watermark.</p>
        </div>
      )}

      {/* VIDEO AREA */}
      {currentRoom && (
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          <video ref={localVideo} autoPlay playsInline muted className="rounded-xl border" />
          <video ref={remoteVideo} autoPlay playsInline className="rounded-xl border" />
        </div>
      )}

      {/* FOOTER */}
      {currentRoom && (
        <footer className="p-4 bg-white/60 dark:bg-slate-800/60 text-center relative">
          <button
            onClick={copyRoomLink}
            className="px-6 py-2 bg-yellow-500 text-white rounded-xl shadow"
          >
            Copy Link
          </button>

          {toast && (
            <div className="absolute right-5 top-2 bg-black text-white px-4 py-2 rounded">
              {toast}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
