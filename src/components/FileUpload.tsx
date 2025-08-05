import React, { useState, useRef } from 'react';
import { FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';
import { ExcelData, FileUploadState } from '../types';
import { processExcelFile, validateExcelFile } from '../utils/excel';

interface FileUploadProps {
  onFileProcessed: (data: ExcelData[]) => void;
  onError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, onError }) => {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    data: null,
    error: null,
    loading: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setState({
      file: null,
      data: null,
      error: null,
      loading: true
    });

    try {
      // Validar tipo de arquivo
      if (!validateExcelFile(file)) {
        throw new Error('Tipo de arquivo não suportado. Use arquivos .xlsx, .xls ou .csv');
      }

      // Processar arquivo
      const data = await processExcelFile(file);
      
      setState({
        file,
        data,
        error: null,
        loading: false
      });

      onFileProcessed(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';
      setState({
        file: null,
        data: null,
        error: errorMessage,
        loading: false
      });
      onError(errorMessage);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Simular file input change
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      await handleFileSelect({ target: { files: dataTransfer.files } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearFile = () => {
    setState({
      file: null,
      data: null,
      error: null,
      loading: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Upload do Arquivo Excel
        </label>
        <p className="text-sm text-text-secondary">
          O arquivo deve conter as colunas "Object Name" e "Statement"
        </p>
      </div>

      {!state.file ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            state.loading
              ? 'border-accent-primary bg-surface-secondary'
              : 'border-border-primary hover:border-accent-primary hover:bg-surface-secondary'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={state.loading}
          />
          
          <div className="space-y-4">
            {state.loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
            ) : (
              <FileSpreadsheet className="mx-auto h-12 w-12 text-text-tertiary" />
            )}
            
            <div className="space-y-2">
              <p className="text-text-primary font-medium">
                {state.loading ? 'Processando arquivo...' : 'Arraste e solte o arquivo aqui'}
              </p>
              <p className="text-text-secondary text-sm">
                ou clique para selecionar um arquivo
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-accent-success" />
              <div>
                <p className="text-text-primary font-medium">{state.file.name}</p>
                <p className="text-text-secondary text-sm">
                  {state.data?.length || 0} registros processados
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-text-secondary" />
            </button>
          </div>
        </div>
      )}

      {state.error && (
        <div className="flex items-center space-x-2 p-3 bg-surface-secondary border border-accent-error rounded-lg">
          <AlertCircle className="h-5 w-5 text-accent-error flex-shrink-0" />
          <p className="text-accent-error text-sm">{state.error}</p>
        </div>
      )}
    </div>
  );
}; 