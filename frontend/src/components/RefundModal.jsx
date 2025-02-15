import { api } from '../services/api';
import React, { useState } from "react";

const RefundModal = ({ isOpen, onClose, userEmail }) => {
  const [reason, setReason] = useState("");
  const [confirmStep, setConfirmStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRefundRequest = async () => {
    try {
      setLoading(true);

      // PRIMEIRO verifica se já existe reembolso
      const response = await fetch(
        `http://localhost:3000/api/users/refund/${userEmail}`
      );
      const data = await response.json();

      if (data.exists !== false) {
        alert("Você já possui uma solicitação de reembolso em andamento.");
        onClose();
        window.location.reload();
        return;
      }

      // Se não existe, cria o reembolso
      const createResponse = await fetch(
        "http://localhost:3000/api/users/refund",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            reason,
            requestDate: new Date().toISOString(),
          }),
        }
      );

      if (createResponse.ok) {
        alert("Solicitação de reembolso enviada com sucesso!");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      alert("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#1c1c1e] rounded-2xl p-6 w-full max-w-md m-4">
        {confirmStep === 1 ? (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">
              Solicitar Reembolso
            </h3>
            <p className="text-white/70 mb-6">
              Por favor, nos conte o motivo da solicitação:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#2c2c2e] text-white border-none rounded-xl p-4 mb-6 min-h-[120px]"
              placeholder="Descreva o motivo do reembolso..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmStep(2)}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirmar Reembolso
            </h3>
            <p className="text-white/70 mb-6">
              Tem certeza que deseja solicitar o reembolso?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmStep(1)}
                className="px-4 py-2 text-white/70 hover:text-white"
              >
                Voltar
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Processando...</span>
                  </>
                ) : (
                  "Confirmar Reembolso"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RefundModal;
