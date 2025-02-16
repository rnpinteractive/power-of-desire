import { api } from '../services/api';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Calendar,
  ChevronDown,
  BookOpen,
  Sparkles,
  Lightbulb,
  Star,
  AlertCircle,
} from "lucide-react";

const ArticlePage = () => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.fetch(`/articles/${id}`
        );
        if (!response.ok) throw new Error("Article not found");
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        setError("Unable to load article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const processText = (text) => {
    if (!text) return null;

    const parts = text.split(/(".*?"|\*\*.*?\*\*|\*[^\*]+\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={index} className="group/quote relative inline-block my-1">
            <span className="relative">
              <span className="absolute -left-2 top-0 text-3xl text-purple-400/40 font-serif">
                "
              </span>
              <span className="text-white/90 italic relative z-10 bg-gradient-to-r from-purple-400/20 to-transparent px-4 py-1 rounded">
                {part.slice(1, -1)}
              </span>
              <span className="absolute -right-2 bottom-0 text-3xl text-purple-400/40 font-serif">
                "
              </span>
            </span>
          </span>
        );
      } else if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={index} className="relative inline-block mx-1">
            <span className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 rounded-lg text-white/90 font-medium">
              {part.slice(2, -2)}
            </span>
          </span>
        );
      } else if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <span key={index} className="relative inline-block mx-1">
            <span className="text-amber-300 font-medium bg-amber-300/10 px-2 rounded">
              {part.slice(1, -1)}
            </span>
          </span>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-white/50 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-[Inter] selection:bg-white/20 selection:text-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 h-1 bg-black z-50 w-full">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-200"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-40 flex items-center gap-2 text-white/70 hover:text-white transition-all duration-300 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/10"
      >
        <ArrowLeft
          size={18}
          className="transition-transform group-hover:-translate-x-0.5"
        />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Hero Section */}
      <div className="relative w-full h-screen md:h-[75vh] overflow-hidden">
        {article.imagem && (
          <>
            <div className="absolute inset-0">
              <img
                src={article.imagem}
                alt={article.titulo}
                className="w-full h-full object-cover scale-105 animate-subtle-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black"></div>
            </div>
          </>
        )}

        {/* Hero content */}
        <div className="relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-center">
          <div className="max-w-3xl">
            {/* Category Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                <BookOpen size={16} />
                {article.categoria}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-light mb-6 leading-tight tracking-tight">
              {article.titulo}
            </h1>

            {article.subtitulo && (
              <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed font-light">
                {article.subtitulo}
              </p>
            )}

            <div className="flex items-center gap-6 text-sm">
              {article.dataCriacao && (
                <div className="flex items-center gap-2 text-white/60">
                  <Calendar size={14} strokeWidth={1.5} />
                  <time dateTime={article.dataCriacao}>
                    {new Date(article.dataCriacao).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              )}
              {article.tempoLeitura && (
                <div className="flex items-center gap-2 text-white/60">
                  <Clock size={14} strokeWidth={1.5} />
                  <span>{article.tempoLeitura} read</span>
                </div>
              )}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
            <span className="text-white/60 text-sm font-light tracking-wide">
              Scroll to read
            </span>
            <ChevronDown size={24} className="text-white/60 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Article content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <article>
          {typeof article.conteudo === "object" ? (
            <>
              {/* Introdução */}
              {article.conteudo.introducao && (
                <div className="relative mb-16">
                  <div className="flex items-center gap-2 mb-6 text-purple-400">
                    <Sparkles size={20} />
                    <span className="text-sm font-medium uppercase tracking-wider">
                      Introduction
                    </span>
                  </div>
                  <div className="text-xl md:text-2xl text-white/80 leading-relaxed tracking-tight font-light">
                    {processText(article.conteudo.introducao)}
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="flex items-center gap-4 my-16">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <Star size={16} className="text-white/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* Tópicos */}
              {article.conteudo.topicos?.map((topico, index) => (
                <section key={index} className="mb-16 group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Lightbulb size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-white font-medium mb-6 tracking-tight group-hover:text-white/90 transition-colors">
                        {topico.titulo}
                      </h2>
                      <div className="text-white/70 text-lg leading-relaxed">
                        {processText(topico.texto)}
                      </div>
                    </div>
                  </div>
                </section>
              ))}

              {/* Separator */}
              <div className="flex items-center gap-4 my-16">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <Star size={16} className="text-white/40" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* Conclusão */}
              {article.conteudo.conclusao && (
                <div className="relative">
                  <div className="flex items-center gap-2 mb-6 text-amber-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium uppercase tracking-wider">
                      Conclusion
                    </span>
                  </div>
                  <div className="text-xl md:text-2xl text-white/80 leading-relaxed tracking-tight font-light">
                    {processText(article.conteudo.conclusao)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-white/70">{processText(article.conteudo)}</div>
          )}
        </article>
      </div>
    </div>
  );
};

export default ArticlePage;
