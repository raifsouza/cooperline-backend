// src/app/api/upload-lote/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  console.log('POST request received for /api/upload-lote');

  try {
    const formData = await request.formData();
    // Altere esta linha para obter o valor, sem um cast inicial para Blob | null
    const file = formData.get('loteFile');

    if (!file) {
      console.error('Nenhum arquivo encontrado na requisição para lote (campo "loteFile" ausente).');
      return NextResponse.json({ message: 'Nenhum arquivo de lote enviado (campo "loteFile" ausente).' }, { status: 400 });
    }

    // Verifique se 'file' é uma instância de File antes de acessar 'name'
    // Isso é crucial porque formData.get() pode retornar um FormDataEntryValue (string ou Blob)
    if (!(file instanceof File)) {
        console.error('O valor do campo "loteFile" não é um arquivo.');
        return NextResponse.json({ message: 'O valor enviado para o lote não é um arquivo válido.' }, { status: 400 });
    }

    // Agora 'file' é garantido ser um File, então 'file.name' é seguro
    console.log(`Arquivo recebido: ${file.name} (tipo: ${file.type}, tamanho: ${file.size} bytes)`);

    // ... (restante do seu código) ...

    const arrayBuffer = await file.arrayBuffer(); // Isso está correto, Blob tem arrayBuffer()
    const data = new Uint8Array(arrayBuffer);
    console.log('ArrayBuffer do arquivo lido.');

    const workbook = XLSX.read(data, { type: 'array' });
    console.log('Workbook XLSX lido.');

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log(`Processando planilha: ${sheetName}`);

    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Dados da planilha convertidos para JSON. Primeiras linhas:', jsonData.slice(0, 3));

    if (!jsonData || jsonData.length < 2) {
      console.warn('O arquivo de lote Excel está vazio ou contém apenas o cabeçalho.');
      return NextResponse.json({ message: 'O arquivo de lote Excel está vazio ou não contém dados.' }, { status: 400 });
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);

     const headerMap: { [key: string]: string } = {
      'Lote': 'lote', // Estes são os nomes das propriedades no modelo Prisma
      'Produto': 'produto',
      'FabricadoEm': 'fabricadoEm',
      'Fabricado Em': 'fabricadoEm',
    };

    const loteEntries = [];
    let processedRowsCount = 0;
    let skippedRowsCount = 0;

    for (const row of rows) {
      const rowData: { [key: string]: any } = {};
      for (let i = 0; i < headers.length; i++) {
        // AQUI: use o nome do cabeçalho original ou normalizado como chave para o rowData
        const originalHeader = headers[i]; // Mantenha o cabeçalho original
        const normalizedHeader = originalHeader.replace(/\s+/g, '').trim(); // Ou use o normalizado para robustez
        rowData[normalizedHeader] = row[i]; // rowData terá chaves como 'Lote', 'Produto', 'FabricadoEm'
      }

      // **MUDE AQUI:** Acesse rowData com as chaves que você realmente criou ('Lote', 'Produto', 'FabricadoEm')
      // Note que 'Fabricado Em' no Excel se torna 'FabricadoEm' após a normalização.
      const lote = rowData['Lote'];
      const produto = String(rowData['Produto']);
      const fabricadoEmExcel = rowData['FabricadoEm']; // A chave já é 'FabricadoEm' após normalização

      if (!lote || !produto || fabricadoEmExcel === undefined || fabricadoEmExcel === null) {
        console.warn('Linha de lote com dados incompletos e ignorada:', rowData);
        skippedRowsCount++;
        continue;
      }

      let fabricadoEmDate: Date;
      if (typeof fabricadoEmExcel === 'number' && !isNaN(fabricadoEmExcel)) {
        fabricadoEmDate = new Date((fabricadoEmExcel - 25569) * 86400 * 1000);
      } else {
        fabricadoEmDate = new Date(fabricadoEmExcel);
        if (isNaN(fabricadoEmDate.getTime())) {
            console.warn('Data de fabricação inválida e linha ignorada:', rowData);
            skippedRowsCount++;
            continue;
        }
      }

      loteEntries.push({
        lote: String(lote),
        produto: produto,
        fabricadoEm: fabricadoEmDate,
      });
      processedRowsCount++;
    }

    if (loteEntries.length === 0 && skippedRowsCount > 0) {
        return NextResponse.json({ message: `Nenhum dado válido encontrado para salvar. ${skippedRowsCount} linhas foram ignoradas por dados incompletos ou inválidos.` }, { status: 400 });
    } else if (loteEntries.length === 0) {
        return NextResponse.json({ message: 'O arquivo de lote Excel não contém dados válidos para processar.' }, { status: 400 });
    }

    const createManyResult = await prisma.loteEntry.createMany({
      data: loteEntries,
      skipDuplicates: true,
    });

    console.log(`Upload de lote concluído. Total de linhas processadas: ${processedRowsCount}, Salvas no DB: ${createManyResult.count}, Ignoradas: ${skippedRowsCount}`);
    return NextResponse.json({
      message: `Upload de lote concluído com sucesso. ${createManyResult.count} entradas salvas.`,
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

export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204, // No Content
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:4200',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}