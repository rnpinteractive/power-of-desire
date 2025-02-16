import { api } from "../services/api";
import React, { useState, useEffect, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  LightbulbOff,
  Copy,
  RotateCw,
  Menu,
} from "lucide-react";

// Função para normalizar o plano, unificando as chaves em inglês e português
const normalizePlan = (plan) => {
  if (!plan) return plan;
  return {
    day: plan.day || plan.dia,
    titulo: plan.titulo || plan.title,
    subtitulo: plan.subtitulo || plan.subtitle,
    mensagem:
      plan.mensagem ||
      (plan.message
        ? {
            texto: plan.message.text || plan.message.texto,
            contexto: plan.message.context || plan.message.contexto,
          }
        : {}),
    dicas: (plan.dicas || plan.tips || []).map((item) => ({
      titulo: item.titulo || item.title,
      texto: item.texto || item.text,
    })),
    evitar: (plan.evitar || plan.avoid || []).map((item) => ({
      titulo: item.titulo || item.title,
      texto: item.texto || item.text,
    })),
    generatedAt: plan.generatedAt,
  };
};

// Componente de Timeline dos Dias (Desktop)
const DaysTimeline = ({ currentDay, onDaySelect }) => {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <button
          key={day}
          onClick={() => onDaySelect(day)}
          className={`group relative flex-shrink-0 w-32 rounded-xl overflow-hidden ${
            currentDay === day
              ? "bg-gradient-to-r from-blue-600 to-indigo-600"
              : "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
          }`}
        >
          <div className="px-4 py-3">
            <span className="block text-xs text-white/60 mb-1">Day</span>
            <span
              className={`text-lg font-medium ${
                currentDay === day ? "text-white" : "text-white/80"
              }`}
            >
              {day}
            </span>
          </div>
          {currentDay === day && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
          )}
        </button>
      ))}
    </div>
  );
};

