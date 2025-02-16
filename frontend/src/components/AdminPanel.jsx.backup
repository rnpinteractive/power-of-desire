import { api } from '../services/api';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ type: "", user: null });
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    telefone: "",
  });
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching users...");
      const response = await api.fetch("/admin/users");

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      console.log("Users data:", data);

      // Filtra somente os registros válidos que possuem email
      const validUsers = Array.isArray(data)
        ? data.filter((user) => user.email)
        : (data.users || []).filter((user) => user.email);

      setUsers(validUsers);
      setTotalUsers(validUsers.length);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.email) {
      alert("Nome e email são obrigatórios!");
      return;
    }

    try {
      const response = await api.fetch("/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        fetchUsers();
        setIsCreateModalOpen(false);
        setNewUser({ nome: "", email: "", telefone: "" });
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Erro ao criar usuário");
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      alert("Erro ao criar usuário");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser.nome || !selectedUser.email) {
      alert("Nome e email são obrigatórios!");
      return;
    }

    try {
      const response = await api.fetch(`/admin/users/${selectedUser.email}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedUser),
        }
      );

      if (response.ok) {
        fetchUsers();
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Erro ao atualizar usuário");
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      alert("Erro ao atualizar usuário");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?.email) {
      console.error("No email provided for deletion");
      return;
    }

    try {
      const response = await api.fetch(`/admin/users/${user.email}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchUsers();
        setConfirmAction({ type: "", user: null });
        setIsConfirmModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Erro ao deletar usuário");
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
    }
  };

  const handleResetOnboarding = async (user) => {
    try {
      const response = await api.fetch(`/admin/users/${user.email}/reset-onboarding`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchUsers();
        setConfirmAction({ type: "", user: null });
        setIsConfirmModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao resetar onboarding:", error);
      alert("Erro ao resetar onboarding");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const showConfirmModal = (type, user) => {
    setConfirmAction({ type, user });
    setIsConfirmModalOpen(true);
  };

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#1c1c1e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img
                src="/images/conteudos/logopfd-removebg-preview.png"
                alt="Logo"
                className="h-8 mr-4"
              />
              <h1 className="text-xl font-semibold text-white">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/5 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-white/60">
                  <Users size={16} />
                  <span className="text-sm">
                    Total users:{" "}
                    <strong className="text-white">{totalUsers}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>New User</span>
          </button>

          <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-[#1c1c1e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            />
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-[#1c1c1e] rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-4"></div>
              <p className="text-white/60">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-white/60 mb-4">No users found</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first user
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Onboarding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr
                      key={user.email}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-medium">
                          {user.nome}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/80">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/60">
                          {user.telefone || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white/60">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.onboardingCompleted
                              ? "bg-green-400/10 text-green-400"
                              : "bg-yellow-400/10 text-yellow-400"
                          }`}
                        >
                          {user.onboardingCompleted ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Complete</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} />
                              <span>Pending</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => showConfirmModal("delete", user)}
                            className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => showConfirmModal("reset", user)}
                            className="p-2 text-white/60 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Reset onboarding"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="border-t border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                  }}
                  disabled={currentPage === 1}
                  className="p-2 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Create User</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.nome}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={newUser.telefone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, telefone: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Edit User</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-white/60 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={selectedUser.nome}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, nome: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white/60"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={selectedUser.telefone}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      telefone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-[#2c2c2e] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {isConfirmModalOpen && confirmAction.user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1c1c1e] rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">
                {confirmAction.type === "delete"
                  ? "Delete User"
                  : "Reset Onboarding"}
              </h2>
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmAction({ type: "", user: null });
                }}
                className="text-white/60 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-white/80">
                {confirmAction.type === "delete"
                  ? `Are you sure you want to delete user ${confirmAction.user.nome}? This action cannot be undone.`
                  : `Are you sure you want to reset the onboarding for user ${confirmAction.user.nome}? They will need to complete the onboarding process again.`}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmAction({ type: "", user: null });
                }}
                className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === "delete"
                    ? handleDeleteUser(confirmAction.user)
                    : handleResetOnboarding(confirmAction.user)
                }
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmAction.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmAction.type === "delete" ? "Delete" : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
