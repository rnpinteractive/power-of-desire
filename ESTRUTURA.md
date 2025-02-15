projeto-desire/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── common/
│ │ │ │ ├── Modal.jsx # Base modal component
│ │ │ │ └── Header.jsx # Reusable header component
│ │ │ ├── auth/
│ │ │ │ └── Login.jsx # Authentication screen (premium UI)
│ │ │ ├── navigation/
│ │ │ │ └── SideMenu.jsx # User navigation menu
│ │ │ ├── dashboard/
│ │ │ │ ├── ContentSlider.jsx # Content carousel
│ │ │ │ └── WelcomeSection.jsx # Welcome area
│ │ │ ├── features/
│ │ │ │ ├── ArticleSearch.jsx # Content search
│ │ │ │ ├── WeekPlan.jsx # Daily plan management
│ │ │ │ └── DayPlan.jsx # Daily plan view
│ │ │ ├── modals/
│ │ │ │ ├── RefundModal.jsx # Manual refund request
│ │ │ │ └── DayPlanModal.jsx # Daily plan details
│ │ │ └── admin/
│ │ │ └── AdminPanel.jsx # Administration panel
│ │ ├── pages/
│ │ │ ├── ArticlePage.jsx # Individual article view
│ │ │ ├── Dashboard.jsx # Main application screen
│ │ │ └── OnboardingPage.jsx # Initial questionnaire
│ │ ├── contexts/
│ │ │ └── AuthContext.jsx # Authentication context
│ │ ├── hooks/
│ │ │ └── useAuth.js # Authentication hook
│ │ ├── styles/
│ │ │ └── index.css # Global styles
│ │ ├── App.jsx # Routes and providers
│ │ └── main.jsx # Application entry
│ ├── public/
│ │ ├── manifest.json # PWA manifest
│ │ ├── sw.js # Service Worker
│ │ └── images/
│ │ └── content/ # Content images
│ └── vite.config.js # Vite configuration with PWA
├── backend/
│ ├── config/
│ │ ├── openai.js # OpenAI configuration
│ │ └── hotmart.js # Hotmart token and configs
│ ├── controllers/
│ │ ├── planController.js # AI plan generation
│ │ ├── refundController.js # Manual refund management
│ │ └── webhookController.js # Hotmart webhook processing
│ ├── routes/
│ │ ├── admin.js # Admin routes
│ │ ├── articles.js # Content routes
│ │ ├── users.js # User/refund routes
│ │ └── webhook.js # Hotmart webhook route
│ ├── data/
│ │ ├── users/ # User JSON files
│ │ ├── articles/ # Content JSON files
│ │ └── plans/ # Plan JSON files
│ └── server.js # Express server

Principais Fluxos:

1. Compra e Acesso:

- Hotmart webhook > Criação automática de usuário
- Login > Onboarding > Dashboard

2. Conteúdo e Planos:

- Artigos: Busca e visualização de conteúdo
- Planos: Geração e visualização de planos diários

3. Reembolso/Chargeback:

- Automático: webhook Hotmart (prefixo email)
- Manual: via painel admin

4. Área Admin:

- Gestão de usuários
- Visualização de dados
- Controle de reembolsos

5. PWA:

- Instalação como app
- Cache offline
- Push notifications
