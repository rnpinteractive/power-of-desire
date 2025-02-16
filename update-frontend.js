const fs = require("fs").promises;
const path = require("path");

const frontendUpdates = {
  "frontend/src/components/AdminPanel.jsx": {
    replacements: [
      {
        // Atualizar lógica de fetchUsers para a nova estrutura
        from: /const fetchUsers = async \(\) => {[\s\S]*?};/,
        to: `const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetch("/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      const validUsers = Array.isArray(data) ? data.filter(user => user.email) : [];
      setUsers(validUsers);
      setTotalUsers(validUsers.length);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };`,
      },
      {
        // Atualizar lógica de deleteUser
        from: /const handleDeleteUser = async \(user\) => {[\s\S]*?};/,
        to: `const handleDeleteUser = async (user) => {
    if (!user?.email) {
      console.error("No email provided for deletion");
      return;
    }

    try {
      const response = await api.fetch(\`/admin/users/\${user.email}\`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao deletar usuário");
      }

      fetchUsers();
      setConfirmAction({ type: "", user: null });
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert(error.message || "Erro ao deletar usuário");
    }
  };`,
      },
    ],
  },

  "frontend/src/components/Dashboard.jsx": {
    replacements: [
      {
        // Atualizar lógica de fetchArticles
        from: /const fetchArticles = async \(\) => {[\s\S]*?};/,
        to: `const fetchArticles = async () => {
    try {
      const response = await api.fetch("/articles/search");
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };`,
      },
    ],
  },

  "frontend/src/components/Login.jsx": {
    replacements: [
      {
        // Atualizar handleSubmit com melhor tratamento de erro
        from: /const handleSubmit = async \(e\) => {[\s\S]*?};/,
        to: `const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);

        if (!data.user.onboardingCompleted) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Email not registered. Please contact support.");
    } finally {
      setLoading(false);
    }
  };`,
      },
    ],
  },

  "frontend/src/components/Onboarding.jsx": {
    replacements: [
      {
        // Atualizar handleNext com nova estrutura
        from: /const handleNext = async \(\) => {[\s\S]*?};/,
        to: `const handleNext = async () => {
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
        navigate("/dashboard", {
          state: {
            user: { ...data, onboardingCompleted: true },
          },
        });
      } catch (error) {
        console.error("Erro ao salvar onboarding:", error);
        alert("Erro ao salvar suas respostas. Por favor, tente novamente.");
      }
    }
  };`,
      },
    ],
  },

  "frontend/src/components/WeekPlan.jsx": {
    replacements: [
      {
        // Atualizar buscarPlanoDoDia
        from: /const buscarPlanoDoDia = async \(dia, forceRegenerate = false\) => {[\s\S]*?};/,
        to: `const buscarPlanoDoDia = async (dia, forceRegenerate = false) => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);

    try {
      const url = \`/users/\${user.email}/plan/\${dia}\${forceRegenerate ? '?regenerate=true' : ''}\`;
      const response = await api.fetch(url);

      if (!response.ok) {
        throw new Error("Error loading plan");
      }

      const data = await response.json();
      const normalizedPlan = normalizePlan(data);
      setPlanDoDia(normalizedPlan);
    } catch (error) {
      console.error("Error:", error);
      setError("Unable to load your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };`,
      },
    ],
  },

  "frontend/src/components/RefundModal.jsx": {
    replacements: [
      {
        // Atualizar handleRefundRequest
        from: /const handleRefundRequest = async \(\) => {[\s\S]*?};/,
        to: `const handleRefundRequest = async () => {
    try {
      setLoading(true);

      const checkResponse = await api.fetch(\`/users/refund/\${userEmail}\`);
      const checkData = await checkResponse.json();

      if (checkData.exists !== false) {
        alert("Você já possui uma solicitação de reembolso em andamento.");
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

      alert("Solicitação de reembolso enviada com sucesso!");
      onClose();
      window.location.reload();
    } catch (error) {
      alert("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };`,
      },
    ],
  },
};

const updateFile = async (filePath, updates) => {
  try {
    console.log(`📝 Atualizando ${filePath}...`);

    // Fazer backup do arquivo original
    const backupPath = filePath + ".backup";
    await fs.copyFile(filePath, backupPath);

    let content = await fs.readFile(filePath, "utf-8");

    // Aplicar substituições
    updates.replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });

    await fs.writeFile(filePath, content);
    console.log(`✅ Atualizado com sucesso: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error);
    // Tentar restaurar backup em caso de erro
    try {
      const backupPath = filePath + ".backup";
      await fs.copyFile(backupPath, filePath);
      console.log(`↩️  Restaurado backup para: ${filePath}`);
    } catch (restoreError) {
      console.error(`❌ Erro ao restaurar backup: ${filePath}`, restoreError);
    }
  }
};

const main = async () => {
  console.log("🚀 Iniciando atualização do frontend...\n");

  for (const [file, updates] of Object.entries(frontendUpdates)) {
    await updateFile(file, updates);
  }

  console.log("\n✨ Atualizações concluídas!");
  console.log("\nPróximos passos:");
  console.log(
    "1. Verifique as alterações (os arquivos originais foram backupeados com extensão .backup)"
  );
  console.log("2. Teste o sistema localmente");
  console.log("3. Se tudo estiver OK, faça commit e push:");
  console.log("   git add .");
  console.log(
    '   git commit -m "Update frontend components for new user structure"'
  );
  console.log("   git push");
  console.log("4. Execute deploy.sh no servidor");
};

main().catch(console.error);
