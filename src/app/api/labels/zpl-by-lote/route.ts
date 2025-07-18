// src/app/api/labels/zpl-by-lote/route.ts
import { NextResponse } from 'next/server';
import { getZPLMasterByLoteNumber } from '../../../services/labelService'; // Verifique este caminho relativo!
// Dependendo da sua estrutura, pode ser ../../services/labelService ou algo similar

export async function GET(request: Request) {
  console.log('GET request received for /api/labels/zpl-by-lote');
  const { searchParams } = new URL(request.url);
  const loteNumber = searchParams.get('lote'); // Pega o parâmetro 'lote' da URL

  if (!loteNumber) {
    // Se o parâmetro 'lote' não for fornecido, retorna erro 400
    return NextResponse.json(
      { message: 'Parâmetro "lote" é obrigatório para buscar o ZPL mestre.' },
      { status: 400 }
    );
  }

  try {
    // Chama a função do seu serviço para buscar o ZPL mestre no banco de dados
    const zplData = await getZPLMasterByLoteNumber(loteNumber);

    if (zplData) {
      // Se o ZPL for encontrado, retorna-o com status 200
      console.log(`ZPL master found for lote: ${loteNumber}`);
      return NextResponse.json(zplData, { status: 200 });
    } else {
      // Se nenhum ZPL for encontrado para o lote, retorna 404
      console.log(`No ZPL master found for lote: ${loteNumber}`);
      return NextResponse.json(
        { message: 'Nenhum template ZPL mestre encontrado para este lote.' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    // Lida com erros internos do servidor (ex: problema de conexão com DB)
    console.error(`Erro ao buscar ZPL mestre para ${loteNumber}:`, error);
    return NextResponse.json(
      { message: 'Falha ao carregar template ZPL mestre do banco de dados.', details: error.message },
      { status: 500 }
    );
  }
}