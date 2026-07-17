import { Mic, MicOff } from "lucide-react";
import React, { useEffect, useRef,useState } from "react";

const VoiceSearchModal = ({ darkMode, onClose, onQuery }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState(
    "Click the microphone to start speaking",
  );
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setMessage("Voice recognition is not supported in your browser.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setMessage("Listening... Speak your query");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }

      setTranscript(finalTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      setMessage("Recording stopped. Submit your query or start again.");
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setMessage(`Error occurred: ${event.error}`);
    };

    // Store recognition instance in ref so we can access it later
    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    setTranscript("");
    setIsListening(true);
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setMessage("Recording complete. You can submit your query now.");
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onClose();
      onQuery(transcript);
    } else {
      setMessage("Please record a query first.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div
        className={`rounded-xl p-6 max-w-md w-full shadow-2xl border ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-800"}`}
      >
        <h2 className="text-xl font-bold mb-4">Query Database</h2>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex gap-4">
            {!isListening ? (
              <button
                onClick={startListening}
                className={`p-6 rounded-full transition-all ${
                  darkMode
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
                } text-white`}
              >
                <Mic className="h-8 w-8" />
              </button>
            ) : (
              <button
                onClick={stopListening}
                className={`p-6 rounded-full transition-all ${
                  darkMode
                    ? "bg-red-600 animate-pulse"
                    : "bg-red-500 animate-pulse"
                } text-white`}
              >
                <MicOff className="h-8 w-8" />
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className={`px-4 py-2 self-center rounded-lg ${
                  darkMode
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-500 hover:bg-indigo-600"
                } text-black`}
              >
                Done
              </button>
            )}
          </div>

          <p
            className={`text-sm text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            {message}
          </p>

          {transcript && (
            <div
              className={`mt-4 p-4 rounded-lg w-full ${darkMode ? "bg-slate-700" : "bg-gray-100"}`}
            >
              <p
                className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Your query:
              </p>
              <p className="text-lg mt-1">{transcript}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!transcript.trim()}
            className={`px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white 
              ${!transcript.trim() ? "opacity-50 cursor-not-allowed" : "hover:from-indigo-600 hover:to-purple-600"}`}
          >
            Submit Query
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;
