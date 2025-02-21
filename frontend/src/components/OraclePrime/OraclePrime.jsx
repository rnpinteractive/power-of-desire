import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Brain,
  Send,
  Loader,
  X,
  ImagePlus,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { UserContext } from "../../App";
import { api } from "../../services/api";
import UpgradePrompt from "./UpgradePrompt";

const Message = ({ content, isUser, timestamp }) => (
  <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
    <div className="flex flex-col gap-1">
      <div
        className={`max-w-[85%] rounded-xl p-4 whitespace-pre-wrap ${
          isUser ? "bg-[#2c2c2e] text-white" : "bg-[#1c1c1e] text-white/90"
        }`}
      >
        {content}
      </div>
      {timestamp && (
        <div className="flex items-center gap-1 text-xs text-white/40 px-1">
          <Clock size={12} />
          <span>{new Date(timestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  </div>
);

const OraclePrime = ({ onClose }) => {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMobileImage, setShowMobileImage] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  if (!user?.oraclePrime?.isActive) {
    return <UpgradePrompt onClose={onClose} />;
  }

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.fetch(`/oracle-prime/history/${user.email}`);
        if (response.ok) {
          const history = await response.json();
          const loadedMessages = history.flatMap((chat) => [
            {
              content: chat.message || "Image Analysis",
              isUser: true,
              timestamp: chat.timestamp,
              hasImage: chat.hasImage,
            },
            {
              content: chat.content,
              isUser: false,
              timestamp: chat.timestamp,
            },
          ]);
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user.email]);

  const processImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        URL.revokeObjectURL(img.src);
        resolve(base64);
      };
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const base64 = await processImage(file);
      setImagePreview(base64);
      if (window.innerWidth < 768) {
        setShowMobileImage(true);
      }
      processInput(null, base64);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const processInput = async (text = null, image = null) => {
    try {
      setIsProcessing(true);
      const timestamp = new Date().toISOString();
      setInput("");
      const userMessage = {
        content: text || "Image Analysis",
        isUser: true,
        timestamp,
        hasImage: !!image,
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await api.fetch("/oracle-prime/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          image,
          email: user.email,
          previousMessages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process request");
      }

      const data = await response.json();
      const aiMessage = {
        content: data.content,
        isUser: false,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error processing input:", error);
      setMessages((prev) => [
        ...prev,
        {
          content: "I apologize, but I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
      if (window.innerWidth < 768) {
        setShowMobileImage(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    processInput(input.trim());
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex md:items-center justify-center z-50">
      <div className="w-full h-full md:h-auto md:max-h-[80vh] md:max-w-4xl bg-black md:rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#1c1c1e] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="text-white/80" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Oracle Prime</h2>
              <p className="text-sm text-white/60">Advanced Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="text-white/60 hover:text-white" size={20} />
          </button>
        </div>

        {showMobileImage && imagePreview && (
          <div className="md:hidden">
            <div className="relative h-48">
              <img
                src={imagePreview}
                alt="Analysis"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowMobileImage(false)}
                className="absolute top-2 left-2 p-2 bg-black/50 rounded-lg"
              >
                <ArrowLeft className="text-white" size={20} />
              </button>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader className="text-white animate-spin" size={32} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="h-[calc(100%-64px)] md:h-[600px] flex">
          <div className="flex-1 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-white/60" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <Brain size={32} className="mb-2" />
                  <p>Start a conversation with Oracle Prime</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <Message key={index} {...message} />
                ))
              )}
              {isProcessing && !showMobileImage && (
                <div className="flex items-center gap-2 text-white/60 bg-[#1c1c1e] p-3 rounded-lg w-fit">
                  <Loader className="animate-spin" size={16} />
                  <span>Analyzing...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-white/60 hover:text-white hover:bg-[#1c1c1e] rounded-lg transition-colors"
                >
                  <ImagePlus size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-[#1c1c1e] rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="p-2 text-white/60 hover:text-white hover:bg-[#1c1c1e] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

          {imagePreview && !showMobileImage && (
            <div className="hidden md:block w-72 border-l border-white/10 p-4">
              <div className="h-full flex flex-col">
                <h3 className="text-white font-medium mb-3">Visual Analysis</h3>
                <div className="relative flex-1 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Analysis"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader className="text-white animate-spin" size={32} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OraclePrime;
