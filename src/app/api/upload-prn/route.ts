// app/api/upload-prn/route.ts
import { NextResponse } from 'next/server';
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
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:4200', // Ajuste para seu frontend
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
    const fileNameWithExtension = prnFile.name;
    const labelName = fileNameWithExtension.replace(/\.prn$/i, '').trim();

    // 2. Ler o conteúdo do arquivo .prn
    const fileContent = await prnFile.text(); // Lê o arquivo como texto

    // 3. Extrair informações usando Regex
    const extractedData: { [key: string]: string | null } = {};

    // Expressões regulares para cada campo.
    // Opcional: Adicione mais regex se tiver outros campos a extrair.
    const regexMap = {
      designacao: /- Designa\x87\xC6o:\s*(.+?)(?=\^)/i, // Corrigido para \x87\xC6o
      tensao: /- Tens\xC6o:\s*(.+?)(?=\^)/i,
      dataFab: /- Data Fab\.:\s*(.+?)(?=\^)/i,
      paisOrigem: /- Pa\xA1s de origem:\s*(.+?)(?=\^)/i, // Corrigido para \xA1s
      validade: /- Validade:\s*(.+?)(?=\^)/i,
      lote: /- Lote:\s*(.+?)(?=\^)/i,
      registro: /Registro\s*(.+?)(?=\^)/i, // Ou ^FDRegistro(\s*[^A-Z0-9]*)([A-Z0-9\/]+)
      barcode: /\^FD(\d{13,14})\^FS/i // Assumindo 13 ou 14 dígitos para código de barras, dentro de ^FD ^FS
    };

    for (const key in regexMap) {
      if (Object.prototype.hasOwnProperty.call(regexMap, key)) {
        const regex = regexMap[key as keyof typeof regexMap];
        const match = fileContent.match(regex);
        extractedData[key] = match && match[1] ? match[1].trim() : null;
      }
    }
    
    // Tratamento específico para o registro que aparece em outro formato
    const registroMatchAlt = fileContent.match(/Registro\^FS\n\^FT\d+,\d+\^A0B,\d+,\d+\^FB\d+,1,0,C\^FH\\?\^FD([\d\/]+)\^FS/i);
    if (registroMatchAlt && registroMatchAlt[1]) {
      extractedData.registro = registroMatchAlt[1].trim();
    }


    // 4. Salvar no banco de dados usando Prisma
    const newLabelEntry = await prisma.labelEntry.create({
      data: {
        fileName: labelName,
        originalContent: fileContent,
        designacao: extractedData.designacao,
        tensao: extractedData.tensao,
        dataFab: extractedData.dataFab,
        paisOrigem: extractedData.paisOrigem,
        validade: extractedData.validade,
        lote: extractedData.lote,
        registro: extractedData.registro,
        barcode: extractedData.barcode,
      },
    });

    return NextResponse.json(
      {
        message: 'Arquivo .prn processado e salvo com sucesso!',
        label: newLabelEntry,
      },
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
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:4200',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}