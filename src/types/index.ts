export interface ExcelData {
  'Object Name': string;
  'Statement': string;
}

export interface AnalysisRequest {
  transactionName: string;
  fieldsToExtract: string;
  filters: string;
  observations: string;
  excelData: ExcelData[];
}

export interface TableAnalysis {
  tabelas_unicas: string[];
  tabelas_principais: string[];
}

export interface QueryAnalysis {
  queries: string[];
  explanation: string;
}

export interface AnalysisResponse {
  tableAnalysis: TableAnalysis;
  queryAnalysis: QueryAnalysis;
  accuracy: number;
  statistics: {
    totalQueries: number;
    uniqueTables: number;
    mainTables: number;
  };
  detalhamento_transacao?: string;
  detalhamento_tabelas?: string;
}

export interface FileUploadState {
  file: File | null;
  data: ExcelData[] | null;
  error: string | null;
  loading: boolean;
} 