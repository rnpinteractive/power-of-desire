// UpgradePrompt.jsx
import React from "react";
import { Brain, ArrowUpRight } from "lucide-react";

const UpgradePrompt = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <div className="relative bg-[#1c1c1e] rounded-2xl overflow-hidden">
          {/* Header with fancy gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />

          {/* Content */}
          <div className="relative p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#2c2c2e] flex items-center justify-center">
                <Brain className="w-10 h-10 text-white/80" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
                Unlock Oracle Prime
              </h2>
              <p className="text-[#a0a0a0] text-base md:text-lg leading-relaxed">
                Get advanced psychological insights and personalized
                relationship strategies powered by dark psychology principles.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-[#2c2c2e] rounded-xl p-4">
                <div className="flex items-center gap-3 text-white/90 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    🎯
                  </div>
                  <h3 className="font-medium">Precision Analysis</h3>
                </div>
                <p className="text-white/60 text-sm">
                  Advanced emotional and behavioral pattern recognition
                </p>
              </div>

              <div className="bg-[#2c2c2e] rounded-xl p-4">
                <div className="flex items-center gap-3 text-white/90 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    🔮
                  </div>
                  <h3 className="font-medium">Strategic Insights</h3>
                </div>
                <p className="text-white/60 text-sm">
                  Personalized tactics based on psychological triggers
                </p>
              </div>

              <div className="bg-[#2c2c2e] rounded-xl p-4">
                <div className="flex items-center gap-3 text-white/90 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    📷
                  </div>
                  <h3 className="font-medium">Visual Analysis</h3>
                </div>
                <p className="text-white/60 text-sm">
                  Deep insights from photos and visual content
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Badge placed close to the upgrade button */}
              <div className="flex justify-center">
                <span className="bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Free for 24 Hours
                </span>
              </div>

              <a
                href="https://pay.hotmart.com/F98249538N?off=h9j8gi3w"
                className="block w-full py-4 bg-white text-black text-center font-medium rounded-xl hover:bg-white/90 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  Upgrade Now
                  <ArrowUpRight size={18} />
                </span>
              </a>

              <button
                onClick={onClose}
                className="block w-full py-4 text-white/60 hover:text-white transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
