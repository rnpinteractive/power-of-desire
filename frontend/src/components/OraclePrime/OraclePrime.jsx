import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Brain,
  Send,
  Loader,
  X,
  ImagePlus,
  ArrowLeft,
  Clock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { UserContext } from "../../App";
import { api } from "../../services/api";
import UpgradePrompt from "./UpgradePrompt";

const Message = ({ content, isUser, timestamp, hasImage, imageUrl }) => (
  <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
    <div
      className={`flex flex-col gap-1 ${
        isUser ? "items-end" : "items-start"
      } max-w-[85%]`}
    >
      {hasImage && imageUrl && (
        <div className="relative w-full mb-2 rounded-xl overflow-hidden">
          <img
            src={imageUrl}
            alt="Analysis"
            className="w-full object-cover rounded-xl"
            style={{ maxHeight: "200px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
        </div>
      )}
      <div
        className={`w-full rounded-xl p-4 whitespace-pre-wrap ${
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

const ImageAnalysisOverlay = ({ image, isProcessing, onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col">
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Brain className="text-white/80" size={20} />
        <span className="text-white font-medium">Visual Analysis</span>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
        <X className="text-white/60" size={20} />
      </button>
    </div>
    <div className="flex-1 relative">
      <img
        src={image}
        alt="Analysis"
        className="w-full h-full object-contain"
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
          <Loader className="text-white animate-spin" size={32} />
          <div className="text-white/90 text-lg">Processing analysis...</div>
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
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  if (!user?.oraclePrime?.isActive) {
    return <UpgradePrompt onClose={onClose} />;
  }

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.fetch(`/oracle-prime/history/${user.email}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user.email]);

  const processImage = async (file) => {
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
      setShowImageAnalysis(true);
      await processInput(null, base64);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const processInput = async (text = null, image = null) => {
    const currentInput = text || input;
    if (!currentInput && !image) return;

    const timestamp = new Date().toISOString();
    const userMessage = {
      content: currentInput || "Image Analysis",
      isUser: true,
      timestamp,
      hasImage: !!image,
      imageUrl: image,
    };

    try {
      setIsProcessing(true);
      setInput("");
      setMessages((prev) => [...prev, userMessage]);

      const response = await api.fetch("/oracle-prime/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          image,
          email: user.email,
          previousMessages: messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process request");
      }

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
      setShowImageAnalysis(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    await processInput(input.trim());
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (isInputFocused && window.innerWidth < 768) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isInputFocused]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-lg" />

      <div className="relative w-full h-full md:h-[85vh] md:max-w-5xl bg-black md:rounded-2xl overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="bg-[#1c1c1e] p-4 flex items-center justify-between shrink-0 border-b border-white/10">
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

          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 scroll-smooth"
            style={{ scrollBehavior: "smooth" }}
          >
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
            {isProcessing && !showImageAnalysis && (
              <div className="flex items-center gap-2 text-white/60 bg-[#1c1c1e] p-3 rounded-lg w-fit">
                <Loader className="animate-spin" size={16} />
                <span>Processing...</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#1c1c1e] border-t border-white/10">
            <div className="flex gap-2 items-end max-w-full">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                disabled={isProcessing}
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
              <div className="flex-1 min-w-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Ask anything..."
                  className="w-full bg-black/50 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                  style={{
                    minHeight: "44px",
                    maxHeight: "120px",
                  }}
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || !input.trim()}
                className="p-2 text-white/60 hover:text-white hover:bg-[#1c1c1e] rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showImageAnalysis && (
        <ImageAnalysisOverlay
          image={imagePreview}
          isProcessing={isProcessing}
          onClose={() => setShowImageAnalysis(false)}
        />
      )}
    </div>
  );
};

export default OraclePrime;
