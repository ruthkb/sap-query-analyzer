import React from 'react';
import { BarChart3, Database, FileText, Target, TrendingUp, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnalysisResponse } from '../types';

interface AnalysisResultsProps {
  results: AnalysisResponse;
  onCopyQuery: (query: string) => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onCopyQuery }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopyQuery = (query: string, index: number) => {
    onCopyQuery(query);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getQueryType = (query: string) => {
    const upperQuery = query.toUpperCase();
    if (upperQuery.includes('GROUP BY')) return 'Agrupamento';
    if (upperQuery.includes('ORDER BY')) return 'Ordenação';
    if (upperQuery.includes('JOIN')) return 'Join';
    if (upperQuery.includes('UNION')) return 'Union';
    return 'Consulta';
  };

  const getQueryTypeColor = (query: string) => {
    const upperQuery = query.toUpperCase();
    if (upperQuery.includes('GROUP BY')) return 'bg-accent-primary bg-opacity-20 text-accent-primary';
    if (upperQuery.includes('ORDER BY')) return 'bg-accent-warning bg-opacity-20 text-accent-warning';
    if (upperQuery.includes('JOIN')) return 'bg-accent-success bg-opacity-20 text-accent-success';
    if (upperQuery.includes('UNION')) return 'bg-purple-500 bg-opacity-20 text-purple-400';
    return 'bg-surface-tertiary text-text-tertiary';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-accent-success';
    if (accuracy >= 60) return 'text-accent-warning';
    return 'text-accent-error';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 80) return '🎯';
    if (accuracy >= 60) return '⚠️';
    return '❌';
  };

  const formatQuery = (query: string): string => {
    // Remover espaços extras e quebras de linha desnecessárias
    let formatted = query.trim();
    
    // Substituir múltiplos espaços por um único espaço
    formatted = formatted.replace(/\s+/g, ' ');
    
    // Adicionar quebras de linha após palavras-chave SQL principais
    const mainKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING'];
    mainKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // Adicionar quebras de linha para JOINs
    const joinKeywords = ['JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'];
    joinKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // Adicionar quebras de linha para condições AND/OR
    formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');
    
    // Adicionar quebras de linha para vírgulas em SELECT
    formatted = formatted.replace(/,/g, ',\n  ');
    
    // Processar cada linha para indentação
    const lines = formatted.split('\n');
    const indentedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Determinar nível de indentação baseado no contexto
      let indent = '';
      const upperLine = trimmed.toUpperCase();
      
      if (upperLine.startsWith('SELECT')) {
        indent = '';
      } else if (upperLine.startsWith('FROM') || 
                 upperLine.startsWith('WHERE') ||
                 upperLine.startsWith('GROUP BY') ||
                 upperLine.startsWith('ORDER BY') ||
                 upperLine.startsWith('HAVING')) {
        indent = '  ';
      } else if (upperLine.includes('JOIN')) {
        indent = '  ';
      } else if (upperLine.startsWith('AND') || upperLine.startsWith('OR')) {
        indent = '    ';
      } else if (trimmed.startsWith(',')) {
        // Campos do SELECT
        indent = '  ';
      } else {
        indent = '  ';
      }
      
      return indent + trimmed;
    });
    
    // Remover linhas vazias e juntar
    const result = indentedLines.filter(line => line.trim()).join('\n');
    return result;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho dos Resultados */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Resultados da Análise</h2>
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-accent-primary" />
          <span className="text-sm text-text-secondary">Análise Concluída</span>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-accent-primary" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{results.statistics.totalQueries}</p>
              <p className="text-sm text-text-secondary">Total de Queries</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-accent-success" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{results.statistics.uniqueTables}</p>
              <p className="text-sm text-text-secondary">Tabelas Únicas</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-accent-warning" />
            <div>
              <p className="text-2xl font-bold text-text-primary">{results.statistics.mainTables}</p>
              <p className="text-sm text-text-secondary">Tabelas Principais</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-accent-primary" />
            <div>
              <p className={`text-2xl font-bold ${getAccuracyColor(results.accuracy)}`}>
                {results.accuracy.toFixed(1)}%
              </p>
              <p className="text-sm text-text-secondary">Acurácia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabelas Únicas */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Tabelas Únicas Encontradas</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.tableAnalysis.tabelas_unicas.map((table, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
              >
                <span className="text-sm text-text-primary font-mono">{table}</span>
                <span className="text-xs text-text-tertiary bg-surface-tertiary px-2 py-1 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabelas Principais */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Tabelas Principais</span>
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.tableAnalysis.tabelas_principais.map((table, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg border-l-4 border-accent-primary"
              >
                <span className="text-sm text-text-primary font-mono">{table}</span>
                <span className="text-xs text-accent-primary bg-accent-primary bg-opacity-10 px-2 py-1 rounded">
                  Principal
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Queries Geradas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Queries Geradas</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary">Acurácia:</span>
            <span className={`text-sm font-medium ${getAccuracyColor(results.accuracy)}`}>
              {getAccuracyIcon(results.accuracy)} {results.accuracy.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {results.queryAnalysis.queries.map((query, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-text-primary">
                    Query {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getQueryTypeColor(query)}`}>
                    {getQueryType(query)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyQuery(query, index)}
                  className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-all duration-200 ${
                    copiedIndex === index
                      ? 'bg-accent-success text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-accent-primary'
                  }`}
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
                             <div className="relative overflow-x-auto">
                 <SyntaxHighlighter
                   language="sql"
                   style={oneDark}
                   customStyle={{
                     margin: 0,
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem',
                     lineHeight: '1.5',
                     backgroundColor: '#161b22',
                     border: '1px solid #30363d',
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                     whiteSpace: 'pre'
                   }}
                   showLineNumbers={true}
                   wrapLines={false}
                   lineNumberStyle={{
                     color: '#6e7681',
                     fontSize: '0.75rem',
                     minWidth: '2.5rem'
                   }}
                   codeTagProps={{
                     style: {
                       fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                       whiteSpace: 'pre'
                     }
                   }}
                 >
                   {formatQuery(query)}
                 </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </div>

        {/* Explicação Técnica */}
        {results.queryAnalysis.explanation && (
          <div className="mt-6 p-4 bg-surface-secondary rounded-lg border-l-4 border-accent-primary">
            <h4 className="text-sm font-semibold text-text-primary mb-2">Explicação Técnica</h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              {results.queryAnalysis.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Detalhamentos Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhamento da Transação */}
        {results.detalhamento_transacao && (
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-accent-primary" />
              <span>Detalhamento da Transação</span>
            </h3>
            <div className="p-4 bg-surface-secondary rounded-lg border-l-4 border-accent-primary">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {results.detalhamento_transacao}
              </p>
            </div>
          </div>
        )}

        {/* Detalhamento das Tabelas */}
        {results.detalhamento_tabelas && (
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
              <Database className="h-5 w-5 text-accent-success" />
              <span>Detalhamento das Tabelas</span>
            </h3>
            <div className="p-4 bg-surface-secondary rounded-lg border-l-4 border-accent-success">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {results.detalhamento_tabelas}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 