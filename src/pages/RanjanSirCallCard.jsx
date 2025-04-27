import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  X,
  Play,
  Pause,
  CircleDot,
  ListMusic,
  Loader,
} from "lucide-react";
import image from "../assets/ranjan.jpeg";
import { useConversation } from "@11labs/react";

function RanjanSirCallCard() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  // Removed isWaitingForResponse state

  useEffect(() => {
    console.log("conversationId: ", conversationId);
  }, [conversationId]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const microphoneStreamRef = useRef(null);

  // Simplified conversation hook to remove waiting states
  const conversation = useConversation({
    onConnect: () => {
      console.log("Successfully connected to conversation");
      setIsConnecting(false);
      setConnectionError(null);

      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      setCallTimer(timer);
    },
    onDisconnect: (reason) => {
      console.log("Disconnect reason:", reason);
      if (callTimer) {
        clearInterval(callTimer);
        setCallTimer(null);
      }
      setCallDuration(0);

      if (isRecording) {
        stopRecording();
      }
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      // Removed waiting state updates
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setConnectionError(error.message || "Connection failed");
      setIsConnecting(false);
      endCall();
    },
    onSpeechStart: () => {
      // Removed waiting state updates
    },
  });

  const { status, isSpeaking } = conversation;

  useEffect(() => {
    const initializeMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        microphoneStreamRef.current = stream;
        console.log("Microphone access granted and ready");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setConnectionError(
          "Failed to access microphone. Please check permissions."
        );
      }
    };

    initializeMicrophone();
    const savedRecordings = localStorage.getItem("ranjanSirRecordings");
    if (savedRecordings) {
      setRecordings(JSON.parse(savedRecordings));
    }

    return () => {
      if (callTimer) {
        clearInterval(callTimer);
      }
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      if (status === "connected") {
        conversation.endSession();
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCall = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    // Removed waiting state setup
    setCallDuration(0);

    try {
      if (!microphoneStreamRef.current) {
        microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );
      }

      console.log("Starting session with ElevenLabs");
      // Immediately start the session without additional processing
      const convId = await conversation.startSession({
        agentId: "7kEIi95RiFRHLSPKXCGU",
      });

      setConversationId(convId);
    } catch (error) {
      console.error("Error starting call:", error);
      setConnectionError(error.message || "Failed to start call");
      setIsConnecting(false);
      setCallDuration(0);
    }
  };

  const endCall = async () => {
    try {
      // Directly end the session without additional processing
      await conversation.endSession();
      setCallDuration(0);
      if (callTimer) {
        clearInterval(callTimer);
        setCallTimer(null);
      }
    } catch (error) {
      console.error("Error ending call:", error);
      setCallDuration(0);
    }
  };

  const startRecording = async () => {
    try {
      if (!microphoneStreamRef.current) {
        microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        );
      }

      mediaRecorderRef.current = new MediaRecorder(microphoneStreamRef.current);
      audioChunksRef.current = [];

      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", saveRecording);

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);

    const newRecording = {
      id: Date.now(),
      url: audioUrl,
      title: `Recording - ${new Date().toLocaleString()}`,
      duration: callDuration,
    };

    const updatedRecordings = [...recordings, newRecording];
    setRecordings(updatedRecordings);

    const storableRecordings = updatedRecordings.map((rec) => ({
      id: rec.id,
      title: rec.title,
      duration: rec.duration,
      date: new Date().toISOString(),
    }));

    localStorage.setItem(
      "ranjanSirRecordings",
      JSON.stringify(storableRecordings)
    );
    setShowRecordingsModal(true);
  };

  const playRecording = (recordingId) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const recording = recordings.find((rec) => rec.id === recordingId);
    if (recording) {
      const audio = new Audio(recording.url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = (recordingId) => {
    const updatedRecordings = recordings.filter(
      (rec) => rec.id !== recordingId
    );
    setRecordings(updatedRecordings);
    const storableRecordings = updatedRecordings.map((rec) => ({
      id: rec.id,
      title: rec.title,
      duration: rec.duration,
      date: new Date().toISOString(),
    }));

    localStorage.setItem(
      "ranjanSirRecordings",
      JSON.stringify(storableRecordings)
    );
  };

  const toggleRecordingModal = () => {
    setShowRecordingsModal(!showRecordingsModal);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 p-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl">
        <div className="relative">
          <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <div className="absolute bottom-0 left-0 w-full transform translate-y-1/2 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-lg">
                <img
                  src={image}
                  alt="Ranjan Sir"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/112";
                  }}
                />
              </div>

              {status === "connected" && (
                <>
                  <div
                    className={`absolute inset-0 w-28 h-28 rounded-full border-2 ${
                      isSpeaking ? "border-indigo-500" : "border-teal-500"
                    } scale-110 opacity-50 ${
                      isSpeaking ? "animate-ping" : "animate-pulse"
                    }`}
                  ></div>
                  <div
                    className={`absolute inset-0 w-28 h-28 rounded-full border-2 ${
                      isSpeaking ? "border-indigo-500" : "border-teal-500"
                    } scale-125 opacity-30 ${
                      isSpeaking ? "animate-ping" : "animate-pulse"
                    }`}
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="pt-16 pb-6 px-6">
          <h1 className="text-2xl font-bold text-center text-slate-800">
            Ranjan Sir
          </h1>
          <p className="text-slate-600 text-center text-sm mt-1">
            Physics Teacher
          </p>

          {status === "connected" && (
            <div className="mt-6 flex justify-center">
              <div className="bg-indigo-50 px-6 py-3 rounded-full shadow-sm">
                <span className="font-mono text-indigo-700 font-medium text-lg">
                  {formatTime(callDuration)}
                </span>
              </div>
            </div>
          )}

          {connectionError && (
            <div className="mt-4 py-3 px-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600 font-medium text-sm text-center">
                {connectionError}
              </p>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <div
              className={`flex items-center space-x-2 px-5 py-2 rounded-full ${
                status === "connected"
                  ? "bg-emerald-50 text-emerald-600"
                  : isConnecting
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  status === "connected"
                    ? "bg-emerald-500"
                    : isConnecting
                    ? "bg-amber-500"
                    : "bg-slate-400"
                } ${status === "connected" ? "animate-pulse" : ""}`}
              ></div>
              <span className="text-sm font-medium">
                {status === "connected"
                  ? isSpeaking
                    ? "Speaking"
                    : "Connected"
                  : isConnecting
                  ? "Connecting..."
                  : "Ready to call"}
              </span>
            </div>
          </div>
        </div>
        {status === "connected" && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 mx-6 rounded-xl p-4 mb-6 shadow-sm border border-indigo-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-teal-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-sm font-medium text-slate-700">
                  {isSpeaking ? "Speaking..." : "Listening..."}
                </span>
              </div>

              {/* Removed waiting spinner */}
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-100">
              <p className="text-xs text-slate-600 text-center">
                {isRecording ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    Recording in progress...
                  </span>
                ) : (
                  "Having a conversation with Ranjan Sir"
                )}
              </p>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-8 rounded-t-3xl relative shadow-inner">
          {recordings.length > 0 && (
            <div className="absolute top-3 right-6">
              <button
                onClick={toggleRecordingModal}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-md hover:bg-indigo-50 transition-all duration-200"
                aria-label="Show recordings"
              >
                <ListMusic size={18} />
              </button>
            </div>
          )}

          {status !== "connected" ? (
            <div className="flex justify-center">
              <button
                onClick={startCall}
                disabled={isConnecting}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg disabled:from-slate-300 disabled:to-slate-400 active:from-indigo-600 active:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                aria-label="Start call"
              >
                {isConnecting ? (
                  <Loader size={32} className="animate-spin" />
                ) : (
                  <Phone size={32} />
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={endCall}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg active:from-red-600 active:to-red-700 transition-all duration-300 hover:scale-105"
                aria-label="End call"
              >
                <PhoneOff size={32} />
              </button>
            </div>
          )}

          {status === "connected" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all ${
                  isRecording
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? (
                  <>
                    <CircleDot size={16} className="animate-pulse" /> Stop
                    Recording
                  </>
                ) : (
                  <>
                    <CircleDot size={16} /> Record Call
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              {status !== "connected"
                ? "Tap to call Ranjan Sir"
                : "Tap the red button to end call"}
            </p>
          </div>
        </div>
      </div>
      {showRecordingsModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-lg font-medium text-slate-800">
                Your Recordings
              </h3>
              <button
                onClick={() => setShowRecordingsModal(false)}
                className="p-1 rounded-full hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {recordings.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No recordings yet
                </p>
              ) : (
                <ul className="space-y-3">
                  {recordings.map((recording) => (
                    <li
                      key={recording.id}
                      className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-100"
                    >
                      <div>
                        <p className="text-sm text-slate-800 font-medium">
                          {recording.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          Duration: {formatTime(recording.duration)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            isPlaying
                              ? pausePlayback()
                              : playRecording(recording.id)
                          }
                          className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying && currentAudio ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteRecording(recording.id)}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          aria-label="Delete recording"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => setShowRecordingsModal(false)}
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-sm font-medium transition-colors hover:from-indigo-600 hover:to-indigo-700"
                aria-label="Close recordings modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RanjanSirCallCard;
