// src/app/api/upload-lote/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import e from 'cors';

// Dica: Para produção, é melhor ter uma instância única do PrismaClient
// exportada de um arquivo em /lib, em vez de criar uma nova em cada rota.
const prisma = new PrismaClient();

// O handler OPTIONS é necessário para o CORS (Cross-Origin Resource Sharing)
export async function OPTIONS(request: Request) {
  const allowedOrigin = process.env.FRONTEND_URL;
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// Handler principal que processa o upload do arquivo Excel
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('loteFile');

    // Validação inicial do arquivo
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'O valor enviado para o lote não é um arquivo válido.' }, { status: 400 });
    }

    // Leitura e processamento do arquivo Excel
    const data = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json({ message: 'O arquivo de lote Excel está vazio ou não contém dados.' }, { status: 400 });
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);

    const loteEntries = []; // Array para guardar apenas os dados que serão salvos
    let processedRowsCount = 0;
    let skippedRowsCount = 0;

    for (const row of rows) {
      const rowData: { [key: string]: any } = {};
      headers.forEach((header, index) => {
        // Normaliza os cabeçalhos para minúsculas e sem espaços para busca confiável
        const normalizedKey = header.toLowerCase().replace(/\s+/g, '');
        rowData[normalizedKey] = row[index];
      });

      // Extraímos APENAS o dado que nos interessa para esta tabela: 'lote'
      const lote = rowData['lote'];
      
      // Validamos se a coluna 'lote' existe e tem um valor na linha atual
      if (!lote) {
        console.warn('Linha ignorada por não conter a coluna "lote":', rowData);
        skippedRowsCount++;
        continue; // Pula para a próxima linha do Excel
      }

      // Adicionamos ao array um objeto que corresponde EXATAMENTE
      // ao modelo LoteEntry do seu schema.prisma
      loteEntries.push({
        lote: String(lote),
      });
      processedRowsCount++;
    }

    if (loteEntries.length === 0) {
        const message = skippedRowsCount > 0 
            ? `Nenhum dado válido encontrado para salvar. ${skippedRowsCount} linhas foram ignoradas.`
            : 'O arquivo não contém dados válidos.';
        return NextResponse.json({ message }, { status: 400 });
    }

    // O comando createMany agora funciona, pois os dados em 'loteEntries'
    // estão no formato correto que o Prisma espera para o modelo LoteEntry.
    const createManyResult = await prisma.loteEntry.createMany({
      data: loteEntries,
      skipDuplicates: true, // Evita erros se o lote já existir (requer @unique no lote no schema)
    });

    console.log(`Upload de lote concluído. Total de linhas lidas: ${processedRowsCount}, Salvas no DB: ${createManyResult.count}, Ignoradas: ${skippedRowsCount}`);
    
    return NextResponse.json({
      message: `Upload de lote concluído com sucesso. ${createManyResult.count} novas entradas de lote salvas.`,
      savedCount: createManyResult.count,
      skippedCount: skippedRowsCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no upload de lote:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao processar o arquivo de lote.', details: error.message },
      { status: 500 }
    );
  }
}