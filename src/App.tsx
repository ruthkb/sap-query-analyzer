import { useState, useEffect } from 'react';
import { Settings, AlertCircle, Check } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisResults } from './components/AnalysisResults';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OpenAIService } from './services/openai';
import { WordAnalyzerService } from './services/wordAnalyzer';
import { ExcelData, AnalysisResponse } from './types';

const API_KEY_STORAGE_KEY = 'openai_api_key';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [excelData, setExcelData] = useState<ExcelData[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationContent, setConfirmationContent] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationResolve, setConfirmationResolve] = useState<((value: { confirmed: boolean; selectedModel: string }) => void) | null>(null);

  useEffect(() => {
    // Carregar API key do localStorage ou do arquivo .env
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('Debug - API Key do .env:', envApiKey ? 'Presente' : 'Ausente');
    console.log('Debug - API Key do localStorage:', savedApiKey ? 'Presente' : 'Ausente');
    
    if (savedApiKey) {
      console.log('Usando API Key do localStorage');
      setApiKey(savedApiKey);
    } else if (envApiKey && envApiKey !== 'your_openai_api_key_here' && envApiKey.includes('sk-')) {
      console.log('Usando API Key do .env');
      // Limpar a API key removendo quebras de linha e espaços
      const cleanApiKey = envApiKey.replace(/\s+/g, '');
      setApiKey(cleanApiKey);
    } else {
      console.log('Nenhuma API Key válida encontrada, mostrando modal');
      setShowApiKeyModal(true);
    }
  }, []);

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
  };

  const handleConfirmationRequest = (content: string, title: string): Promise<{ confirmed: boolean; selectedModel: string }> => {
    return new Promise((resolve) => {
      setConfirmationContent(content);
      setConfirmationTitle(title);
      setConfirmationResolve(() => resolve);
      setShowConfirmationModal(true);
    });
  };

  const handleConfirmationConfirm = (selectedModel: string) => {
    if (confirmationResolve) {
      confirmationResolve({ confirmed: true, selectedModel });
      setShowConfirmationModal(false);
      setConfirmationResolve(null);
    }
  };

  const handleConfirmationCancel = () => {
    if (confirmationResolve) {
      confirmationResolve({ confirmed: false, selectedModel: '' });
      setShowConfirmationModal(false);
      setConfirmationResolve(null);
    }
  };

  const handleFileProcessed = (data: ExcelData[]) => {
    setExcelData(data);
    setError(null);
  };

  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setExcelData(null);
  };

  const handleAnalysisSubmit = async (formData: {
    transactionName: string;
    fieldsToExtract: string;
    filters: string;
    observations: string;
  }) => {
    if (!excelData) {
      setError('Por favor, faça upload de um arquivo Excel primeiro');
      return;
    }

    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setStatusMessage('Iniciando análise...');

    try {
      const openaiService = new OpenAIService(apiKey, handleConfirmationRequest);
      
      // Interceptar logs do console para atualizar o status
      const originalLog = console.log;
      const logMessages: string[] = [];
      
      console.log = (...args) => {
        originalLog(...args);
        const message = args.join(' ');
        logMessages.push(message);
        
        // Atualizar status baseado nos logs importantes
        if (message.includes('Primeira chamada: Obtendo tabelas')) {
          setProgress(20);
          setStatusMessage('🔍 Obtendo tabelas principais...');
        } else if (message.includes('Tabelas identificadas:')) {
          setProgress(30);
          setStatusMessage('📋 Tabelas identificadas, preparando scraping...');
        } else if (message.includes('Fazendo scraping dos campos das tabelas')) {
          setProgress(40);
          setStatusMessage('🌐 Fazendo scraping dos campos das tabelas...');
        } else if (message.includes('Campos reais obtidos:')) {
          setProgress(50);
          setStatusMessage('📊 Campos obtidos, iniciando processamento...');
        } else if (message.includes('Validando resultados')) {
          setProgress(60);
          setStatusMessage('📊 Validando resultados...');
        } else if (message.includes('Pré processamento dos dados')) {
          setProgress(70);
          setStatusMessage('⏳ Pré processamento dos dados...');
        } else if (message.includes('Inicialização agente')) {
          setProgress(80);
          setStatusMessage('🤖 Inicialização agente...');
        } else if (message.includes('Enviando análise inicial')) {
          setProgress(85);
          setStatusMessage('🤖 Gerando queries e análises com OpenAI...');
        } else if (message.includes('JSON parseado com sucesso')) {
          setProgress(90);
          setStatusMessage('✅ Processando resultados e calculando acurácia...');
        } else if (message.includes('RESULTADO FINAL')) {
          setProgress(100);
          setStatusMessage('🎯 Análise concluída com sucesso!');
        }
      };

      const results = await openaiService.analyzeSAPData({
        ...formData,
        excelData
      });

      // Restaurar console.log original
      console.log = originalLog;
      
      setAnalysisResults(results);
      setProgress(100);
      setStatusMessage('🎯 Análise concluída com sucesso!');
      
      // Limpar status após 3 segundos
      setTimeout(() => {
        setProgress(0);
        setStatusMessage('');
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      setProgress(0);
      setStatusMessage('❌ Erro na análise');
      
      // Restaurar console.log original em caso de erro
      console.log = console.log;
    } finally {
      setLoading(false);
    }
  };

  const handleWordAnalysis = async (file: File) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return null;
    }

    try {
      const wordAnalyzer = new WordAnalyzerService(apiKey, handleConfirmationRequest);
      const result = await wordAnalyzer.analyzeWordFile(file);
      
      // Retornar os dados extraídos para preencher o formulário
      return {
        transactionName: result.transacao,
        fieldsToExtract: result.campos.join(', '),
        filters: result.filtros.join(', '),
        observations: result.observacao
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    }
  };

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-semibold text-text-primary">
                SAP Query Analyzer
              </h1>
            </div>
            
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configurar API</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="card">
            <FileUpload
              onFileProcessed={handleFileProcessed}
              onError={handleFileError}
            />
          </div>

          {/* Analysis Form */}
          {excelData && (
            <div className="card">
              <AnalysisForm
                onSubmit={handleAnalysisSubmit}
                onWordAnalysis={handleWordAnalysis}
                loading={loading}
                progress={progress}
                statusMessage={statusMessage}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="card border-accent-error">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-accent-error flex-shrink-0" />
                <p className="text-accent-error">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {analysisResults && (
            <div className="card">
              <AnalysisResults
                results={analysisResults}
                onCopyQuery={handleCopyQuery}
              />
            </div>
          )}
        </div>
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={handleConfirmationConfirm}
        onCancel={handleConfirmationCancel}
        title={confirmationTitle}
        content={confirmationContent}
        isLoading={false}
      />

      {/* Copy Success Message */}
      {showCopiedMessage && (
        <div className="fixed bottom-4 right-4 bg-surface-primary border border-accent-success rounded-lg p-3 flex items-center space-x-2 animate-slide-up z-50">
          <Check className="h-4 w-4 text-accent-success" />
          <span className="text-sm text-text-primary">Query copiada!</span>
        </div>
      )}
    </div>
  );
}

export default App; 