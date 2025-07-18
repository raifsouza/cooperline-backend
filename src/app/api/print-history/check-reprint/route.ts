// src/app/api/print-history/check-reprint/route.ts

import { NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db'; // <-- Modifique a importação aqui

export async function GET(request: Request) {
  let connection; // Declare a variável de conexão aqui para garantir que ela esteja no escopo do finally
  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get('productCode');
    const productLote = searchParams.get('productLote');

    if (!productCode || !productLote) {
      return NextResponse.json(
        { error: 'productCode e productLote são obrigatórios para a verificação de reimpressão.' },
        { status: 400 }
      );
    }

    // Obtenha uma conexão do pool
    connection = await getConnection(); // <-- Use a função getConnection()
    
    // Consulta ao banco de dados copperline, tabela printhistory
    const [rows]: any = await connection.query( // <-- Use a conexão obtida
      `SELECT COUNT(*) AS count FROM printhistory WHERE productCode = ? AND productLote = ?`,
      [productCode, productLote]
    );

    const isReprint = rows && rows[0] && rows[0].count > 0;

    return NextResponse.json({ isReprint }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao verificar reimpressão no banco de dados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao verificar reimpressão.' },
      { status: 500 }
    );
  } finally {
    // Garanta que a conexão seja liberada de volta para o pool
    if (connection) {
      connection.release();
    }
  }
}