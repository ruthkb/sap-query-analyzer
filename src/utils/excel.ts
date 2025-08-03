import * as XLSX from 'xlsx';
import { ExcelData } from '../types';

export const processExcelFile = (file: File): Promise<ExcelData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar a primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validar estrutura
        if (!jsonData.length) {
          reject(new Error('Arquivo Excel está vazio'));
          return;
        }
        
        const firstRow = jsonData[0] as any;
        
        // Verificar se as colunas existem (case insensitive e com espaços)
        const hasObjectName = Object.keys(firstRow).some(key => 
          key.toLowerCase().trim() === 'object name' || key.toLowerCase().trim() === 'objectname'
        );
        const hasStatement = Object.keys(firstRow).some(key => 
          key.toLowerCase().trim() === 'statement'
        );
        
        if (!hasObjectName || !hasStatement) {
          reject(new Error('Arquivo deve conter as colunas "Object Name" e "Statement"'));
          return;
        }
        
        // Encontrar as chaves corretas das colunas
        const objectNameKey = Object.keys(firstRow).find(key => 
          key.toLowerCase().trim() === 'object name' || key.toLowerCase().trim() === 'objectname'
        ) || 'Object Name';
        const statementKey = Object.keys(firstRow).find(key => 
          key.toLowerCase().trim() === 'statement'
        ) || 'Statement';
        
        // Filtrar linhas vazias e converter para o tipo correto
        const validData = jsonData
          .filter((row: any) => row[objectNameKey] && row[statementKey])
          .map((row: any) => ({
            'Object Name': String(row[objectNameKey]).trim(),
            'Statement': String(row[statementKey]).trim()
          }));
        
        if (!validData.length) {
          reject(new Error('Nenhum dado válido encontrado no arquivo'));
          return;
        }
        
        resolve(validData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo Excel'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelFile = (file: File): boolean => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];
  
  return allowedTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
}; 