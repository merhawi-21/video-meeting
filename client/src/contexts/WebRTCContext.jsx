import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const WebRTCContext = createContext();

export function useWebRTC() {
  return useContext(WebRTCContext);
}

export function WebRTCProvider({ children }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { participantId: MediaStream }
  const [currentRoom, setCurrentRoom] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [quality, setQuality] = useState({ width: 1920, height: 1080 });

  const wsRef = useRef(null);
  const peersRef = useRef({}); // { participantId: RTCPeerConnection }

  useEffect(() => {
    if (!currentRoom) return;

    // Initialize WebSocket signaling
    wsRef.current = new WebSocket("wss://your-signaling-server.com"); // REPLACE WITH YOUR SIGNALING SERVER

    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: "join", room: currentRoom }));
    };

    wsRef.current.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      const { type, from, sdp, candidate } = data;

      switch (type) {
        case "offer":
          await handleOffer(from, sdp);
          break;
        case "answer":
          await handleAnswer(from, sdp);
          break;
        case "candidate":
          await handleCandidate(from, candidate);
          break;
        case "new-participant":
          await createOffer(data.id);
          break;
        case "leave":
          handleLeave(from);
          break;
        default:
          break;
      }
    };

    // Get local media
    navigator.mediaDevices.getUserMedia({
      video: { width: quality.width, height: quality.height },
      audio: true,
    }).then(stream => setLocalStream(stream));

    return () => {
      wsRef.current?.close();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, [currentRoom, quality]);

  const sendMessage = (msg) => {
    wsRef.current?.send(JSON.stringify(msg));
  };

  const createPeerConnection = (id) => {
    const pc = new RTCPeerConnection();
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.ontrack = (e) => {
      setRemoteStreams(prev => ({ ...prev, [id]: e.streams[0] }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({ type: "candidate", candidate: event.candidate, to: id });
      }
    };

    peersRef.current[id] = pc;
    return pc;
  };

  const createOffer = async (id) => {
    const pc = createPeerConnection(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendMessage({ type: "offer", to: id, sdp: offer });
  };

  const handleOffer = async (id, sdp) => {
    const pc = createPeerConnection(id);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendMessage({ type: "answer", to: id, sdp: answer });
  };

  const handleAnswer = async (id, sdp) => {
    const pc = peersRef.current[id];
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  };

  const handleCandidate = async (id, candidate) => {
    const pc = peersRef.current[id];
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const handleLeave = (id) => {
    if (peersRef.current[id]) peersRef.current[id].close();
    delete peersRef.current[id];
    setRemoteStreams(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const toggleAudio = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    setVideoEnabled(!videoEnabled);
  };

  return (
    <WebRTCContext.Provider value={{
      localStream,
      remoteStreams,
      currentRoom,
      setCurrentRoom,
      audioEnabled,
      videoEnabled,
      toggleAudio,
      toggleVideo,
      quality,
      setQuality,
    }}>
      {children}
    </WebRTCContext.Provider>
  );
}
