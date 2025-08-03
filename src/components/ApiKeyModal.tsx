import React, { useState } from 'react';
import { Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Por favor, insira sua chave da API do OpenAI');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setError('A chave da API deve começar com "sk-"');
      return;
    }

    onSave(apiKey);
    onClose();
  };

  const handleClose = () => {
    setApiKey('');
    setError('');
    setShowKey(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-primary border border-border-primary rounded-lg p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="h-6 w-6 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Configurar API Key
          </h2>
        </div>

        <p className="text-sm text-text-secondary mb-4">
          Para usar esta aplicação, você precisa de uma chave da API do OpenAI. 
          Sua chave será armazenada localmente e não será compartilhada.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Chave da API OpenAI
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="sk-..."
                className="input-field w-full pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-text-tertiary">
              Começa com "sk-" e pode ser encontrada em{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-surface-secondary border border-accent-error rounded-lg">
              <AlertCircle className="h-4 w-4 text-accent-error flex-shrink-0" />
              <p className="text-accent-error text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 