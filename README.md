# SAP Query Analyzer

Uma aplicação web moderna para análise inteligente de queries SQL do SAP usando IA. A aplicação analisa arquivos de trace do SAP (ST05) e gera queries SQL otimizadas baseadas em inteligência artificial.

## 🚀 Funcionalidades

- **Upload de Arquivos**: Suporte para arquivos Excel/CSV com colunas "Object Name" e "Statement"
- **Análise Inteligente**: Processamento via OpenAI GPT-4 para extração de tabelas e geração de queries
- **Interface Moderna**: Design dark theme inspirado no Cursor com Material Design
- **Syntax Highlighting**: Formatação colorida e indentada para queries SQL
- **Validação de Acurácia**: Cálculo automático da precisão das queries geradas
- **Cópia Fácil**: Botão para copiar queries com um clique
- **Responsivo**: Interface adaptável para diferentes tamanhos de tela

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI GPT-4 API
- **Excel Processing**: SheetJS (xlsx)
- **Syntax Highlighting**: react-syntax-highlighter

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/seu-usuario/sap-query-analyzer.git
cd sap-query-analyzer
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure a API Key**:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione sua chave da API do OpenAI:
```env
VITE_OPENAI_API_KEY=sua_chave_api_aqui
VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

4. **Execute o projeto**:
```bash
npm run dev
```

5. **Acesse a aplicação**:
   - Abra `http://localhost:3000` no seu navegador

## 📋 Como Usar

### 1. Upload do Arquivo
- Faça upload de um arquivo Excel/CSV contendo as colunas:
  - **Object Name**: Nome das tabelas/objetos acessados
  - **Statement**: Query SQL executada

### 2. Configuração da Análise
Preencha os campos:
- **Nome da Transação SAP**: Código da transação (ex: MM03, VA03)
- **Campos para Extrair**: Lista de campos desejados (ex: MATNR, MAKTX, WERKS)
- **Filtros**: Condições WHERE (opcional, padrão: 1=1)
- **Observações**: Informações adicionais para a análise

### 3. Análise e Resultados
- Clique em "Analisar" para processar via IA
- Visualize:
  - Estatísticas do arquivo
  - Tabelas únicas e principais
  - Queries geradas com syntax highlighting
  - Explicação técnica
  - Percentual de acurácia

## 🎨 Interface

### Design System
- **Tema**: Dark theme inspirado no Cursor
- **Cores**: Paleta personalizada com tons de azul e cinza
- **Tipografia**: Inter + JetBrains Mono
- **Animações**: Transições suaves e feedback visual

### Componentes
- **FileUpload**: Drag & drop para upload de arquivos
- **AnalysisForm**: Formulário de configuração da análise
- **AnalysisResults**: Exibição dos resultados com syntax highlighting
- **ApiKeyModal**: Modal para configuração da API key

## 🔧 Configuração

### Variáveis de Ambiente
```env
# OpenAI API Configuration
VITE_OPENAI_API_KEY=sua_chave_api_aqui
VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linting do código
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── FileUpload.tsx
│   ├── AnalysisForm.tsx
│   ├── AnalysisResults.tsx
│   └── ApiKeyModal.tsx
├── services/           # Serviços e APIs
│   └── openai.ts
├── types/              # Definições TypeScript
│   └── index.ts
├── utils/              # Utilitários
│   └── excel.ts
├── App.tsx             # Componente principal
├── main.tsx           # Entry point
└── index.css          # Estilos globais
```

## 🔒 Segurança

- API key armazenada localmente no browser (localStorage)
- Validação de entrada para todos os campos
- Sanitização de dados antes do envio para a API
- Tratamento de erros robusto

## 🚀 Deploy

### Vercel
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Netlify
1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente
3. Build command: `npm run build`
4. Publish directory: `dist`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: Use o GitHub Issues para reportar bugs
- **Discussions**: Use o GitHub Discussions para perguntas
- **Email**: Entre em contato para suporte empresarial

## 🔄 Changelog

### v1.0.0
- ✅ Interface moderna com dark theme
- ✅ Upload de arquivos Excel/CSV
- ✅ Análise via OpenAI GPT-4
- ✅ Syntax highlighting para SQL
- ✅ Cálculo de acurácia
- ✅ Formatação automática de queries
- ✅ Interface responsiva
- ✅ Tratamento de erros robusto

---

**Desenvolvido com ❤️ para a comunidade SAP** 