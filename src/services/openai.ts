import OpenAI from 'openai';
import { AnalysisRequest, AnalysisResponse, ExcelData } from '../types';

export class OpenAIService {
  private openai: OpenAI;
  private onConfirmRequest?: (content: string, title: string) => Promise<{ confirmed: boolean; selectedModel: string }>;

  constructor(apiKey: string, onConfirmRequest?: (content: string, title: string) => Promise<{ confirmed: boolean; selectedModel: string }>) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key não configurada');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true // Necessário para uso no browser
    });
    
    this.onConfirmRequest = onConfirmRequest;
  }

      async analyzeSAPData(request: AnalysisRequest): Promise<AnalysisResponse> {
    console.log('Enviando requisição para OpenAI...');
    console.log('API Key presente:', this.openai.apiKey ? 'Sim' : 'Não');
    
    try {
      // PRIMEIRA CHAMADA: Obter tabelas únicas e principais
      console.log('🔍 Primeira chamada: Obtendo tabelas...');
      const csvData = this.convertToCSV(request.excelData);
      
      // Preparar conteúdo para confirmação
      const firstCallContent = `Modelo: gpt-4.1
Mensagem do Sistema: ${this.buildFirstCallSystemPrompt()}
Mensagem do Usuário: Dados do arquivo CSV:\n\n${csvData}\n\nAnalise e retorne apenas as tabelas principais.`;
      
      // Solicitar confirmação do usuário
      const firstCallResult = await this.requestConfirmation(
        firstCallContent,
        '🔍 Primeira Chamada OpenAI - Identificação de Tabelas'
      );
      
      if (!firstCallResult.confirmed) {
        throw new Error('Operação cancelada pelo usuário');
      }
      
      console.log('🔧 Modelo selecionado para primeira chamada:', firstCallResult.selectedModel);
      const firstCallParams = this.getModelParameters(firstCallResult.selectedModel, 500, 0.1);
      console.log('🔧 Parâmetros da primeira chamada:', firstCallParams);
      
      let allTables: string[] = [];
      
      try {
        const tablesResponse = await this.openai.chat.completions.create({
          model: firstCallResult.selectedModel,
          messages: [
            {
              role: "system",
              content: this.buildFirstCallSystemPrompt()
            },
            {
              role: "user",
              content: `Dados do arquivo CSV:\n\n${csvData}\n\nAnalise e retorne apenas as tabelas principais.`
            }
          ],
          ...firstCallParams
        });
        
        console.log('✅ Primeira resposta recebida da OpenAI:', tablesResponse);
        
        const tablesContent = tablesResponse.choices[0]?.message?.content;
        if (!tablesContent) {
          console.error('❌ Primeira resposta vazia da OpenAI:', tablesResponse);
          throw new Error('Nenhuma resposta recebida na primeira chamada');
        }
        
        // Extrair tabelas da resposta
        const tablesMatch = tablesContent.match(/\{[\s\S]*\}/);
        if (!tablesMatch) {
          throw new Error('Resposta da primeira chamada não contém JSON válido');
        }

        const tablesData = JSON.parse(tablesMatch[0]);
        allTables = tablesData.tabelas_principais || [];
        
        console.log('📋 Tabelas identificadas:', allTables);
        
      } catch (firstCallError: any) {
        console.error('❌ Erro específico na primeira chamada da API OpenAI:', firstCallError);
        console.error('❌ Status:', firstCallError.status);
        console.error('❌ Mensagem:', firstCallError.message);
        console.error('❌ Resposta completa:', firstCallError);
        throw firstCallError;
      }
      
      // SEGUNDA ETAPA: Fazer scraping dos campos das tabelas identificadas
      console.log('🌐 Fazendo scraping dos campos das tabelas...');
      const camposReais = await this.scrapeTableFields(allTables, request.excelData);
      
      console.log('📊 Campos reais obtidos:', camposReais);

      // TERCEIRA ETAPA: Aguardar para evitar limite de rate
      console.log('📊 Validando resultados...');
      await new Promise(resolve => setTimeout(resolve, 20000));

      console.log('⏳ Pré processamento dos dados...');
      await new Promise(resolve => setTimeout(resolve, 20000));

      console.log('🤖 Inicialização agente...');
      await new Promise(resolve => setTimeout(resolve, 20000));

       // QUARTA ETAPA: Enviar análise inicial
       console.log('🚀 Enviando análise inicial para OpenAI...');
       
       // Preparar conteúdo para confirmação da segunda chamada
       const secondCallContent = `Modelo: gpt-4o
Mensagem do Sistema: ${this.buildSystemPrompt(request, camposReais)}
Mensagem do Usuário: Dados do arquivo CSV:\n\n${csvData}\n\n${this.buildUserPrompt(request)}`;
       
       // Solicitar confirmação do usuário
       const secondCallResult = await this.requestConfirmation(
         secondCallContent,
         '🚀 Segunda Chamada OpenAI - Análise Principal'
       );
       
       if (!secondCallResult.confirmed) {
         throw new Error('Operação cancelada pelo usuário');
       }
       
       console.log('🔧 Modelo selecionado para segunda chamada:', secondCallResult.selectedModel);
       const modelParams = this.getModelParameters(secondCallResult.selectedModel, 4000, 0.3);
       console.log('🔧 Parâmetros do modelo:', modelParams);
       
       try {
         const initialResponse = await this.openai.chat.completions.create({
           model: secondCallResult.selectedModel,
           messages: [
             {
               role: "system",
               content: this.buildSystemPrompt(request, camposReais)
             },
             {
               role: "user",
               content: `Dados do arquivo CSV:\n\n${csvData}\n\n${this.buildUserPrompt(request)}`
             }
           ],
           ...modelParams
         });
         
         console.log('✅ Resposta recebida da OpenAI:', initialResponse);
         
         const initialContent = initialResponse.choices[0]?.message?.content;
         if (!initialContent) {
           console.error('❌ Resposta vazia da OpenAI:', initialResponse);
           throw new Error('Nenhuma resposta recebida na análise inicial');
         }

         // Extrair queries da resposta inicial
         console.log('RESPOSTA INICIAL: ', initialContent);
         const initialJsonMatch = initialContent.match(/\{[\s\S]*\}/);
         if (!initialJsonMatch) {
           throw new Error('Resposta inicial não contém JSON válido');
         }
         
         const parsedResponse = this.parseOpenAIResponse(initialContent, request.excelData);
         return parsedResponse;
         
       } catch (apiError: any) {
         console.error('❌ Erro específico na chamada da API OpenAI:', apiError);
         console.error('❌ Status:', apiError.status);
         console.error('❌ Mensagem:', apiError.message);
         console.error('❌ Resposta completa:', apiError);
         throw apiError;
       }
      
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

  private async requestConfirmation(content: string, title: string): Promise<{ confirmed: boolean; selectedModel: string }> {
    if (this.onConfirmRequest) {
      return await this.onConfirmRequest(content, title);
    }
    // Se não houver callback de confirmação, retorna true por padrão
    return { confirmed: true, selectedModel: 'gpt-4o' };
  }

  private getTokenParameter(model: string, maxTokens: number) {
    // GPT-5 uses max_completion_tokens, other models use max_tokens
    if (model.startsWith('gpt-5')) {
      return { max_completion_tokens: maxTokens };
    }
    return { max_tokens: maxTokens };
  }

  private getModelParameters(model: string, maxTokens: number, temperature: number) {
    console.log('🔧 getModelParameters chamado com:', { model, maxTokens, temperature });
    
    // GPT-5 has restrictions: only supports default temperature (1) and uses max_completion_tokens
    if (model.startsWith('gpt-5')) {
      const params = { 
        max_completion_tokens: maxTokens,
        // GPT-5 only supports default temperature (1), so we omit it
      };
      console.log('🔧 Parâmetros para GPT-5:', params);
      return params;
    }
    
    const params = { 
      max_tokens: maxTokens,
      temperature: temperature
    };
    console.log('🔧 Parâmetros para outros modelos:', params);
    return params;
  }

  private convertToCSV(excelData: any[]): string {
    if (!excelData || excelData.length === 0) {
      return '';
    }
    
    // Filtrar apenas as colunas "Object Name" e "Statement"
    const filteredData = excelData.map(row => ({
      'Object Name': row['Object Name'] || '',
      'Statement': row['Statement'] || ''
    }));
    
    // Filtrar linhas com Object Name que começam com os prefixos especificados
    const excludedPrefixes = ['DD', 'D0', 'UST12', 'ST05', 'REPOLOAD', 'SDSH', 'REPOTEXT', 'DYNPSOURCE', 'DYNPLOAD', 'SOTR'];
    const filteredByPrefix = filteredData.filter(row => {
      const objectName = row['Object Name'];
      return !excludedPrefixes.some(prefix => objectName.startsWith(prefix));
    });
    
    // Eliminar linhas duplicadas baseadas em "Object Name" e "Statement"
    const uniqueRows = filteredByPrefix.filter((row, index, self) => {
      return index === self.findIndex(r => 
        r['Object Name'] === row['Object Name'] && 
        r['Statement'] === row['Statement']
      );
    });
    
    // Criar CSV apenas com as colunas filtradas
    const headers = ['Object Name', 'Statement'];
    const csvRows = [headers.join(',')];
    
    for (const row of uniqueRows) {
      const values = headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        // Escapar vírgulas e aspas
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private buildFirstCallSystemPrompt(): string {
    return `Você é um especialista em SQL e SAP. Você analisa arquivos CSV contendo trace de queries SQL extraídas via ST05. 
Seu objetivo é identificar as principais tabelas transacionais do trace com base nas queries executadas nessas tabelas.

Analise o arquivo CSV e retorne APENAS as tabelas principais no formato JSON:{
  "tabelas_principais": ["lista", "das", "tabelas", "mais", "importantes"]
}
  REGRAS:
1 - Ignore tabelas de sistema (que trazem dados de reports ou configurações) ou tabelas de metadados como elementos de texto.
2 - Sempre considere importante tabelas iniciadas com "Z", pois são tabelas customizadas do cliente
3 - Use o conhecimento SAP para identificar tabelas standard importantes, além da relevância das queries executadas sobre elas.
**ATENÇÃO: A resposta DEVE ser um JSON PURO, sem blocos de código, sem markdown
SEMPRE responda no formato JSON válido, iniciando a resposta por '{' e finalizado por '}', SEM NENHUM texto adicional fora do JSON.`;
  }

  private buildSystemPrompt(request: AnalysisRequest, camposReais: string): string {
    
    return `
Você é um especialista em SAP e em SQL, com profundo conhecimento da transação ${request.transactionName}, da sua função e das tabelas, views e estruturas de dados que ela utiliza.
Você analisa arquivos CSV contendo trace de queries SQL extraídas via ST05 dessa transação.

O arquivo CSV contém as seguintes colunas:
- Object Name: Nome dos objetos/tabelas acessados
- Statement: Query SQL executada

Sua tarefa é analisar o arquivo anexado e:
1. Extrair todas as tabelas únicas da coluna "Object Name"
2. Identificar as tabelas principais de dados transacionais, com base no seu conhecimento do banco SAP e das tabelas utilizadas na transação ${request.transactionName}
3. Utilizar seus conhecimentos dos labels da transação ${request.transactionName} para converter os campos ${request.fieldsToExtract} para o formato do banco SAP, com o nome técnico de cada campo, caso seja necessário.
4. Gerar queries reais e completas, prontas para execução, que retornem:
- Os campos solicitados pelo usuário
- Os filtros informados pelo usuário
- Considerando as observações informadas pelo usuário 
5. Gerar uma explicação técnica do funcionamento da transação, de cada query gerada e da tabela mais utilizada nas queries e seu funcionamento.

REGRAS:
1. Responda SEMPRE no formato JSON:
{
  "tabelas_unicas": ["lista", "de", "tabelas", "encontradas"],
  "tabelas_principais": ["lista", "das", "tabelas", "mais", "importantes"],
  "queries": ["query1", "query2", "query3"],
  "explicacao": "Breve explicação técnica do funcionamento de cada query",
  "detalhamento_transacao": "Detalhamento técnico do funcionamento da transação",
  "detalhamento_tabelas": "Detalhamento técnico das tabelas utilizadas nas queries"
}
**ATENÇÃO: A resposta DEVE ser um JSON PURO, sem blocos de código, sem markdown.
SEMPRE responda no formato JSON válido, iniciando a resposta por '{' e finalizado por '}', SEM NENHUM texto adicional fora do JSON.
2. Em caso de agrupamentos, GERAR SEMPRE uma query por campo agrupador, pois cada um terá um total diferente.
3. Usar apenas campos reais:
${camposReais}
    `;
  }

  private buildUserPrompt(request: AnalysisRequest): string {
    const filters = request.filters.trim() || '1=1';
    return `Analise o arquivo CSV anexado contendo trace de queries SQL.
    Extraia os campos ${request.fieldsToExtract}, com o filtro ${filters}, 
    de acordo com as observações: ${request.observations}. `;
  }

  private parseOpenAIResponse(content: string, excelData: any[]): AnalysisResponse {
    try {
      console.log('🔍 Processando resposta do OpenAI...');
      console.log('📄 Conteúdo recebido:', content.substring(0, 200) + '...');
      
      // Parse direto do JSON (o prompt garante formato válido)
      const parsed = JSON.parse(content);
      console.log('✅ JSON parseado com sucesso');
      console.log(`  📋 Tabelas únicas: ${parsed.tabelas_unicas?.length || 0}`);
      console.log(`  📋 Tabelas principais: ${parsed.tabelas_principais?.length || 0}`);
      console.log(`  📋 Queries: ${parsed.queries?.length || 0}`);
      console.log(`  📋 Tem explicação: ${!!parsed.explicacao}`);
      
      // Calcular acurácia
      console.log('\n🎯 Iniciando cálculo de acurácia...');
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
        },
        detalhamento_transacao: parsed.detalhamento_transacao || '',
        detalhamento_tabelas: parsed.detalhamento_tabelas || ''
      };
    } catch (error) {
      console.error('Erro ao processar resposta do OpenAI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao processar resposta da API: ${errorMessage}`);
    }
  }

  private calculateAccuracy(queries: string[], excelData: any[]): number {
    if (!queries || queries.length === 0) {
      console.log('❌ Nenhuma query fornecida para cálculo de acurácia');
      return 0;
    }
    
    console.log('🎯 Iniciando cálculo de acurácia...');
    console.log(`📊 Total de queries: ${queries.length}`);
    
    const availableTables = new Set(excelData.map(row => row['Object Name'].toUpperCase()));
    let totalTablesUsed = 0;
    let validTablesUsed = 0;
    
    console.log('📋 Tabelas disponíveis no arquivo:', Array.from(availableTables));
    
    queries.forEach((query, index) => {
      console.log(`\n🔍 Analisando Query ${index + 1}:`);
      console.log('Query:', query.substring(0, 200) + '...');
      
      // Extrair todas as tabelas da query
      const tables = this.extractTablesFromQuery(query);
      
      console.log('📋 Tabelas extraídas da query:', tables);
      
      if (tables.length === 0) {
        console.log('⚠️ Nenhuma tabela encontrada nesta query');
      }
      
      tables.forEach(tableName => {
        totalTablesUsed++;
        const tableUpper = tableName.toUpperCase();
        const isAvailable = availableTables.has(tableUpper);
        
        console.log(`  📊 Tabela: "${tableUpper}" - Disponível: ${isAvailable ? '✅' : '❌'}`);
        
        if (isAvailable) {
          validTablesUsed++;
        }
      });
    });
    
    const accuracy = totalTablesUsed > 0 ? (validTablesUsed / totalTablesUsed) * 100 : 0;
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`  📊 Tabelas válidas: ${validTablesUsed}`);
    console.log(`  📊 Total de tabelas: ${totalTablesUsed}`);
    console.log(`  🎯 Acurácia: ${accuracy.toFixed(1)}%`);
    
    return accuracy;
  }

    private extractTablesFromQuery(query: string): string[] {
    const tables: string[] = [];
    const upperQuery = query.toUpperCase();
    
    console.log('🔍 Extraindo tabelas da query...');
    
    // Padrões para diferentes tipos de cláusulas SQL
    const patterns = [
      // FROM clause
      { name: 'FROM', pattern: /FROM\s+([A-Z_][A-Z0-9_]*)/gi },
      // JOIN clauses (INNER, LEFT, RIGHT, FULL)
      { name: 'JOIN', pattern: /(?:INNER\s+)?(?:LEFT\s+)?(?:RIGHT\s+)?(?:FULL\s+)?JOIN\s+([A-Z_][A-Z0-9_]*)/gi },
      // UPDATE clause
      { name: 'UPDATE', pattern: /UPDATE\s+([A-Z_][A-Z0-9_]*)/gi },
      // DELETE FROM clause
      { name: 'DELETE', pattern: /DELETE\s+FROM\s+([A-Z_][A-Z0-9_]*)/gi },
      // INSERT INTO clause
      { name: 'INSERT', pattern: /INSERT\s+INTO\s+([A-Z_][A-Z0-9_]*)/gi }
    ];
    
    patterns.forEach(({ name, pattern }) => {
      let match;
      const foundTables: string[] = [];
      
      while ((match = pattern.exec(upperQuery)) !== null) {
        const tableName = match[1];
        if (tableName && !tables.includes(tableName)) {
          tables.push(tableName);
          foundTables.push(tableName);
        }
      }
      
      if (foundTables.length > 0) {
        console.log(`  📋 Encontradas via ${name}:`, foundTables);
      }
    });
    
    // Remover duplicatas e converter para minúsculas
    const uniqueTables = [...new Set(tables)].map(t => t.toLowerCase());
    
    console.log(`  📊 Total de tabelas únicas encontradas: ${uniqueTables.length}`);
    if (uniqueTables.length > 0) {
      console.log(`  📋 Tabelas:`, uniqueTables);
    }
    
    return uniqueTables;
  }

  private async scrapeTableFields(tables: string[], excelData: ExcelData[]): Promise<string> {
    const allFields: string[] = [];
    
    for (const table of tables) {
      try {
        console.log(`🔍 Processando tabela: ${table}`);
        
        // Verificar se a tabela começa com 'Z'
        if (table.toUpperCase().startsWith('Z')) {
          console.log(`📋 Tabela ${table} começa com 'Z' - extraindo campos da coluna Statement`);
          
          // Extrair campos da coluna Statement onde Object Name é igual à tabela
          const tableRows = excelData.filter(row => 
            row['Object Name'] && row['Object Name'].toLowerCase() === table.toLowerCase()
          );
          
          if (tableRows.length > 0) {
            const foundFields = new Set<string>();
            
            tableRows.forEach(row => {
              if (row['Statement']) {
                // Extrair campos da Statement - procurar por padrões de campos SAP
                const fieldPatterns = [
                  /([A-Z_][A-Z0-9_]{2,})/g,  // Padrão geral de campos SAP (3+ caracteres)
                  /([A-Z_][A-Z0-9_]*)/g      // Padrão mais amplo de campos SAP
                ];
                
                fieldPatterns.forEach(pattern => {
                  let match;
                  while ((match = pattern.exec(row['Statement'])) !== null) {
                    const fieldName = match[1] || match[0];
                    // Filtrar apenas campos que parecem ser campos SAP válidos
                    if (fieldName && fieldName.length >= 3 && /^[A-Z_][A-Z0-9_]*$/.test(fieldName)) {
                      // Desconsiderar padrões SQL comuns
                      const sqlKeywords = ['SELECT', 'WHERE', 'AND', 'OR', 'ORDER BY'];
                      const isSqlKeyword = sqlKeywords.some(keyword => 
                        fieldName.toUpperCase() === keyword.toUpperCase()
                      );
                      
                      if (!isSqlKeyword) {
                        foundFields.add(fieldName);
                      }
                    }
                  }
                });
              }
            });
            
            if (foundFields.size > 0) {
              const fields = Array.from(foundFields).map(field => `${table}.${field}`);
              allFields.push(...fields);
              console.log(`✅ Campos extraídos da Statement para tabela ${table}:`, fields);
            } else {
              console.warn(`⚠️ Nenhum campo encontrado na Statement para tabela ${table}`);
            }
          } else {
            console.warn(`⚠️ Nenhuma linha encontrada para tabela ${table} no arquivo Excel`);
          }
          
        } else {
          console.log(`🌐 Tabela ${table} não começa com 'Z' - fazendo web scraping`);
          
          // Fazer requisição para o site LeanX
          const response = await fetch(`https://leanx.eu/en/sap/table/${table}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (!response.ok) {
            console.warn(`⚠️ Não foi possível acessar a tabela ${table}: ${response.status}`);
            continue;
          }

          const html = await response.text();
          
          // Extrair campos da tabela HTML - procurar por padrões de campos SAP
          const fieldPatterns = [
            /<td[^>]*>([A-Z_][A-Z0-9_]*)<\/td>/gi,  // Campos em células de tabela
            /<tr[^>]*>\s*<td[^>]*>([A-Z_][A-Z0-9_]*)<\/td>/gi,  // Primeira coluna de cada linha
            /Field[^>]*>([A-Z_][A-Z0-9_]*)</gi,  // Campos marcados como "Field"
            /([A-Z_][A-Z0-9_]{2,})/g  // Padrão geral de campos SAP (3+ caracteres)
          ];
          
          const foundFields = new Set<string>();
          
          fieldPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
              const fieldName = match[1] || match[0];
              // Filtrar apenas campos que parecem ser campos SAP válidos
              if (fieldName && fieldName.length >= 3 && /^[A-Z_][A-Z0-9_]*$/.test(fieldName)) {
                foundFields.add(fieldName);
              }
            }
          });
          
          if (foundFields.size > 0) {
            const fields = Array.from(foundFields).map(field => `${table}.${field}`);
            allFields.push(...fields);
            console.log(`✅ Campos extraídos da tabela ${table}:`, fields);
          } else {
            console.warn(`⚠️ Nenhum campo encontrado na tabela ${table}`);
          }
          
          // Aguardar um pouco entre as requisições para não sobrecarregar o servidor
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar tabela ${table}:`, error);
      }
    }
    
    // Retornar campos únicos como string
    const uniqueFields = [...new Set(allFields)];
    console.log(`📊 Total de campos únicos obtidos: ${uniqueFields.length}`);
    
    // Se não conseguiu extrair campos, usar campos padrão do SAP
    if (uniqueFields.length === 0) {
      console.log('🔄 Usando campos padrão do SAP como fallback...');
      const defaultFields = [
        'MANDT', 'MATNR', 'WERKS', 'LGORT', 'MEINS', 'MTART', 'MBRSH',
        'MAKTX', 'MATKL', 'BISMT', 'BSTME', 'ZEINR', 'ZEIAR', 'ZEIVR',
        'ZEIFO', 'AESZN', 'BLATT', 'BLANZ', 'FERTH', 'FORMG', 'GROES',
        'WRKST', 'NORMT', 'LABOR', 'EKWSL', 'BRGEW', 'NTGEW', 'GEWEI',
        'VOLUM', 'VOLEH', 'BEHVO', 'RAUBE', 'TEMPB'
      ];
      
      return defaultFields.join(', ');
    }
    
    return uniqueFields.join(', ');
  }
}    