import { api } from "../services/api";
import React, { useState } from "react";

const RefundModal = ({ isOpen, onClose, userEmail }) => {
  const [reason, setReason] = useState("");
  const [confirmStep, setConfirmStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRefundRequest = async () => {
    try {
      setLoading(true);

      const checkResponse = await api.fetch(`/users/refund/${userEmail}`);
      const checkData = await checkResponse.json();

      if (checkData.exists !== false) {
        alert("You already have a refund request in progress.");
        onClose();
        window.location.reload();
        return;
      }

      const createResponse = await api.fetch("/users/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          reason,
          requestDate: new Date().toISOString(),
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create refund request");
      }

      alert("Refund request successfully submitted!");
      onClose();
      window.location.reload();
    } catch (error) {
      alert("Error processing refund request");
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
              Request Refund
            </h3>
            <p className="text-white/70 mb-6">
              Please let us know the reason for your request:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#2c2c2e] text-white border-none rounded-xl p-4 mb-6 min-h-[120px]"
              placeholder="Describe the reason for the refund..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmStep(2)}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirm Refund
            </h3>
            <p className="text-white/70 mb-6">
              Are you sure you want to request a refund?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmStep(1)}
                className="px-4 py-2 text-white/70 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  "Confirm Refund"
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
