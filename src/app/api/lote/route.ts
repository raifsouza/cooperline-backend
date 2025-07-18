// src/app/api/lote-entries/route.ts (exemplo)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lote = searchParams.get('lote');

  if (!lote) {
    return NextResponse.json({ message: 'Parâmetro "lote" ausente na busca.' }, { status: 400 });
  }

  try {
    const loteEntries = await prisma.loteEntry.findMany({
      where: {
        lote: lote,
      },
      // Você pode adicionar ordenação, paginação, etc., se necessário
      // orderBy: {
      //   fabricadoEm: 'desc',
      // },
    });

    if (loteEntries.length === 0) {
      return NextResponse.json({ message: 'Nenhum registro encontrado para este lote.' }, { status: 404 });
    }

    return NextResponse.json(loteEntries, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar entradas de lote:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao buscar entradas de lote.', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// CORS OPTIONS handler (necessário se o frontend e backend estiverem em portas diferentes)
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:4200', // Sua origem do Angular
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}