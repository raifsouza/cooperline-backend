// src/app/api/upload-lote/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

// Dica: Para produção, é melhor ter uma instância única do PrismaClient
// exportada de um arquivo em /lib, em vez de criar uma nova em cada rota.
const prisma = new PrismaClient();

// O handler OPTIONS é necessário para o CORS (Cross-Origin Resource Sharing)
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204, // No Content
        headers: {
            'Access-Control-Allow-Origin': '*', // Seja mais específico em produção (ex: 'http://localhost:4200')
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


// // src/app/api/upload-lote/route.ts

// import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import * as XLSX from 'xlsx';

// const prisma = new PrismaClient();

// export async function POST(request: Request) {
//   console.log('POST request received for /api/upload-lote');

//   try {
//     const formData = await request.formData();
//     // Altere esta linha para obter o valor, sem um cast inicial para Blob | null
//     const file = formData.get('loteFile');

//     if (!file) {
//       console.error('Nenhum arquivo encontrado na requisição para lote (campo "loteFile" ausente).');
//       return NextResponse.json({ message: 'Nenhum arquivo de lote enviado (campo "loteFile" ausente).' }, { status: 400 });
//     }

//     // Verifique se 'file' é uma instância de File antes de acessar 'name'
//     // Isso é crucial porque formData.get() pode retornar um FormDataEntryValue (string ou Blob)
//     if (!(file instanceof File)) {
//         console.error('O valor do campo "loteFile" não é um arquivo.');
//         return NextResponse.json({ message: 'O valor enviado para o lote não é um arquivo válido.' }, { status: 400 });
//     }

//     // Agora 'file' é garantido ser um File, então 'file.name' é seguro
//     console.log(`Arquivo recebido: ${file.name} (tipo: ${file.type}, tamanho: ${file.size} bytes)`);

//     // ... (restante do seu código) ...

//     const arrayBuffer = await file.arrayBuffer(); // Isso está correto, Blob tem arrayBuffer()
//     const data = new Uint8Array(arrayBuffer);
//     console.log('ArrayBuffer do arquivo lido.');

//     const workbook = XLSX.read(data, { type: 'array' });
//     console.log('Workbook XLSX lido.');

//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     console.log(`Processando planilha: ${sheetName}`);

//     const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//     console.log('Dados da planilha convertidos para JSON. Primeiras linhas:', jsonData.slice(0, 3));

//     if (!jsonData || jsonData.length < 2) {
//       console.warn('O arquivo de lote Excel está vazio ou contém apenas o cabeçalho.');
//       return NextResponse.json({ message: 'O arquivo de lote Excel está vazio ou não contém dados.' }, { status: 400 });
//     }

//     const headers = jsonData[0] as string[];
//     const rows = jsonData.slice(1);

//      const headerMap: { [key: string]: string } = {
//       'Lote': 'lote', // Estes são os nomes das propriedades no modelo Prisma
//       'Produto': 'produto',
//       'FabricadoEm': 'fabricadoEm',
//       'Fabricado Em': 'fabricadoEm',
//     };

//     const loteEntries = [];
//     let processedRowsCount = 0;
//     let skippedRowsCount = 0;

//     for (const row of rows) {
//       const rowData: { [key: string]: any } = {};
//       for (let i = 0; i < headers.length; i++) {
//         // AQUI: use o nome do cabeçalho original ou normalizado como chave para o rowData
//         const originalHeader = headers[i]; // Mantenha o cabeçalho original
//         const normalizedHeader = originalHeader.replace(/\s+/g, '').trim(); // Ou use o normalizado para robustez
//         rowData[normalizedHeader] = row[i]; // rowData terá chaves como 'Lote', 'Produto', 'FabricadoEm'
//       }

//       // **MUDE AQUI:** Acesse rowData com as chaves que você realmente criou ('Lote', 'Produto', 'FabricadoEm')
//       // Note que 'Fabricado Em' no Excel se torna 'FabricadoEm' após a normalização.
//       const lote = rowData['Lote'];
//       const produto = String(rowData['Produto']);
//       const fabricadoEmExcel = rowData['FabricadoEm']; // A chave já é 'FabricadoEm' após normalização

//       if (!lote || !produto || fabricadoEmExcel === undefined || fabricadoEmExcel === null) {
//         console.warn('Linha de lote com dados incompletos e ignorada:', rowData);
//         skippedRowsCount++;
//         continue;
//       }

//       let fabricadoEmDate: Date;
//       if (typeof fabricadoEmExcel === 'number' && !isNaN(fabricadoEmExcel)) {
//         fabricadoEmDate = new Date((fabricadoEmExcel - 25569) * 86400 * 1000);
//       } else {
//         fabricadoEmDate = new Date(fabricadoEmExcel);
//         if (isNaN(fabricadoEmDate.getTime())) {
//             console.warn('Data de fabricação inválida e linha ignorada:', rowData);
//             skippedRowsCount++;
//             continue;
//         }
//       }

//       loteEntries.push({
//         lote: String(lote),
//         produto: produto,
//         fabricadoEm: fabricadoEmDate,
//       });
//       processedRowsCount++;
//     }

//     if (loteEntries.length === 0 && skippedRowsCount > 0) {
//         return NextResponse.json({ message: `Nenhum dado válido encontrado para salvar. ${skippedRowsCount} linhas foram ignoradas por dados incompletos ou inválidos.` }, { status: 400 });
//     } else if (loteEntries.length === 0) {
//         return NextResponse.json({ message: 'O arquivo de lote Excel não contém dados válidos para processar.' }, { status: 400 });
//     }

//     const createManyResult = await prisma.loteEntry.createMany({
//       data: loteEntries,
//       skipDuplicates: true,
//     });

//     console.log(`Upload de lote concluído. Total de linhas processadas: ${processedRowsCount}, Salvas no DB: ${createManyResult.count}, Ignoradas: ${skippedRowsCount}`);
//     return NextResponse.json({
//       message: `Upload de lote concluído com sucesso. ${createManyResult.count} entradas salvas.`,
//       savedCount: createManyResult.count,
//       skippedCount: skippedRowsCount
//     }, { status: 200 });

//   } catch (error: any) {
//     console.error('Erro no upload de lote:', error);
//     return NextResponse.json(
//       { message: 'Erro interno do servidor ao processar o arquivo de lote.', details: error.message },
//       { status: 500 }
//     );
//   }
// }

// export async function OPTIONS(request: Request) {
//     return new NextResponse(null, {
//         status: 204, // No Content
//         headers: {
//             'Access-Control-Allow-Origin': 'http://localhost:4200',
//             'Access-Control-Allow-Methods': 'POST, OPTIONS',
//             'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//         },
//     });
// }