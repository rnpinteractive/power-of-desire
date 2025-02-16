import { api } from "../services/api";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Onboarding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;

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
        const response = await api.fetch("/users/onboarding",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              ...answers,
              onboardingCompleted: true,
            }),
          }
        );

        if (response.ok) {
          navigate("/dashboard", {
            state: {
              user: { ...user, onboardingCompleted: true },
            },
          });
        }
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

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Header com nome do usuário */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-purple-800">
              Olá, {user.nome}!
            </h2>
            <p className="text-gray-600 mt-2">
              Vamos conhecer melhor sua situação para ajudar você.
            </p>
          </div>

          {/* Barra de progresso */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Pergunta {currentStep + 1} de {questions.length}
              </span>
              <span className="text-sm text-purple-600 font-medium">
                {Math.round(((currentStep + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Pergunta atual */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>

            {currentQuestion.isText ? (
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className={`w-full p-4 text-left rounded-lg transition-colors
                      ${
                        answers[currentQuestion.id] === option
                          ? "bg-purple-100 border-purple-500 border-2 text-purple-700"
                          : "bg-gray-50 hover:bg-purple-50 border border-gray-200 text-gray-700"
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
              className={`px-6 py-2 rounded-lg transition-colors
                ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-purple-600 border border-purple-600 hover:bg-purple-50"
                }`}
            >
              Voltar
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className={`px-6 py-2 rounded-lg
                ${
                  !answers[currentQuestion.id]
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
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
