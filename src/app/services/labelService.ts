// src/app/services/labelService.ts
import { getConnection } from '../lib/db';
import { RowDataPacket } from 'mysql2';

// A interface LabelEntry AGORA PRECISA TER OS NOMES EXATOS DAS COLUNAS DA SUA TABELA.
// Se você quer que o frontend use 'label_name' e 'zpl_data', você precisará mapeá-los lá.
// Mas para o backend não dar erro, essa interface deve refletir a tabela.
export interface LabelEntry extends RowDataPacket {
  id: number;
  file_name: string;        // Corresponde a 'file_name' na sua tabela
  original_content: string; // Corresponde a 'original_content' na sua tabela
  designacao?: string;
  tensao?: string;
  data_fab?: string;
  pais_origem?: string;
  validade?: string;
  lote?: string;
  registro?: string;
  barcode?: string;
  // REMOVIDO: dpmm, width_inch, height_inch, created_at, updated_at
  // porque não estavam na sua tabela conforme a imagem.
}

/**
 * Obtém todas as etiquetas salvas na tabela do MySQL.
 * As colunas selecionadas correspondem diretamente aos nomes das propriedades da interface LabelEntry.
 *
 * @returns Um Promise que resolve para um array de LabelEntry.
 */
export const getAllLabels = async (): Promise<LabelEntry[]> => {
  let connection;
  try {
    connection = await getConnection();

    // A QUERY SQL PRECISA USAR OS NOMES EXATOS DAS COLUNAS DA SUA TABELA!
    // A query abaixo inclui TODAS as colunas que apareceram na sua imagem do MySQL.
    const [rows] = await connection.execute(
      `SELECT
         id,
         file_name,
         original_content,
         designacao,
         tensao,
         data_fab,
         pais_origem,
         validade,
         lote,
         registro,
         barcode
       FROM label_entries`
    );

    // O cast 'as LabelEntry[]' ainda é necessário para o TypeScript.
    return rows as LabelEntry[];

  } catch (error) {
    console.error('Erro ao executar query no MySQL:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};