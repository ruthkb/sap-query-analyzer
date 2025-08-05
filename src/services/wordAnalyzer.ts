import OpenAI from 'openai';
import mammoth from 'mammoth';

export interface WordAnalysisResult {
  transacao: string;
  campos: string[];
  filtros: string[];
  observacao: string;
}

export class WordAnalyzerService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key não configurada');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true
    });
  }

  async analyzeWordFile(file: File): Promise<WordAnalysisResult> {
    console.log('📄 Analisando arquivo Word:', file.name);
    
    try {
      // Extrair texto do arquivo Word
      const extractedText = await this.extractTextFromWord(file);
      console.log('📝 Texto extraído:', extractedText.substring(0, 200) + '...');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é especialista em SAP e análise de documentos. Analise o texto extraído de um arquivo Word extraindo dele o nome da transação, os campos a serem extraídos e os filtros utilizados. Com base no conteúdo do documento, que pode conter prints dos resultados dessa transação, elabore as observações importantes quanto à regras de negócio, agrupamentos, somatórios e dimensões de visão.

SEMPRE responda no formato JSON válido:
{
  "transacao": "nome da transação",
  "campos": ["lista", "dos", "campos", "a", "serem", "extraidos"],
  "filtros": ["filtros"],
  "observacao": "Breve observação importante qnto à somatórios, agrupamentos ou regras funcionais específicas da transação"
}`
          },
          {
            role: "user",
            content: `Analise o seguinte texto extraído de um arquivo Word e extraia as informações solicitadas:

${extractedText}

Extraia o nome da transação SAP, os campos que devem ser extraídos, os filtros utilizados e as observações importantes sobre regras de negócio.`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Nenhuma resposta recebida da análise do arquivo Word');
      }

      // Extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        transacao: parsed.transacao || '',
        campos: Array.isArray(parsed.campos) ? parsed.campos : [],
        filtros: Array.isArray(parsed.filtros) ? parsed.filtros : [],
        observacao: parsed.observacao || ''
      };

    } catch (error: any) {
      console.error('Erro na análise do arquivo Word:', error);
      
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



  private async extractTextFromWord(file: File): Promise<string> {
    try {
      if (file.name.toLowerCase().endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else if (file.name.toLowerCase().endsWith('.doc')) {
        // Para arquivos .doc, vamos tentar extrair usando mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else {
        throw new Error('Formato de arquivo não suportado. Use arquivos .doc ou .docx');
      }
    } catch (error) {
      console.error('Erro ao extrair texto do arquivo Word:', error);
      throw new Error('Não foi possível extrair o texto do arquivo Word. Verifique se o arquivo não está corrompido.');
    }
  }
} 