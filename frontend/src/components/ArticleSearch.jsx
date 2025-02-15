import { api } from '../services/api';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Flame,
  TrendingUp,
  BookMarked,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "initial-activation",
    label: "Initial Activation",
    matchValue: "Initial Activation",
    icon: Flame,
    description: "Trigger initial interest.",
    color: "from-yellow-600 to-orange-600",
  },
  {
    id: "intensification-amplification",
    label: "Intensification & Amplification",
    matchValue: "Intensification & Amplification",
    icon: TrendingUp,
    description: "Deepen emotional impact.",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "maintenance-permanence",
    label: "Maintenance & Permanence",
    matchValue: "Maintenance & Permanence",
    icon: BookMarked,
    description: "Sustain long-term connection.",
    color: "from-green-600 to-teal-600",
  },
];

const ArticleSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const navigate = useNavigate();

  const searchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetch("/articles/search");
      if (!response.ok) throw new Error("Error fetching content");
      const data = await response.json();

      setArticles(data);
      filterArticles(data, searchQuery, activeCategory);

      if (data.length > 0) {
        setFeaturedArticle(data.find((article) => article.destaque) || data[0]);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      setError("Unable to load content");
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = (articles, query = "", category = null) => {
    let filtered = [...articles];

    if (query) {
      filtered = filtered.filter(
        (article) =>
          (typeof article.titulo === "string" &&
            article.titulo.toLowerCase().includes(query.toLowerCase())) ||
          (typeof article.conteudo === "string" &&
            article.conteudo.toLowerCase().includes(query.toLowerCase())) ||
          (Array.isArray(article.palavras_chave) &&
            article.palavras_chave.some(
              (tag) =>
                typeof tag === "string" &&
                tag.toLowerCase().includes(query.toLowerCase())
            ))
      );
    }

    if (category) {
      const categoryData = CATEGORIES.find((c) => c.id === category);
      if (categoryData) {
        filtered = filtered.filter(
          (article) => article.categoria === categoryData.matchValue
        );
      }
    }

    setFilteredArticles(filtered);
  };

  useEffect(() => {
    searchArticles();
  }, []);

  useEffect(() => {
    filterArticles(articles, searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    filterArticles(articles, searchQuery, activeCategory);
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header com Logo, Back e Search */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-[#1c1c1e]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm group"
            >
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-1"
              />
              <span>Back</span>
            </button>
            <img
              src="/images/conteudos/logopfd-removebg-preview.png"
              alt="Logo"
              className="h-8 sm:hidden"
            />
          </div>
          <div className="hidden sm:block">
            <img
              src="/images/conteudos/logopfd-removebg-preview.png"
              alt="Logo"
              className="h-8"
            />
          </div>
          <form onSubmit={handleSearch} className="relative max-w-2xl w-full">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1c1c1e] rounded-xl border border-[#2c2c2e] focus:border-[#3c3c3e] focus:ring-1 focus:ring-[#3c3c3e] transition-all"
              placeholder="Search content..."
            />
          </form>
        </div>
      </header>

      {/* Categories */}
      <section className="border-b border-[#1c1c1e]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-[#2c2c2e]"
                      : "bg-[#1c1c1e] hover:bg-[#2c2c2e]"
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${
                      category.color
                    } opacity-0 ${
                      isActive ? "opacity-100" : "group-hover:opacity-50"
                    } transition-opacity`}
                  />
                  <div className="relative z-10 flex items-center p-4">
                    <div
                      className={`flex-shrink-0 p-3 rounded-full ${
                        isActive
                          ? "bg-[#4c4c4e]"
                          : "bg-[#3c3c3e] group-hover:bg-[#4c4c4e]"
                      } transition-all`}
                    >
                      <Icon
                        size={24}
                        className={`${
                          isActive ? "text-white" : "text-gray-300"
                        }`}
                      />
                    </div>
                    <div className="ml-4 flex-1 text-left">
                      <h3 className="font-semibold">{category.label}</h3>
                      <p className="text-sm text-gray-400">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 transition-colors group-hover:text-white">
                      <span className="hidden md:inline">View content</span>
                      <ChevronRight className="transition-all duration-300 transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Content */}
        {featuredArticle && !searchQuery && !activeCategory && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Flame size={20} className="text-orange-500" />
              <h2 className="text-lg font-semibold">Featured Content</h2>
            </div>
            <div
              onClick={() => navigate(`/article/${featuredArticle.id}`)}
              className="group relative bg-gradient-to-br from-[#1c1c1e] to-[#2c2c2e] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            >
              {featuredArticle.imagem && (
                <div className="relative h-64 sm:h-80">
                  <img
                    src={featuredArticle.imagem}
                    alt={featuredArticle.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>
              )}
              <div className="relative p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                    {featuredArticle.categoria}
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <TrendingUp size={16} />
                    <span className="text-sm">Most viewed</span>
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-4 transition-colors group-hover:text-purple-400">
                  {featuredArticle.titulo}
                </h3>
                <p className="text-gray-400 line-clamp-2 mb-4">
                  {featuredArticle.conteudo?.introducao ||
                    featuredArticle.conteudo}
                </p>
                <div className="flex items-center text-purple-400">
                  <BookMarked size={16} className="mr-2" />
                  <span className="mr-2">View full content</span>
                  <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-[#3c3c3e]" />
                <h2 className="text-lg font-semibold">
                  {activeCategory
                    ? `Content about ${
                        CATEGORIES.find((c) => c.id === activeCategory)?.label
                      }`
                    : "All Content"}
                </h2>
              </div>
              <span className="text-sm text-gray-400">
                {filteredArticles.length}{" "}
                {filteredArticles.length === 1 ? "content" : "contents"}
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="group relative bg-[#1c1c1e] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                >
                  {article.imagem && (
                    <div className="relative h-48">
                      <img
                        src={article.imagem}
                        alt={article.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs px-3 py-1 bg-[#3c3c3e] rounded-full">
                        {article.categoria}
                      </span>
                      {article.palavras_chave?.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-[#3c3c3e]/50 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold mb-3 transition-colors group-hover:text-purple-400">
                      {article.titulo}
                    </h3>

                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                      {article.conteudo?.introducao || article.conteudo}
                    </p>

                    <div className="flex items-center text-sm text-purple-400 transition-all duration-300 group-hover:text-purple-300">
                      <BookMarked size={16} className="mr-2" />
                      <span className="mr-2">View full content</span>
                      <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Lightbulb size={32} className="mx-auto text-[#3c3c3e] mb-4" />
            <p className="text-gray-400">No content found</p>
            {(searchQuery || activeCategory) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="mt-4 text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticleSearch;
