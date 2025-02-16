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
        "Você deseja recuperar um ex ou fortalecer seu relacionamento atual?",
      options: ["Recuperar ex", "Fortalecer relacionamento atual"],
    },
    {
      id: "timeWithoutContact",
      question: "Há quanto tempo vocês não conversam direito?",
      options: [
        "Menos de 1 semana",
        "1-2 semanas",
        "2-4 semanas",
        "Mais de 1 mês",
        "Mais de 6 meses",
      ],
    },
    {
      id: "separationCause",
      question: "O que causou a separação ou o problema principal entre vocês?",
      options: [
        "Brigas frequentes",
        "Distanciamento",
        "Traição",
        "Problemas de comunicação",
        "Ciúmes",
        "Outro",
      ],
    },
    {
      id: "messagesReaction",
      question:
        "Como ele costumava reagir às suas mensagens antes de tudo mudar?",
      options: [
        "Respondia rapidamente e com entusiasmo",
        "Demorava mas respondia com carinho",
        "Respostas curtas mas educadas",
        "Respostas frias ou distantes",
      ],
    },
    {
      id: "lastMessage",
      question: "Qual foi a última coisa que ele disse pra você?",
      isText: true,
      placeholder: "Digite a última mensagem que recebeu...",
    },
    {
      id: "currentInterest",
      question: "Você sente que ele ainda tem algum interesse?",
      options: [
        "Sim, definitivamente",
        "Talvez",
        "Não tenho certeza",
        "Parece que não",
      ],
    },
    {
      id: "currentStatus",
      question: "Ele está com outra pessoa no momento?",
      options: ["Sim", "Não", "Não sei"],
    },
    {
      id: "routine",
      question: "Como era a rotina de vocês juntos?",
      options: [
        "Morávamos juntos",
        "Nos víamos todos os dias",
        "Nos víamos alguns dias da semana",
        "Encontros ocasionais",
      ],
    },
    {
      id: "recentAttempts",
      question:
        "Você já tentou mandar alguma mensagem recentemente? Como foi a resposta?",
      isText: true,
      placeholder: "Descreva suas tentativas recentes de contato...",
    },
    {
      id: "desiredOutcome",
      question: "O que você gostaria que acontecesse agora?",
      options: [
        "Reconciliação total",
        "Reacender o interesse",
        "Apenas conversar",
        "Esquecer e seguir em frente",
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
      {/* Header com Logo */}
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
          {/* Header com nome do usuário */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-white mb-3">
              Olá, <span className="font-medium">{user.nome}</span>!
            </h2>
            <p className="text-white/60">
              Vamos conhecer melhor sua situação para ajudar você.
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/40">
                Pergunta {currentStep + 1} de {questions.length}
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

          {/* Pergunta atual */}
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

          {/* Botões de navegação */}
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
              Voltar
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
              {currentStep === questions.length - 1 ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
