// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getConnection } from '../../lib/db'; // Reutilize sua função de conexão

// Defina a interface para o tipo de dados que você espera da tabela product_entries
// Deve ser idêntica à interface ProductEntry no seu frontend
interface ProductEntry {
  codigo: string;
  nome_produto: string;
  tamanho_padrao?: string;
  designacao?: string;
  tensao?: string;
  massa_bruta_kg_100m?: number;
  norma_aplicada?: string;
  composicao?: string;
  numero_registro?: string;
  cod_barras?: string;
  pedido_oc?: string;
  retalho?: string;
  massa_liquida_kg_100m?: number;
}

export async function GET() {
  let connection;
  try {
    connection = await getConnection();
    // Certifique-se de que o nome da tabela 'product_entries' está correto
    // e que as colunas selecionadas correspondem exatamente às suas colunas no DB.
    const [rows] = await connection.execute(
      `SELECT
         codigo,
         nome_produto,
         tamanho_padrao,
         designacao,
         tensao,
         massa_bruta_kg_100m,
         norma_aplicada,
         composicao,
         numero_registro,
         cod_barras,
         pedido_oc,
         retalho,
         massa_liquida_kg_100m
       FROM product_entries`
    );

    console.log('Produtos buscados do banco de dados:', rows);
    return NextResponse.json(rows as ProductEntry[]);

  } catch (error) {
    console.error('Erro ao buscar produtos do banco de dados MySQL:', error);
    return NextResponse.json({ message: 'Erro ao buscar produtos do banco de dados', error: (error as Error).message }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}