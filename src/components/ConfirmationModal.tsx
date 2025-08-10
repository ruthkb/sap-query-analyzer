import React, { useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (selectedModel: string) => void;
  onCancel: () => void;
  title: string;
  content: string;
  isLoading?: boolean;
}

const OPENAI_MODELS = [
  { value: 'gpt-5', label: 'GPT-5 (Mais recente e poderoso)' },
  { value: 'gpt-4o', label: 'GPT-4o (Mais recente e poderoso)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Mais rápido e econômico)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Balanço entre velocidade e qualidade)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Mais econômico)' }
];

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  content,
  isLoading = false
}) => {
  const [selectedModel, setSelectedModel] = useState(OPENAI_MODELS[0].value);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedModel);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
        
        {/* Model Selection */}
        <div className="mb-4">
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-2">
            Selecione o modelo OpenAI:
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            disabled={isLoading}
          >
            {OPENAI_MODELS.map((model) => (
              <option key={model.value} value={model.value} className="text-black">
                {model.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo que será enviado:
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words">{content}</pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processando...</span>
              </div>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
