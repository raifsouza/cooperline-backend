// app/api/upload-prn/route.ts
import { NextRequest ,NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx'; // xlsx não é estritamente necessário aqui, mas mantido se precisar de outras funções
import { Readable } from 'stream'; // Necessário para .prn se for stream

export const config = {
  api: {
    bodyParser: false, // Desabilitar o parser padrão para lidar com o arquivo
  },
};

const DATABASE_URL_FROM_ENV = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_FROM_ENV,
    },
  },
});

export async function POST(req: Request) {
  const allowedOrigin = process.env.FRONTEND_URL;
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const formData = await req.formData();
    const prnFile = formData.get('prnFile') as File | null; // 'prnFile' é o nome do campo no frontend

    if (!prnFile) {
      return NextResponse.json({ message: 'Nenhum arquivo .prn enviado.' }, { status: 400, headers: corsHeaders });
    }

    // 1. Obter o nome do arquivo sem a extensão .prn
    const fileName = prnFile.name;
    const originalContent = await prnFile.text(); // Lê o arquivo como texto
    const normalizedFileName = fileName.replace(/\.prn$/i, '').toLowerCase().trim();

    // 4. Salvar no banco de dados usando Prisma
    const newLabelEntry = await prisma.labelEntry.create({
      data: {
        fileName: normalizedFileName,
        originalContent: originalContent,
      },
    });

    return NextResponse.json(
      { message: 'Arquivo .prn processado e salvo com sucesso!', label: newLabelEntry},
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Erro ao processar upload de .prn:', error);
    if (error instanceof Error && (error as any).code === 'P2002') {
      // Erro de violação de chave única (fileName já existe)
      return NextResponse.json(
        { message: 'Erro: Uma etiqueta com este nome de arquivo já existe.', error: (error as Error).message },
        { status: 409, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      { message: 'Erro interno do servidor ao processar o arquivo .prn.', error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Manipulador para requisições OPTIONS (CORS Preflight)
export async function OPTIONS(request: Request) {
  const allowedOrigin = process.env.FRONTEND_URL;
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}