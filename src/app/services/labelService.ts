// src/app/services/labelService.ts
import { getConnection } from '../lib/db';
import { RowDataPacket } from 'mysql2';

// A interface LabelEntry AGORA PRECISA TER OS NOMES EXATOS DAS COLUNAS DA SUA TABELA.
// Se você quer que o frontend use 'label_name' e 'zpl_data', você precisará mapeá-los lá.
// Mas para o backend não dar erro, essa interface deve refletir a tabela.
export interface LabelEntry extends RowDataPacket {
  id: number;
  file_name: string;          // Corresponde a 'file_name' na sua tabela
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
        FROM label_entries` // Assumindo que sua tabela se chama 'label_entries'
    );

    // O cast 'as LabelEntry[]' ainda é necessário para o TypeScript.
    return rows as LabelEntry[];

  } catch (error) {
    console.error('Erro ao executar query no MySQL em getAllLabels:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// --- NOVA FUNÇÃO ADICIONADA AQUI ---

/**
 * Busca o conteúdo ZPL mestre para um dado número de lote na tabela do MySQL.
 *
 * @param loteNumber O número do lote (ex: "0424-000038") para o qual buscar o ZPL mestre.
 * @returns Um Promise que resolve para um objeto com zplContent ou null se não encontrado.
 */
export const getZPLMasterByLoteNumber = async (loteNumber: string): Promise<{ zplContent: string, nameLabel:string } | null> => {
  let connection;
  try {
    connection = await getConnection();

    // ATENÇÃO: Esta query assume que a tabela que contém o ZPL é 'labels'
    // e que a coluna do ZPL é 'original_content', e que há uma coluna 'lote'.
    // A cláusula 'ORDER BY id DESC LIMIT 1' é uma heurística para pegar um ZPL
    // se houver múltiplos para o mesmo lote. Ajuste conforme sua regra de "ZPL mestre".
    const query = `
      SELECT original_content, file_name
      FROM label_entries
      WHERE lote = ?
      ORDER BY id DESC
      LIMIT 1;
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(query, [loteNumber]);

    if (rows.length > 0) {
      // Retorna o conteúdo ZPL encontrado
      return { zplContent: rows[0].original_content, nameLabel:rows[0].file_name };
    } else {
      // Se nenhuma linha for encontrada, retorna null
      return null;
    }

  } catch (error) {
    console.error(`Erro ao buscar ZPL mestre para lote ${loteNumber} no MySQL:`, error);
    throw error; // Re-lança o erro para ser tratado pelo endpoint da API
  } finally {
    if (connection) {
      connection.release();
    }
  }
};