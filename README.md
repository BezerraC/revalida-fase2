# 🩺 MedMaster - Plataforma de Elite para o Revalida

O **MedMaster** é uma plataforma SaaS de alta performance projetada para revolucionar a preparação de médicos para o exame Revalida. Combinando inteligência artificial de última geração (Google Gemini) com uma experiência de usuário (UX) premium, a plataforma oferece ferramentas completas para as duas fases do exame.

---

## 🚀 Tecnologias Core

### **Frontend**
- **Framework:** Next.js 15 (App Router)
- **Estilização:** Tailwind CSS (Design System Premium)
- **Icons:** Lucide React
- **Autenticação:** Custom JWT + Google OAuth 2.0
- **Feedback:** React Hot Toast
- **State Management:** React Context API (Auth & Theme)

### **Backend**
- **Runtime:** Python 3.10+
- **Framework:** FastAPI
- **Banco de Dados:** MongoDB (NoSQL)
- **IA:** Google Gemini Pro (NLP e Voz)
- **Pagamentos:** Gateway Asaas (Assinaturas e Cobranças)
- **E-mail:** SMTP (Google Relay)

---

## ✨ Funcionalidades Principais

### 1. **Preparação para Fase 1 (Objetiva)**
- **Banco de Questões:** Milhares de questões de provas anteriores categorizadas por temas.
- **Simulados Personalizados:** Criação de testes baseados em exames específicos ou áreas médicas.
- **Estatísticas de Desempenho:** Gráficos detalhados de evolução e maestria por área.
- **Explicações com IA:** Cada questão possui uma explicação profunda gerada por inteligência artificial.

### 2. **Preparação para Fase 2 (Prática)**
- **Simulador de Casos de Voz:** Prática de anamnese e exame físico conversando naturalmente com um paciente IA.
- **Preceptor Digital:** Feedback imediato após cada caso, avaliando competências clínicas e éticas.
- **Lousa Teórica Dinâmica:** Geração de mapas mentais e resumos técnicos durante as simulações.

### 3. **Ecossistema SaaS**
- **Gestão de Assinaturas:** Planos Mensal e Anual com integração transparente via Asaas.
- **Login Social:** Acesso rápido via Google.
- **Painel Administrativo:** Controle total de usuários, métricas de vendas e gestão de conteúdo.
- **Bloqueio de Acesso:** Sistema de proteção de rotas para usuários sem plano ativo.

---

## 🛠️ Configuração do Ambiente

### **Backend**
1. Navegue até a pasta `/backend`.
2. Crie um arquivo `.env` baseado no `.env.example`:
   ```env
   GOOGLE_API_KEY=sua_chave_gemini
   MONGODB_URI=sua_uri_mongo
   JWT_SECRET_KEY=sua_chave_secreta
   ASAAS_API_KEY=seu_token_asaas
   GOOGLE_CLIENT_ID=seu_google_id
   ```
3. Instale as dependências: `pip install -r requirements.txt`
4. Inicie o servidor: `py -m uvicorn main:app --reload`

### **Frontend**
1. Navegue até a pasta `/frontend`.
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente se necessário.
4. Inicie o ambiente de desenvolvimento: `npm run dev`

---

## 📐 Arquitetura de Design

O projeto utiliza um design **Modern Dark SaaS**, caracterizado por:
- **Glassmorphism:** Uso intenso de backdrops desfocados e bordas sutis.
- **Dynamic Orbs:** Fundos animados com gradientes de profundidade.
- **Bento Grids:** Organização de funcionalidades em grids assimétricos de alta legibilidade.
- **Micro-interações:** Feedback tátil em todos os botões e transições de página suaves.

---

## 🛡️ Segurança e Acesso
- **Middleware:** Controle de acesso centralizado que verifica `auth_token` e `subscription_status`.
- **CORS:** Configurado para aceitar requisições apenas de origens autorizadas.
- **Criptografia:** Senhas locais protegidas via Passlib/Bcrypt.

---

## 📄 Licença
Desenvolvido por **cbezerra.com**. Todos os direitos reservados.
