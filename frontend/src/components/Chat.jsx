import React, { useEffect,useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import api from "../services/api";

const BusinessChatBox = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Map previous messages to the format expected by our backend ChatRequest DTO
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await api.post(`/query/chat`, {
        chat_history: chatHistory,
        message: userMessage
      });

      const botResponse = response.data?.reply || "⚠ No response received.";

      setMessages([
        ...newMessages,
        { role: "assistant", content: botResponse },
      ]);
    } catch (error) {
      console.error("AI API error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "⚠ Failed to fetch response. Please check your API key or try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-[450px] sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl border dark:border-gray-700 rounded-2xl overflow-hidden flex flex-col max-h-[70vh] transition-colors">
      <div className="p-4 bg-[#002244] dark:bg-gray-800 text-white flex justify-between rounded-t-lg transition-colors">
        <span className="font-bold">Business Strategy Assistant</span>
        <button
          onClick={onClose}
          className="hover:bg-neutral-700 dark:hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
        >
          X
        </button>
      </div>

      <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 transition-colors">
        {messages.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 text-center p-4">
            Welcome! Ask me anything about business strategy, KPIs, growth
            plans, or market trends.
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-3 rounded-lg shadow-sm max-w-[85%] ${
              msg.role === "user"
                ? "bg-blue-600 dark:bg-blue-700 text-white text-right ml-auto"
                : "bg-transparent dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 mr-auto"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="animate-bounce">●</div>
            <div className="animate-bounce [animation-delay:0.2s]">●</div>
            <div className="animate-bounce [animation-delay:0.4s]">●</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex transition-colors">
        <input
          type="text"
          className="flex-1 p-2 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          placeholder="Ask me about strategy, KPIs, market insights..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={false}
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-[#002244] dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default BusinessChatBox;
