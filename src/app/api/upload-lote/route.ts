// src/app/api/upload-lote/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import e from 'cors';

// Dica: Para produção, é melhor ter uma instância única do PrismaClient
// exportada de um arquivo em /lib, em vez de criar uma nova em cada rota.
const prisma = new PrismaClient();

function normalizeLoteNumber(lote: any): string | null  {
  if (!lote) return null;

  const loteString = String(lote).trim();

  const match = loteString.match(/^(\d{4}-\d{6})/);

  return match ? match[1] : null;
}

// O handler OPTIONS é necessário para o CORS (Cross-Origin Resource Sharing)
export async function OPTIONS(request: Request) {
  const allowedOrigin = process.env.FRONTEND_URL;
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// Handler principal que processa o upload do arquivo Excel
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get('loteFile');

    // Validação inicial do arquivo
    if (!fileValue || typeof fileValue === 'string') {
      console.error('O valor do campo "loteFile" é uma string ou está ausente, mas um arquivo era esperado.');
      return NextResponse.json({ message: 'O valor enviado para o lote não é um arquivo válido.' }, { status: 400 });
    }

    const file = fileValue as Blob;
    console.log(`Arquivo recebido. Tamanho: ${file.size} bytes`);

    
    // Leitura e processamento do arquivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json({ message: 'O arquivo de lote Excel está vazio ou não contém dados.' }, { status: 400 });
    }

    const headers = jsonData[0] as string[];
    const loteColumnIndex =  headers.findIndex(h => String(h).toLowerCase().replace(/\s+/g, '') === 'lote');

    if (loteColumnIndex === -1) {
        return NextResponse.json({ message: 'A planilha precisa ter uma coluna chamada "Lote".' }, { status: 400 });
    }

    const rows = jsonData.slice(1);

    const lotesDaPlanilha = rows
      .map(row => row[loteColumnIndex])
      .filter(lote => lote !== null && lote !== undefined && String(lote).trim() !== '');

    const lotesNormalizados = lotesDaPlanilha.map(normalizeLoteNumber);

    // 2. Usa um Set para obter apenas os valores únicos da planilha
    const lotesUnicosEValidos = [...new Set(lotesNormalizados.filter(lote => lote))];

    if (lotesUnicosEValidos.length === 0) {
      return NextResponse.json({ message: 'Nenhum lote válido encontrado na planilha.' }, { status: 400 });
    }

    // 3. Prepara os dados para o Prisma no formato correto
    const loteEntries = lotesUnicosEValidos.map(lote => ({
      lote: lote as string
    }));

    // O comando createMany agora funciona, pois os dados em 'loteEntries'
    // estão no formato correto que o Prisma espera para o modelo LoteEntry.
    const createManyResult = await prisma.loteEntry.createMany({
      data: loteEntries,
      skipDuplicates: true, // Evita erros se o lote já existir (requer @unique no lote no schema)
    });
    
    return NextResponse.json({
      message: `Upload de lote concluído com sucesso. ${createManyResult.count} novas entradas de lote salvas.`,
      savedCount: createManyResult.count,
      TotalUniqueinFile: lotesUnicosEValidos.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload de lote:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao processar o arquivo de lote.', details: error.message },
      { status: 500 }
    );
  }
}