import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
  CircleDot,
  ListMusic,
} from "lucide-react";
import image from "../assets/ranjan.jpeg";

function RanjanSirCallCard() {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("disconnected");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
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
    };
  }, [callTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCall = async () => {
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnecting(false);
      setStatus("connected");
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      setCallTimer(timer);

      setInterval(() => {
        setIsSpeaking((prev) => !prev);
      }, 3000);
    }, 2000);
  };

  const endCall = async () => {
    setStatus("disconnected");
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }

    setTimeout(() => {
      setCallDuration(0);
    }, 1000);

    if (isRecording) {
      stopRecording();
    }
  };

  const toggleMute = async () => {
    if (status === "connected") {
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeakerMute = async () => {
    if (status === "connected") {
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
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
    <div className="w-full min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-lg">
        <div className="relative">
          <div className="h-40 bg-indigo-50"></div>
          <div className="absolute bottom-0 left-0 w-full transform translate-y-1/2 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden shadow-md">
                <img
                  src={image}
                  alt="Ranjan Sir"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Animated rings when speaking/listening */}
              {status === "connected" && (
                <>
                  <div
                    className={`absolute inset-0 w-28 h-28 rounded-full border-2 ${
                      isSpeaking ? "border-indigo-400" : "border-teal-400"
                    } scale-110 opacity-50 ${
                      isSpeaking ? "animate-ping" : "animate-pulse"
                    }`}
                  ></div>
                  <div
                    className={`absolute inset-0 w-28 h-28 rounded-full border-2 ${
                      isSpeaking ? "border-indigo-400" : "border-teal-400"
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
          <p className="text-slate-500 text-center text-sm mt-1">
            Physics Teacher
          </p>

          {/* Time component showing call duration */}
          {status === "connected" && (
            <div className="mt-6 flex justify-center">
              <div className="bg-slate-100 px-6 py-3 rounded-full shadow-sm">
                <span className="font-mono text-indigo-600 font-medium text-lg">
                  {formatTime(callDuration)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                status === "connected"
                  ? "bg-emerald-50 text-emerald-600"
                  : isConnecting
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
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
              <span className="text-sm">
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
          <div className="bg-slate-50 mx-6 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking
                      ? "bg-indigo-500 animate-pulse"
                      : "bg-teal-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-sm text-slate-600">
                  {isSpeaking ? "Speaking..." : "Listening..."}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
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
        <div className="bg-slate-100 px-6 py-8 rounded-t-3xl relative">
          {recordings.length > 0 && (
            <div className="absolute top-3 right-6">
              <button
                onClick={toggleRecordingModal}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-md hover:bg-indigo-50 transition-all duration-200"
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
                className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md disabled:bg-slate-300 active:bg-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {isConnecting ? (
                  <div className="animate-spin w-8 h-8 border-3 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Phone size={32} />
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center space-x-5">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full ${
                  isMuted ? "bg-red-500" : "bg-white"
                } flex items-center justify-center ${
                  isMuted ? "text-white" : "text-slate-700"
                } shadow-md active:opacity-80 transition-all duration-200 hover:scale-105`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={endCall}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md active:bg-red-600 transition-all duration-300 hover:scale-105"
              >
                <PhoneOff size={32} />
              </button>

              <button
                onClick={toggleSpeakerMute}
                className={`w-14 h-14 rounded-full ${
                  isSpeakerMuted ? "bg-red-500" : "bg-white"
                } flex items-center justify-center ${
                  isSpeakerMuted ? "text-white" : "text-slate-700"
                } shadow-md transition-all duration-200 hover:scale-105`}
              >
                {isSpeakerMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
          )}
          {status === "connected" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
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
                      className="bg-slate-50 rounded-lg p-3 flex items-center justify-between"
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
                className="w-full py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors hover:bg-indigo-600"
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
