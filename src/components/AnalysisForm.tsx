import React, { useState, useRef } from 'react';
import { Database, Filter, FileText, MessageSquare, Zap, FileText as FileWord } from 'lucide-react';

interface AnalysisFormProps {
  onSubmit: (data: {
    transactionName: string;
    fieldsToExtract: string;
    filters: string;
    observations: string;
  }) => void;
  onWordAnalysis?: (file: File) => Promise<void>;
  loading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, onWordAnalysis, loading }) => {
  const [formData, setFormData] = useState({
    transactionName: '',
    fieldsToExtract: '',
    filters: '',
    observations: ''
  });
  const [wordLoading, setWordLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWordFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar se é um arquivo Word válido
    const validExtensions = ['.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor, selecione um arquivo Word válido (.doc ou .docx)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('O arquivo é muito grande. Tamanho máximo: 10MB');
      return;
    }

    if (onWordAnalysis) {
      setWordLoading(true);
      try {
        await onWordAnalysis(file);
      } catch (error) {
        console.error('Erro ao analisar arquivo Word:', error);
        alert('Erro ao analisar o arquivo Word. Tente novamente.');
      } finally {
        setWordLoading(false);
      }
    }

    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da Transação SAP */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-text-primary">
          <Database className="h-4 w-4" />
          <span>Nome da Transação SAP</span>
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={formData.transactionName}
            onChange={(e) => handleChange('transactionName', e.target.value)}
            placeholder="Ex: MM03, VA03, FB03..."
            className="input-field flex-1"
            required
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={wordLoading || loading}
            className="btn-secondary px-3 py-2 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Analisar arquivo Word para extrair informações"
          >
            {wordLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                <span className="text-xs">Analisando...</span>
              </>
            ) : (
              <>
                <FileWord className="h-4 w-4" />
                <span className="text-xs">Word</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx"
            onChange={handleWordFileSelect}
            className="hidden"
          />
        </div>
        <p className="text-xs text-text-secondary">
          Digite o código da transação SAP que gerou o trace ou use o botão Word para extrair automaticamente
        </p>
      </div>

      {/* Campos para Extrair */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-text-primary">
          <FileText className="h-4 w-4" />
          <span>Campos para Extrair</span>
        </label>
        <textarea
          value={formData.fieldsToExtract}
          onChange={(e) => handleChange('fieldsToExtract', e.target.value)}
          placeholder="Ex: MATNR, MAKTX, WERKS, LGORT, MENGE, MEINS"
          className="textarea-field w-full h-24"
          required
        />
        <p className="text-xs text-text-secondary">
          Liste os campos que deseja extrair das tabelas, separados por vírgula
        </p>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-text-primary">
          <Filter className="h-4 w-4" />
          <span>Filtros (Opcional)</span>
        </label>
        <textarea
          value={formData.filters}
          onChange={(e) => handleChange('filters', e.target.value)}
          placeholder="Ex: WERKS = '1000' AND LGORT = '0001'"
          className="textarea-field w-full h-20"
        />
        <p className="text-xs text-text-secondary">
          Condições WHERE para filtrar os dados. Se não informado, será usado "1=1"
        </p>
      </div>

      {/* Observações Adicionais */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-text-primary">
          <MessageSquare className="h-4 w-4" />
          <span>Observações Adicionais (Opcional)</span>
        </label>
        <textarea
          value={formData.observations}
          onChange={(e) => handleChange('observations', e.target.value)}
          placeholder="Ex: Incluir apenas materiais ativos, agrupar por centro de custo..."
          className="textarea-field w-full h-20"
        />
        <p className="text-xs text-text-secondary">
          Informações adicionais que podem ajudar na geração das queries
        </p>
      </div>

      {/* Botão Analisar */}
      <button
        type="submit"
        disabled={loading || !formData.transactionName || !formData.fieldsToExtract}
        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Analisando...</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            <span>Analisar</span>
          </>
        )}
      </button>
    </form>
  );
}; 