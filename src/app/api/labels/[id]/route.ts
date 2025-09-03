// Em src/app/api/labels/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Lembre-se da nossa recomendação de centralizar isso depois

const allowedOrigin = process.env.FRONTEND_URL;

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Handler para buscar uma única etiqueta pelo seu ID
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const idString = pathSegments[pathSegments.length - 1];
    const id = parseInt(idString, 10); // Converte o ID da URL para um número

    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID inválido.' }, { status: 400, headers: corsHeaders });
    }

    const labelEntry = await prisma.labelEntry.findUnique({
      where: {
        id: id,
      },
    });

    if (!labelEntry) {
      return NextResponse.json({ message: 'Layout de etiqueta com ID ${id} não encontrado.' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(labelEntry, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error(`Erro ao buscar layout de etiqueta`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500, headers: corsHeaders });
  }
}