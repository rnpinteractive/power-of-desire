import { api } from "../services/api";
import React, { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { UserContext } from "../App";

const Onboarding = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Se o usuário não estiver logado, redireciona para o login
  if (!user) {
    return <Navigate to="/" />;
  }

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    objective: "",
    timeWithoutContact: "",
    separationCause: "",
    messagesReaction: "",
    lastMessage: "",
    currentInterest: "",
    currentStatus: "",
    routine: "",
    recentAttempts: "",
    desiredOutcome: "",
  });

  const questions = [
    {
      id: "objective",
      question:
        "Do you want to get back with your ex or strengthen your current relationship?",
      options: ["Get back with ex", "Strengthen current relationship"],
    },
    {
      id: "timeWithoutContact",
      question: "How long have you been without proper communication?",
      options: [
        "Less than 1 week",
        "1-2 weeks",
        "2-4 weeks",
        "More than 1 month",
        "More than 6 months",
      ],
    },
    {
      id: "separationCause",
      question: "What caused the separation or main issue between you?",
      options: [
        "Frequent arguments",
        "Growing apart",
        "Infidelity",
        "Communication issues",
        "Jealousy",
        "Other",
      ],
    },
    {
      id: "messagesReaction",
      question:
        "How did they react to your messages before everything changed?",
      options: [
        "Quick and enthusiastic responses",
        "Delayed but caring responses",
        "Short but polite responses",
        "Cold or distant responses",
      ],
    },
    {
      id: "lastMessage",
      question: "What was the last thing they said to you?",
      isText: true,
      placeholder: "Type the last message you received...",
    },
    {
      id: "currentInterest",
      question: "Do you feel they still have any interest?",
      options: ["Yes, definitely", "Maybe", "Not sure", "Doesn't seem like it"],
    },
    {
      id: "currentStatus",
      question: "Are they with someone else right now?",
      options: ["Yes", "No", "Don't know"],
    },
    {
      id: "routine",
      question: "What was your routine together like?",
      options: [
        "Living together",
        "Seeing each other daily",
        "Meeting a few times a week",
        "Occasional meetings",
      ],
    },
    {
      id: "recentAttempts",
      question: "Have you tried to reach out recently? How did it go?",
      isText: true,
      placeholder: "Describe your recent contact attempts...",
    },
    {
      id: "desiredOutcome",
      question: "What would you like to happen now?",
      options: [
        "Complete reconciliation",
        "Rekindle interest",
        "Just talk again",
        "Move on",
      ],
    },
  ];

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentStep].id]: answer,
    }));
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        const response = await api.fetch("/users/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            ...answers,
            onboardingCompleted: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save onboarding data");
        }

        const data = await response.json();

        // Atualiza o usuário no contexto e no localStorage
        const updatedUser = { ...user, onboardingCompleted: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        navigate("/dashboard");
      } catch (error) {
        console.error("Erro ao salvar onboarding:", error);
        alert("Erro ao salvar suas respostas. Por favor, tente novamente.");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Logo */}
      <header className="p-8">
        <div className="max-w-2xl mx-auto">
          <img
            src="/images/conteudos/logopfd-removebg-preview.png"
            alt="Power of Desire"
            className="h-12 mx-auto mb-8"
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-[#1c1c1e] rounded-2xl shadow-xl p-6 md:p-8 border border-white/10">
          {/* Header with user's name */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-white mb-3">
              Hello, <span className="font-medium">{user.nome}</span>!
            </h2>
            <p className="text-white/60">
              Let's understand your situation better to help you.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/40">
                Question {currentStep + 1} of {questions.length}
              </span>
              <span className="text-sm text-blue-400 font-medium">
                {Math.round(((currentStep + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-[#2c2c2e] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Current Question */}
          <div className="mb-8">
            <h3 className="text-xl font-medium text-white mb-6">
              {currentQuestion.question}
            </h3>

            {currentQuestion.isText ? (
              <textarea
                className="w-full p-4 bg-[#2c2c2e] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="4"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
              />
            ) : (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 text-left rounded-xl transition-all duration-300
                      ${
                        answers[currentQuestion.id] === option
                          ? "bg-blue-500/20 border-blue-500 border text-white"
                          : "bg-[#2c2c2e] hover:bg-[#3c3c3e] border border-white/10 text-white/80 hover:text-white"
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-xl transition-all duration-300
                ${
                  currentStep === 0
                    ? "bg-[#2c2c2e] text-white/40 cursor-not-allowed"
                    : "bg-[#2c2c2e] text-white/80 hover:text-white border border-white/10 hover:bg-[#3c3c3e]"
                }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className={`px-6 py-3 rounded-xl transition-all duration-300
                ${
                  !answers[currentQuestion.id]
                    ? "bg-[#2c2c2e] text-white/40 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
                }`}
            >
              {currentStep === questions.length - 1 ? "Complete" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
