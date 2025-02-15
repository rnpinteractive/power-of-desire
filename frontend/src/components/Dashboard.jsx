import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCards } from "swiper/modules";
import {
  ArrowUpRight,
  BookMarked,
  ArrowRight,
  Menu,
  X,
  Flame,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { UserContext } from "../App";
import RefundModal from "./RefundModal";

import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

const Dashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [hasRefund, setHasRefund] = useState(false);
  const navigate = useNavigate();

  // Função de Logout atualizada
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/articles/search"
        );
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    const checkRefund = async () => {
      if (user?.email) {
        try {
          const response = await fetch(
            `http://localhost:3000/api/users/refund/${user.email}`
          );
          const data = await response.json();
          setHasRefund(!!data.email);
        } catch (error) {
          console.error("Error checking refund:", error);
        }
      }
    };

    checkRefund();
  }, [user?.email]);

  const handleRefundClick = () => {
    if (hasRefund) {
      alert("You already have a refund request in progress.");
    } else {
      setRefundModalOpen(true);
      setMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">No content found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Menu Button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-8 right-8 z-50 p-2 bg-[#1c1c1e] rounded-full hover:bg-[#2c2c2e] transition-colors"
      >
        <Menu className="text-white" size={24} />
      </button>

      {/* Menu Slide */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          menuOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 
            ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />

        <div
          className={`absolute right-0 top-0 bottom-0 w-80 bg-[#1c1c1e] transition-transform duration-300
            ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-6 h-full flex flex-col">
            {/* Menu Header */}
            <div className="flex justify-between items-center mb-8">
              <img
                src="/images/conteudos/logopfd-removebg-preview.png"
                alt="Logo"
                className="h-8"
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="text-white/70 hover:text-white" size={20} />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-8 p-4 bg-white/5 rounded-lg">
              <h3 className="text-white font-medium">{user?.nome}</h3>
              <p className="text-white/70 text-sm">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="flex-1 space-y-2">
              <button
                onClick={() => {
                  navigate("/articles");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <BookMarked size={20} />
                <span>View Articles</span>
              </button>

              <button
                onClick={() => {
                  navigate("/plan");
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowRight size={20} />
                <span>View My Plan</span>
              </button>
            </div>

            {/* Menu Footer */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <button
                onClick={handleRefundClick}
                className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors
                  ${
                    hasRefund
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  }`}
              >
                <AlertCircle size={20} />
                <span>{hasRefund ? "Refund Requested" : "Request Refund"}</span>
              </button>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        userEmail={user?.email}
      />

      <div className="h-screen flex flex-col px-8 pt-8">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-between">
          <img
            src="/images/conteudos/logopfd-removebg-preview.png"
            alt="Logo"
            className="h-12"
          />
        </div>
        {/* Content Carousel */}
        <div className="relative h-[350px] mb-8 max-w-[640px] mx-auto w-full">
          <Swiper
            effect={"cards"}
            grabCursor={true}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{
              dynamicBullets: true,
            }}
            modules={[Autoplay, Pagination, EffectCards]}
            className="h-full w-full"
          >
            {articles.map((article, index) => (
              <SwiperSlide key={index}>
                <div
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="rounded-[28px] overflow-hidden bg-[#1c1c1e] h-full shadow-2xl group"
                >
                  <div className="h-[60%] relative">
                    {article.imagem ? (
                      <div className="absolute inset-0">
                        <img
                          src={article.imagem}
                          alt={article.titulo}
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/50 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-full bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e]" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex gap-2 mb-3">
                        {article.palavras_chave?.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-white/10 text-white/90 px-3 py-1 rounded-full backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-2xl font-semibold text-white">
                        {article.titulo}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-white/70 text-sm line-clamp-2 mb-3">
                      {article.conteudo?.introducao ||
                        article.conteudo ||
                        "No content available"}
                    </p>
                    <div className="flex items-center text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                      <BookMarked size={16} className="mr-2" />
                      <span className="mr-2">Read Full Content</span>
                      <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {/* Welcome Section */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-5">
          <h1 className="text-4xl font-bold text-white">
            {user ? `Hello, ${user.nome}` : "Relationships"}
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Discover personalized strategies and learn how to win back the
            person you love. Follow your daily plan.
          </p>

          <button
            onClick={() => navigate("/plan")}
            className="bg-white text-black font-semibold px-8 py-3.5 rounded-full text-lg 
                     shadow-lg transform transition-all duration-300 hover:scale-105
                     active:scale-95"
          >
            View My Plan
          </button>

          <div
            onClick={() => navigate("/articles")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500/10 
                     text-orange-400 rounded-full cursor-pointer hover:bg-orange-500/20 
                     transition-all duration-200 mt-4 group"
          >
            <Flame className="w-5 h-5" />
            <span>View More Content</span>
            <ArrowUpRight
              size={20}
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="flex justify-center py-8">
          <div className="w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
