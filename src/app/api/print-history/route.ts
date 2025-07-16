// src/app/api/print-history/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('API Route print-history/route.ts loaded');

// Função POST (já existente, apenas para referência)
export async function POST(request: Request) {
  console.log('POST request received for /api/print-history');
  try {
    const {
      userId,
      userName,
      userMatricula,
      timestamp,
      printerName,
      copies,
      labelName,
      productName,
      zplContentSent
    } = await request.json();

    if (!userId || !userName || !printerName || typeof copies !== 'number' || !labelName) {
      console.error('Dados de histórico incompletos recebidos:', { userId, userName, userMatricula, printerName, copies, labelName });
      return NextResponse.json({ message: 'Dados de histórico incompletos.' }, { status: 400 });
    }

    const newEntry = await prisma.printHistory.create({
      data: {
        userId,
        userName,
        userMatricula: userMatricula || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        printerName,
        copies,
        labelName,
        productName: productName || null,
        zplContentSent: zplContentSent || null
      },
    });

    console.log('Histórico de impressão salvo com sucesso:', newEntry);
    return NextResponse.json(newEntry, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao salvar histórico de impressão:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao salvar histórico.', details: error.message },
      { status: 500 }
    );
  }
}

// NOVA FUNÇÃO: GET para buscar o histórico de impressões
export async function GET(request: Request) {
  console.log('GET request received for /api/print-history');
  try {
    // Você pode adicionar lógica de paginação, filtros ou ordenação aqui se necessário
    const history = await prisma.printHistory.findMany({
      orderBy: {
        timestamp: 'desc', // Ordena os registros do mais recente para o mais antigo
      },
      // Exemplo de como filtrar por usuário (se você quiser uma rota para o histórico de um usuário específico)
      // const { searchParams } = new URL(request.url);
      // const userId = searchParams.get('userId');
      // where: userId ? { userId: userId } : undefined,
    });

    console.log(`Retornando ${history.length} registros de histórico.`);
    return NextResponse.json(history, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar histórico de impressões:', error);
    return NextResponse.json(
      { message: 'Falha ao carregar histórico de impressões.', details: error.message },
      { status: 500 }
    );
  }
}