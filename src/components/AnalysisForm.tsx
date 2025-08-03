import React, { useState } from 'react';
import { Database, Filter, FileText, MessageSquare, Zap } from 'lucide-react';

interface AnalysisFormProps {
  onSubmit: (data: {
    transactionName: string;
    fieldsToExtract: string;
    filters: string;
    observations: string;
  }) => void;
  loading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    transactionName: '',
    fieldsToExtract: '',
    filters: '',
    observations: ''
  });

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da Transação SAP */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-text-primary">
          <Database className="h-4 w-4" />
          <span>Nome da Transação SAP</span>
        </label>
        <input
          type="text"
          value={formData.transactionName}
          onChange={(e) => handleChange('transactionName', e.target.value)}
          placeholder="Ex: MM03, VA03, FB03..."
          className="input-field w-full"
          required
        />
        <p className="text-xs text-text-secondary">
          Digite o código da transação SAP que gerou o trace
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