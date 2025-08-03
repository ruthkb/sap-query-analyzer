import OpenAI from 'openai';
import { AnalysisRequest, AnalysisResponse } from '../types';

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key não configurada');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true // Necessário para uso no browser
    });
  }

  async analyzeSAPData(request: AnalysisRequest): Promise<AnalysisResponse> {
    console.log('Enviando requisição para OpenAI...');
    console.log('API Key presente:', this.openai.apiKey ? 'Sim' : 'Não');
    
    try {
      // Converter dados Excel para CSV string
      const csvData = this.convertToCSV(request.excelData);
      
      // Usar chat completion com o arquivo como contexto
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.buildSystemPrompt(request)
          },
          {
            role: "user",
            content: `Dados do arquivo CSV:\n\n${csvData}\n\n${this.buildUserPrompt(request)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Nenhuma resposta recebida');
      }
      
      const parsedResponse = this.parseOpenAIResponse(content, request.excelData);
      return parsedResponse;
      
    } catch (error: any) {
      console.error('Erro na comunicação com OpenAI:', error);
      
      if (error.status === 401) {
        throw new Error('API Key inválida. Verifique sua chave da API do OpenAI.');
      } else if (error.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.status === 400) {
        throw new Error(`Erro na requisição: ${error.message || 'Dados inválidos'}`);
      } else {
        throw new Error(`Erro da API: ${error.message || 'Erro desconhecido'}`);
      }
    }
  }

  private convertToCSV(excelData: any[]): string {
    if (!excelData || excelData.length === 0) {
      return '';
    }
    
    const headers = Object.keys(excelData[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of excelData) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escapar vírgulas e aspas
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private buildSystemPrompt(request: AnalysisRequest): string {
    const filters = request.filters.trim() || '1=1';
    return `Você é um especialista em SAP, com profundo conhecimento da transação ${request.transactionName} e das tabelas, views e estruturas de dados que ela utiliza.
    Você analisa arquivos CSV contendo trace de queries SQL extraídas via ST05 dessa transação.

O arquivo CSV contém as seguintes colunas:
- Object Name: Nome dos objetos/tabelas acessados
- Statement: Query SQL executada

Sua tarefa é analisar o arquivo anexado e:
1. Extrair todas as tabelas únicas da coluna "Object Name"
2. Identificar as tabelas principais, com base no seu conhecimento do banco SAP e das tabelas utilizadas na transação ${request.transactionName}
3. Utilizar seus conhecimentos dos labels da transação ${request.transactionName} para converter os campos ${request.fieldsToExtract} para o formato do banco SAP, com o nome técnico de cada campo, caso seja necessário.
4. Gerar queries reais e completas, prontas para execução, que retornem os campos ${request.fieldsToExtract}, com o filtro ${filters}, de acordo com as observações ${request.observations}. Em caso de agrupamentos, GERAR SEMPRE uma query por campo de agrupamento, ou seja, se são 6 agrupamentos, gerar 6 queries, cada uma com o nome do campo pelo qual está agrupando.
5. Gerar uma breve explicação técnica do funcionamento de cada query.

SEMPRE responda no formato JSON válido.`;
  }

  private buildUserPrompt(request: AnalysisRequest): string {
    const filters = request.filters.trim() || '1=1';
    
    return `Analise o arquivo CSV anexado contendo trace de queries SQL da transação ${request.transactionName}.

Sua tarefa é:
1. Extrair todas as tabelas únicas da coluna "Object Name"
2. Identificar as tabelas principais, com base na relevância das consultas e no seu conhecimento do banco SAP e das tabelas utilizadas na transação ${request.transactionName}

Responda no formato JSON:
{
  "tabelas_unicas": ["lista", "de", "tabelas", "encontradas"],
  "tabelas_principais": ["lista", "das", "tabelas", "mais", "importantes"],
  "queries": ["query1", "query2", "query3"],
  "explicacao": "Breve explicação técnica do funcionamento de cada query"
}
3. Utilizar seus conhecimentos dos labels da transação ${request.transactionName} para converter os campos ${request.fieldsToExtract} para o formato do banco SAP, com o nome técnico de cada campo, caso seja necessário.

4. Gerar queries reais e completas, prontas para execução, que retornem os campos ${request.fieldsToExtract}, com o filtro ${filters}, de acordo com as observações ${request.observations}. Em caso de agrupamentos, GERAR SEMPRE uma query por campo de agrupamento, ou seja, se são 6 agrupamentos, gerar 6 queries, cada uma com o nome do campo pelo qual está agrupando.

5. Gerar uma breve explicação técnica do funcionamento de cada query.`;
  }

  private parseOpenAIResponse(content: string, excelData: any[]): AnalysisResponse {
    try {
      // Extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Calcular acurácia
      const accuracy = this.calculateAccuracy(parsed.queries || [], excelData);
      
      // Estatísticas
      const uniqueTables = new Set(excelData.map(row => row['Object Name'])).size;
      
      return {
        tableAnalysis: {
          tabelas_unicas: parsed.tabelas_unicas || [],
          tabelas_principais: parsed.tabelas_principais || []
        },
        queryAnalysis: {
          queries: parsed.queries || [],
          explanation: parsed.explicacao || ''
        },
        accuracy,
        statistics: {
          totalQueries: excelData.length,
          uniqueTables,
          mainTables: parsed.tabelas_principais?.length || 0
        }
      };
    } catch (error) {
      console.error('Erro ao processar resposta do OpenAI:', error);
      throw new Error('Falha ao processar resposta da API');
    }
  }

  private calculateAccuracy(queries: string[], excelData: any[]): number {
    if (!queries || queries.length === 0) return 0;
    
    const availableTables = new Set(excelData.map(row => row['Object Name']));
    let totalTablesUsed = 0;
    let validTablesUsed = 0;
    
    queries.forEach(query => {
      // Extrair nomes de tabelas da query (simplificado)
      const tableMatches = query.match(/FROM\s+(\w+)|JOIN\s+(\w+)/gi) || [];
      
      tableMatches.forEach(match => {
        const tableName = match.replace(/FROM\s+|JOIN\s+/i, '').trim();
        totalTablesUsed++;
        
        if (availableTables.has(tableName)) {
          validTablesUsed++;
        }
      });
    });
    
    return totalTablesUsed > 0 ? (validTablesUsed / totalTablesUsed) * 100 : 0;
  }
} 