// Tabs para navegação mobile
const MobileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "message", label: "Message", icon: Send },
    { id: "tips", label: "Tips", icon: CheckCircle2 },
    { id: "avoid", label: "Avoid", icon: LightbulbOff },
  ];

  return (
    <div className="flex border-b border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-sm font-medium transition-colors relative
              ${activeTab === tab.id ? "text-white" : "text-white/40"}`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};

// Modal para seleção dos dias no mobile
const DaySelectionModal = ({ isOpen, onClose, currentDay, onSelectDay }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#1c1c1e] w-full sm:max-w-md m-0 sm:m-4 rounded-t-2xl sm:rounded-2xl">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3 sm:hidden" />
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            Select Day
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <button
                key={day}
                onClick={() => {
                  onSelectDay(day);
                  onClose();
                }}
                className={`aspect-square rounded-2xl flex items-center justify-center text-lg font-medium transition-all duration-300
                  ${
                    currentDay === day
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-105 shadow-lg"
                      : "bg-[#2c2c2e] text-white/70 hover:bg-[#3c3c3e] hover:text-white"
                  }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WeekPlan = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [planDoDia, setPlanDoDia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("message");

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const buscarPlanoDoDia = async (dia, forceRegenerate = false) => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);

    try {
      // Usa a nova estrutura de pastas
      const url = `/users/${user.email}/plan/${dia}${
        forceRegenerate ? "?regenerate=true" : ""
      }`;
      const response = await api.fetch(url);

      if (!response.ok) {
        throw new Error("Error loading plan");
      }

      const data = await response.json();
      setPlanDoDia(normalizePlan(data));
    } catch (error) {
      console.error("Error:", error);
      setError("Unable to load your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      buscarPlanoDoDia(1);
    }
  }, [user?.email]);

  const handleDayClick = (dia) => {
    setCurrentDay(dia);
    buscarPlanoDoDia(dia);
  };

  const handleRegenerate = () => {
    buscarPlanoDoDia(currentDay, true);
  };

  const handleCopyMessage = async () => {
    if (planDoDia?.mensagem?.texto) {
      try {
        await navigator.clipboard.writeText(planDoDia.mensagem.texto);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error copying message:", err);
      }
    }
  };

  const renderMobileContent = () => {
    if (!planDoDia) return null;

    switch (activeTab) {
      case "message":
        return (
          <section className="p-4">
            <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Today's Message
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerate}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/5"
                      title="Generate new message"
                    >
                      <RotateCw size={20} />
                    </button>
                    <button
                      onClick={handleCopyMessage}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/5"
                      title="Copy message"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-[#2c2c2e] rounded-xl p-4 mb-4">
                  <p className="text-white/90 text-lg font-medium">
                    {planDoDia.mensagem.texto}
                  </p>
                </div>

                <p className="text-white/60 text-sm">
                  {planDoDia.mensagem.contexto}
                </p>

                {copied && (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500/10 text-green-400 rounded-lg mt-4">
                    <CheckCircle2 size={16} />
                    <span className="text-sm">Message copied!</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case "tips":
        return (
          <section className="p-4">
            <div className="bg-[#1c1c1e] rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-blue-400" />
                Strategic Tips
              </h3>
              <div className="space-y-4">
                {planDoDia.dicas.map((dica, index) => (
                  <div
                    key={index}
                    className="bg-[#2c2c2e] rounded-xl p-4 border-l-4 border-blue-500/50"
                  >
                    <h4 className="text-white font-medium mb-2">
                      {dica.titulo}
                    </h4>
                    <p className="text-white/70">{dica.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "avoid":
        return (
          <section className="p-4">
            <div className="bg-[#1c1c1e] rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <LightbulbOff size={20} className="text-red-400" />
                Avoid These Mistakes
              </h3>
              <div className="space-y-4">
                {planDoDia.evitar.map((item, index) => (
                  <div
                    key={index}
                    className="bg-[#2c2c2e] rounded-xl p-4 border-l-4 border-red-500/50"
                  >
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <XCircle size={16} className="text-red-400" />
                      {item.titulo}
                    </h4>
                    <p className="text-white/70">{item.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-lg z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="h-16 px-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span className="text-sm font-medium">Back</span>
            </button>

            <img
              src="/images/conteudos/logopfd-removebg-preview.png"
              alt="Logo"
              className="h-8"
            />

            <div className="flex items-center gap-4">
              <span className="text-sm text-white/40">Hi, {user.nome}</span>
            </div>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden md:block border-t border-white/10">
            <div className="h-20 px-4 flex items-center">
              <DaysTimeline
                currentDay={currentDay}
                onDaySelect={handleDayClick}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Mobile */}
      <div className="md:hidden">
        <div className="pt-16">
          {/* Title Section */}
          {planDoDia && !loading && (
            <div className="px-4 py-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {planDoDia.titulo}
              </h2>
              <p className="text-white/70">{planDoDia.subtitulo}</p>
            </div>
          )}

          {/* Mobile Tabs */}
          <MobileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw
                className="animate-spin text-white/40 mb-4"
                size={32}
              />
              <p className="text-white/70">
                {planDoDia
                  ? "Generating a new plan..."
                  : "Loading your plan..."}
              </p>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-500/10 rounded-2xl p-6 text-center">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => buscarPlanoDoDia(currentDay)}
                  className="mt-4 text-white/60 hover:text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            renderMobileContent()
          )}
        </div>

        {/* Mobile Day Selector */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-lg border-t border-white/10 z-40">
          <button
            onClick={() => setIsDayModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#1c1c1e] rounded-xl text-white"
          >
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              <span className="font-medium">Day {currentDay}</span>
            </div>
            <ChevronDown size={20} className="text-white/40" />
          </button>
        </div>
      </div>

      {/* Conteúdo Desktop */}
      <div className="hidden md:block">
        <main className="pt-36 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            {/* Title Section */}
            {planDoDia && !loading && (
              <div className="mb-8 max-w-3xl">
                <h2 className="text-3xl font-bold text-white mb-3">
                  {planDoDia.titulo}
                </h2>
                <p className="text-lg text-white/70">{planDoDia.subtitulo}</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw
                  className="animate-spin text-white/40 mb-4"
                  size={32}
                />
                <p className="text-white/70">
                  {planDoDia
                    ? "Generating a new plan..."
                    : "Loading your plan..."}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 rounded-2xl p-6 text-center my-8 max-w-3xl mx-auto">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => buscarPlanoDoDia(currentDay)}
                  className="mt-4 text-white/60 hover:text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && planDoDia && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Message Section - Larger Column */}
                <div className="lg:col-span-2">
                  <section className="bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-semibold text-white">
                          Today's Message
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRegenerate}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/5"
                            title="Generate new message"
                          >
                            <RotateCw size={20} />
                          </button>
                          <button
                            onClick={handleCopyMessage}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-white/5"
                            title="Copy message"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-xl p-6 mb-4">
                        <p className="text-white/90 text-xl font-medium leading-relaxed">
                          {planDoDia.mensagem.texto}
                        </p>
                      </div>

                      <p className="text-white/60 text-base">
                        {planDoDia.mensagem.contexto}
                      </p>

                      {copied && (
                        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500/10 text-green-400 rounded-lg mt-4">
                          <CheckCircle2 size={16} />
                          <span className="text-sm">Message copied!</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Strategic Tips Section */}
                  <section className="mt-6 bg-[#1c1c1e] rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-blue-400" />
                      Strategic Tips
                    </h3>
                    <div className="space-y-4">
                      {planDoDia.dicas.map((dica, index) => (
                        <div
                          key={index}
                          className="bg-[#2c2c2e] rounded-xl p-6 border-l-4 border-blue-500/50"
                        >
                          <h4 className="text-lg text-white font-medium mb-3">
                            {dica.titulo}
                          </h4>
                          <p className="text-white/70 leading-relaxed">
                            {dica.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Mistakes to Avoid Section - Smaller Column */}
                <div className="lg:col-span-1">
                  <section className="bg-[#1c1c1e] rounded-2xl p-8 sticky top-36">
                    <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                      <LightbulbOff size={24} className="text-red-400" />
                      Avoid These Mistakes
                    </h3>
                    <div className="space-y-4">
                      {planDoDia.evitar.map((item, index) => (
                        <div
                          key={index}
                          className="bg-[#2c2c2e] rounded-xl p-6 border-l-4 border-red-500/50"
                        >
                          <h4 className="text-lg text-white font-medium mb-3 flex items-center gap-2">
                            <XCircle size={18} className="text-red-400" />
                            {item.titulo}
                          </h4>
                          <p className="text-white/70 leading-relaxed">
                            {item.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Seleção de Dias */}
      <DaySelectionModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        currentDay={currentDay}
        onSelectDay={handleDayClick}
      />
    </div>
  );
};

export default WeekPlan;
