# 🎯 Diet & Workout Tracker

Um aplicativo web progressivo (PWA) moderno para rastreamento de dieta e exercícios, desenvolvido com React, TypeScript e Supabase.

## ✨ Funcionalidades

### 📊 **Dashboard Inteligente**
- Resumo diário de calorias e proteínas
- Tracking de peso com histórico
- Visualização de progresso com metas
- Navegação por datas

### 🥗 **Controle Alimentar**
- Registro de refeições com horários
- Cálculo automático de calorias e proteínas
- Progresso visual das metas nutricionais
- Histórico completo de alimentação

### 💪 **Treinos & Exercícios**
- Registro de treinos (musculação/cardio)
- Tracking de duração e calorias queimadas
- Meta semanal de treinos
- Histórico de atividades

### 📈 **Análise & Relatórios**
- Gráficos de progresso de peso
- Análise nutricional detalhada
- Estatísticas semanais/mensais
- Tendências de performance

### 🎯 **Hábitos Saudáveis**
- Sistema de hábitos diários
- Tracking de água, exercícios, sono
- Gamificação com conquistas
- Progresso visual

### 👤 **Perfil & Configurações**
- Perfil personalizado com foto
- Configuração de metas
- Dados antropométricos
- Preferências do usuário

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 18+** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderno
- **Tailwind CSS** - Estilização utility-first
- **Framer Motion** - Animações fluidas
- **Lucide React** - Ícones modernos

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados
- **Row Level Security** - Segurança avançada
- **Real-time subscriptions** - Atualizações em tempo real

### **PWA & Mobile**
- **Progressive Web App** - Funcionalidades nativas
- **Service Workers** - Cache offline
- **Mobile-First Design** - Otimizado para mobile
- **Install Prompt** - Instalação como app

### **Desenvolvimento**
- **ESLint** - Linting de código
- **date-fns** - Manipulação de datas
- **Error Boundaries** - Tratamento de erros
- **Context API** - Gerenciamento de estado

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (opcional - tem modo demo)

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/Akejr/diettracker.git
cd diettracker

# Instale as dependências
npm install

# Configure as variáveis de ambiente (opcional)
cp .env.example .env.local
# Edite o .env.local com suas credenciais do Supabase

# Execute em modo desenvolvimento
npm run dev
```

### **Build para Produção**

```bash
# Gerar build otimizado
npm run build

# Preview do build
npm run preview
```

## ⚙️ Configuração do Supabase

### **Modo Demo (Padrão)**
O aplicativo vem configurado com dados fictícios para demonstração. Para usar:
- Não é necessária configuração
- Dados são armazenados localmente
- Perfeito para testes e apresentações

### **Modo Produção com Supabase**
1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as variáveis de ambiente:
   ```env
   VITE_SUPABASE_URL=sua_supabase_url
   VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
   ```
4. Execute os scripts SQL da pasta `/sql`
5. Altere `USE_MOCK_DATA = false` em `src/lib/supabase.ts`

## 📱 Funcionalidades PWA

- **📲 Instalável** - Pode ser instalado como app nativo
- **🔄 Offline** - Funciona sem conexão (modo demo)
- **📱 Responsivo** - Otimizado para todos os dispositivos
- **🔔 Notificações** - Push notifications (quando configurado)
- **⚡ Rápido** - Carregamento instantâneo com cache

## 🎨 Design & UX

- **🌙 Dark Mode** - Tema escuro como padrão
- **✨ Animações** - Micro-interações fluidas
- **📱 Mobile-First** - Projetado para smartphones
- **🎯 Intuitivo** - Interface limpa e focada
- **🎨 Moderno** - Design system consistente

## 📋 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
```

## 🗂️ Estrutura do Projeto

```
src/
├── components/       # Componentes React
│   ├── Dashboard.tsx # Dashboard principal
│   ├── Profile.tsx   # Perfil do usuário
│   ├── Analise.tsx   # Análises e gráficos
│   └── Habitos.tsx   # Sistema de hábitos
├── lib/             # Configurações e utilitários
│   ├── supabase.ts  # Configuração do Supabase
│   └── userUtils.ts # Utilitários de usuário
├── data/            # Dados fictícios (modo demo)
├── contexts/        # React Context
└── services/        # Serviços externos
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Evandro Casanova** 
- GitHub: [@Akejr](https://github.com/Akejr)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend incrível
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [Framer Motion](https://framer.com/motion) - Animações
- [Lucide](https://lucide.dev) - Ícones modernos

---

⭐ **Se este projeto te ajudou, deixe uma estrela!** ⭐ 