import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, Copy, Check } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { AnalysisForm } from './components/AnalysisForm';
import { AnalysisResults } from './components/AnalysisResults';
import { ApiKeyModal } from './components/ApiKeyModal';
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

    try {
      const openaiService = new OpenAIService(apiKey);
      const results = await openaiService.analyzeSAPData({
        ...formData,
        excelData
      });

      setAnalysisResults(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWordAnalysis = async (file: File) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    try {
      const wordAnalyzer = new WordAnalyzerService(apiKey);
      const result = await wordAnalyzer.analyzeWordFile(file);
      
      // Atualizar o formulário com os dados extraídos
      const formData = {
        transactionName: result.transacao,
        fieldsToExtract: result.campos.join(', '),
        filters: result.filtros.join(', '),
        observations: result.observacao
      };

      // Se já temos dados do Excel, fazer a análise automaticamente
      if (excelData) {
        await handleAnalysisSubmit(formData);
      } else {
        // Mostrar os dados extraídos para o usuário preencher manualmente
        alert(`Dados extraídos do arquivo Word:\n\nTransação: ${result.transacao}\nCampos: ${result.campos.join(', ')}\nFiltros: ${result.filtros.join(', ')}\nObservações: ${result.observacao}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
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