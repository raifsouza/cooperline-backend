// app/api/upload-excel/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

export const config = {
  api: {
    bodyParser: false,
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
    'Access-Control-Allow-Origin': 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const formData = await req.formData();
    const excelFile = formData.get('excelFile') as File | null;

    if (!excelFile) {
      return NextResponse.json({ message: 'Nenhum arquivo Excel enviado.' }, { status: 400, headers: corsHeaders });
    }

    const arrayBuffer = await excelFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json({ message: 'A planilha está vazia ou não tem dados suficientes.' }, { status: 400, headers: corsHeaders });
    }

    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    const productsToCreate = [];

    for (const row of dataRows) {
      const product: any = {};
      const getCellValue = (headerName: string) => {
        const index = headers.indexOf(headerName);
        return index !== -1 && row[index] !== undefined ? row[index] : null;
      };

      // NOVA COLUNA: Código
      product.codigo = String(getCellValue('Código') || ''); // Use o nome exato da coluna no Excel

      product.nomeProduto = String(getCellValue('Nome Produto') || '');
      product.tamanhoPadrao = String(getCellValue('Tamanho Padrão') || '');
      product.designacao = String(getCellValue('Designação') || '');
      product.tensao = String(getCellValue('Tensão') || '');
      product.massaBrutaKg100m = parseFloat(getCellValue('Massa Bruta (kg/100m)') || '0');
      if (isNaN(product.massaBrutaKg100m)) product.massaBrutaKg100m = 0;

      product.normaAplicada = String(getCellValue('Norma Aplicada') || '');
      product.composicao = String(getCellValue('Composição') || '');
      product.numeroRegistro = String(getCellValue('Nº Registro') || '');
      product.codBarras = String(getCellValue('Cod. Barras') || '');

      product.pedidoOc = getCellValue('Pedido (OC)') ? String(getCellValue('Pedido (OC)')) : null;
      product.retalho = getCellValue('Retalho') ? String(getCellValue('Retalho')) : null;

      product.massaLiquidaKg100m = parseFloat(getCellValue('Massa Liquida (kg/100m)') || '0');
      if (isNaN(product.massaLiquidaKg100m)) product.massaLiquidaKg100m = 0;

      // Validação: 'codigo', 'nomeProduto' e 'codBarras' são essenciais
      if (
        product.codigo && product.codigo.trim() !== '' &&
        product.nomeProduto && product.nomeProduto.trim() !== '' &&
        product.codBarras && product.codBarras.trim() !== ''
      ) {
        productsToCreate.push(product);
      } else {
        console.warn('Linha ignorada devido a dados essenciais incompletos (Codigo, Nome Produto ou Cod. Barras):', row);
      }
    }

    if (productsToCreate.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto válido encontrado na planilha para inserir.' }, { status: 400, headers: corsHeaders });
    }

    const result = await prisma.productEntry.createMany({
      data: productsToCreate,
      skipDuplicates: true, // Pula registros se 'codigo' ou 'codBarras' forem únicos e já existirem
    });

    return NextResponse.json(
      { message: 'Planilha processada e dados salvos com sucesso!', processedCount: result.count },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erro ao processar upload de Excel:', error);
    if (error instanceof Error && (error as any).code === 'P2002') { // Erro de violação de chave única
        return NextResponse.json(
            { message: 'Erro: Conflito de dados. Alguns códigos de produto ou de barras já existem.', error: error.message },
            { status: 409, headers: corsHeaders }
        );
    }
    return NextResponse.json(
      { message: 'Erro interno do servidor ao processar a planilha.', error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

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