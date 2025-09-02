// app/api/upload-excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import { connect } from 'http2';

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

// Em src/app/api/upload-excel/route.ts

/**
 * Função "orquestradora" que escolhe o parser correto com base no nome do modelo.
 * @param longProductName A string completa do nome do produto.
 * @param modelName O nome do modelo (ex: "Modelo 1").
 * @returns Um objeto com as linhas separadas (nomeLinha1, nomeLinha2, etc.).
 */

function parseProductNameByModel(longProductName: string, modelName: string): { [key: string]: string | undefined } {
    console.log("--- DENTRO DO PARSER ---");
    console.log("1. Recebido longProductName:", longProductName);
    console.log("2. Recebido modelName (bruto):", `"${modelName}"`); // Aspas para ver espaços extras
  if (!longProductName || !modelName) {
    console.error("Saindo: longProductName ou modelName está vazio.");
    return {};
  };

  const text = longProductName.trim();
  const modelNameLower = String(modelName).toLowerCase();
    console.log("3. modelName em minúsculas:", `"${modelNameLower}"`);
  const modelKey = String(modelName).toLowerCase().replace(/\s+/g, '');
    console.log("4. Chave final (modelKey) para busca:", `"${modelKey}"`);

  const parsers: { [key: string]: (t: string) => { [key: string]: string | undefined } } = {
    'modelo1': parseModelo1,
    'modelo2': parseModelo2,
    'modelo3': parseModelo3,
    'modelo4': parseModelo4,
    'modelo5': parseModelo5,
    'modelo6': parseModelo6,
    'modelo7': parseModelo7,
    'modelo8': parseModelo1,
  };
  console.log("5. Chaves disponíveis no parser:", Object.keys(parsers));

  if (parsers[modelKey]) {
    console.log(`6. SUCESSO! Chave '${modelKey}' encontrada. Executando o parser correto.`);
    return parsers[modelKey](text);
  }
  console.error(`7. FALHA! Chave '${modelKey}' NÃO foi encontrada no objeto parsers.`);
    return { nomeLinha1: text };
}
// --- Funções de Parse Específicas e Contextuais ---

function parseModelo1(text: string): { [key: string]: string | undefined } {
  // Ex: "CABO COPPERLINE FLEXMEGA 70°C CO-EXTRUSADO 1 x 1,5 mm² AMARELO"
  const upperText = text.toUpperCase();
  const match = text.match(/^(.*?) (CO-EXTRUSADO) (.*?) (AMARELO|AZUL|BRANCO|PRETO|VERDE|VERMELHO|CINZA)$/i);
  if (!match) {
      console.error("Parse para Modelo 1 falhou em encontrar o padrão para:", text)
      return { nomeLinha1: text };
    }
  
  const [_, descParte1, descParte2, secao, cor] = match;
  const palavrasDesc1 = descParte1.trim().split(/\s+/);

  return {
    nomeLinha1: palavrasDesc1.slice(0, 2).join(' '), // CABO COPPERLINE
    nomeLinha2: palavrasDesc1.slice(2).join(' '),   // FLEXMEGA 70°C
    nomeLinha3: descParte2,                          // CO-EXTRUSADO
    nomeLinha4: secao.trim(),                       // 1 x 1,5 mm²
    nomeLinha5: cor,                                 // AMARELO
  };
}

function parseModelo2(text: string): { [key: string]: string | undefined } {
  // Ex: "CABO COPPERLINE FLEXMEGA 70°C 1 X 1,0 MM2 AZUL"
  const match = text.match(/^(CABO COPPERLINE FLEXMEGA 70°C)\s+(.*?)\s+(AMARELO|AZUL|BRANCO|PRETO|VERDE|VERMELHO|CINZA)$/i);
  
  if (!match) {
    console.error("Parser para Modelo 2 falhou para:", text);
    return { nomeLinha1: text };
  }

  const [_, desc, secao, cor] = match;
  const palavrasDesc = desc.trim().split(/\s+/);

  return {
    nomeLinha1: palavrasDesc.slice(0, 2).join(' '), // CABO COPPERLINE
    nomeLinha2: palavrasDesc.slice(2).join(' '),   // FLEXMEGA 70°C
    nomeLinha3: secao.trim(),
    nomeLinha4: cor.trim(),
  };
}

function parseModelo3(text: string): { [key: string]: string | undefined } {
    // Esta função agora lida com as duas variantes:
    // Ex 1: "CABO COPPERLINE NAXMEGA FLEX 70°C 1 X 1,5 MM2 PRETO"
    // Ex 2: "CABO COPPERLINE NAXMEGA FLEX AS 70°C 2 X 1,5 MM2 PRETO"

    // A regex agora torna o grupo "(AS )" opcional com o '?'
    const match = text.toUpperCase().match(
        /^(CABO COPPERLINE NAXMEGA FLEX)\s+((?:AS\s+)?70\s*°C)\s+(.*?MM2)\s+(PRETO|BRANCO|AZUL|VERDE|VERMELHO|CINZA)$/i
    );

    if (!match) {
        console.error("Parser para Modelo 3 falhou. Verifique se o nome do produto corresponde a um dos padrões esperados:", text);
        return { nomeLinha1: text };
    }

    // match[1] -> "CABO COPPERLINE NAXMEGA FLEX"
    // match[2] -> "AS 70 °C" ou "70 °C" (captura o grupo inteiro)
    // match[3] -> "1 X 1,5 MM2"
    // match[4] -> "PRETO"
    const [_, descParte1, descParte2Completa, secao, cor] = match;
    
    const palavrasDesc1 = descParte1.trim().split(/\s+/);

    return {
        nomeLinha1: palavrasDesc1.slice(0, 2).join(' '), // -> "CABO COPPERLINE"
        nomeLinha2: palavrasDesc1.slice(2).join(' '),   // -> "NAXMEGA FLEX"
        nomeLinha3: descParte2Completa.trim(),          // -> "AS 70 °C" ou "70 °C"
        nomeLinha4: secao.trim(),                       // -> "1 X 1,5 MM2"
        nomeLinha5: cor.trim(),                         // -> "PRETO"
    };
}

function parseModelo4(text: string): { [key: string]: string | undefined } {
    const match = text.match(/^(CABO COPPERLINE NAXMEGA FLEX XLPE AS 90°C)\s+(.*?)\s+(PRETO|BRANCO|AZUL|VERDE|VERMELHO|CINZA)$/i);
    if (!match) {
        console.error("Parser para Modelo 4 falhou:", text);
        return { nomeLinha1: text };
    }
    const [_, descricaoCompleta, secao, cor] = match;
    return {
        nomeLinha1: 'CABO COPPERLINE',
        nomeLinha2: 'NAXMEGA',
        nomeLinha3: 'FLEX XLPE',
        nomeLinha4: 'AS 90 °C',
        nomeLinha5: secao.trim(),
        nomeLinha6: cor.trim(),
    };
}

function parseModelo5(text: string): { [key: string]: string | undefined } {
    // Ex: "CABO COPPERLINE PPMEGA AS 70°C 2 X 1,0 MM2 PRETO"
    const upperText = text.toUpperCase();
    const match = text.match(/^(.*?) (PPMEGA)\s*(AS 70°C)\s*(.*?) (PRETO)$/i);
    if (!match) {
      console.error("Parse para Modelo 5 falhou em encontrar o padrão para:", text)
      return { nomeLinha1: text };
    }
    const [_, descParte1, l2, l3, secao, cor] = match;
    return {
        nomeLinha1: descParte1.trim(), nomeLinha2: l2, nomeLinha3: l3,
        nomeLinha4: secao.trim(), nomeLinha5: cor
    };
}

function parseModelo6(text: string): { [key: string]: string | undefined } {
    // Ex: "CORDAO COPPERLINE PARALELOMEGA 2 X 0,50 MM2 BRANCO"
    const upperText = text.toUpperCase();
    const match = text.match(/^(.*?) (PARALELOMEGA)\s*(.*?) (BRANCO)$/i);
    if (!match) {
      console.error("Parse para Modelo 6 falhou em encontrar o padrão para:", text)
      return { nomeLinha1: text };
    }
    const [_, descParte1, l2, secao, cor] = match;
    return {
        nomeLinha1: descParte1.trim(), nomeLinha2: l2,
        nomeLinha3: secao.trim(), nomeLinha4: cor
    };
}

function parseModelo7(text: string): { [key: string]: string | undefined } {
    // Ex: "CABOMEGA COPPERLINE DE COBRE NU MOLE C-2 10,0 MM"
    const upperText = text.toUpperCase();
    const match = text.match(/^(CABOMEGA)\s*(COPPERLINE)\s*(DE COBRE)\s*(NU MOLE C-2)\s*(.*)$/i);
    if (!match) {
      console.error("Parse para Modelo 7 falhou em encontrar o padrão para:", text)
      return { nomeLinha1: text };
    }
    const [_, l1, l2, l3, l4, secao] = match;
    return {
        nomeLinha1: l1, nomeLinha2: l2, nomeLinha3: l3,
        nomeLinha4: l4, nomeLinha5: secao.trim()
    };
}

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

    // todos os layouts de impressão vão ser carregados aqui
    const allLabelLayouts = await prisma.labelEntry.findMany({
      select: { id: true, fileName: true }
    });

    // o mapa para busca do layout na tabela layout_entries vai estar aqui
    const layoutMap = new Map<string, number>();
    allLabelLayouts.forEach(layout => {
      if (layout.fileName) {
        const normalizedName = layout.fileName.replace(/\.prn$/i, '').toLowerCase().trim();
        layoutMap.set(normalizedName, layout.id);
      }
    });

    const headers = jsonData[0] as string[];
    console.log('PASSO 1: Cabeçalos encontrados na planilha:', headers);
    const dataRows = jsonData.slice(1);
    let processedCount = 0;

    for (const row of dataRows) {

      if (row.length === 0 || row.every((cell: any) => cell === null || cell === '')) {
        continue;
      }
      console.log('----------------------------------------------------')
      console.log('PASSO 2: Processando a seguinte linha do Excel:', row);

      const getCellValue = (headerName: string) => {
        const index = headers.indexOf(headerName);
        return index !== -1 && row[index] !== undefined ? row[index] : null;
      };

      const retalhoValue = getCellValue('Retalho');
      const retalhoParaSalvar = (retalhoValue && String(retalhoValue).toLowerCase().trim() === 'sim') 
            ? 'Sim' 
            : null;
      const layoutNameFromExcelRaw= (getCellValue('Layout da Etiqueta')?.toString() || '');
      const layoutNameFromExcel = layoutNameFromExcelRaw.toLowerCase().trim();
      const nomeProdutoLongo = String(getCellValue('Nome Produto') || '');
      const labelId = layoutNameFromExcel ? layoutMap.get(layoutNameFromExcel) : null;
      console.log(`PASSO 3: Dados extraídos -> Nome: '${nomeProdutoLongo}', Layout: '${layoutNameFromExcel}'`); // <<<< LOG DE DEPURAÇÃO 3
      const codigo = String(getCellValue('Código') || '');

      if (!labelId || !nomeProdutoLongo || !codigo) {
        console.warn(`Layout '${layoutNameFromExcel}' não encontrado no banco para a linha:`, row);
        continue;
      }

      const nomeProdutoQuebrado = parseProductNameByModel(nomeProdutoLongo, layoutNameFromExcel);
      console.log('PASSO 4: Objeto quebrado pela função de parse:', nomeProdutoQuebrado); // <<<< LOG DE DEPURAÇÃO 4
      const codBarras = String(getCellValue('Cod. Barras') || '');

      if (!codigo || !codBarras) {
        console.warn('Linha ignorada por falta de Código ou Cod. Barras:', row);
        continue;
      }
      
      await prisma.productEntry.upsert({
        where: { codigo: codigo},
        update: {
          ...nomeProdutoQuebrado,
          tamanhoPadrao: String(getCellValue('Tamanho Padrão') || ''),
          designacao: String(getCellValue('Designação') || ''),
          tensao: String(getCellValue('Tensão') || ''),
          massaBrutaKg100m: parseFloat(getCellValue('Massa Bruta (kg/100m)') || '0'),
          normaAplicada: String(getCellValue('Norma Aplicada') || ''),
          composicao: String(getCellValue('Composição') || ''),
          numeroRegistro: String(getCellValue('Nº Registro') || ''),
          codBarras: codBarras,
          massaLiquidaKg100m: parseFloat(getCellValue('Massa Liquida (kg/100m)') || '0'),
          retalho: retalhoParaSalvar,
          label: { connect: { id: labelId } }
        },
        create: {
          codigo: codigo,
          codBarras: codBarras,
          ...nomeProdutoQuebrado,
          tamanhoPadrao: String(getCellValue('Tamanho Padrão') || ''),
          designacao: String(getCellValue('Designação') || ''),
          tensao: String(getCellValue('Tensão') || ''),
          massaBrutaKg100m: parseFloat(getCellValue('Massa Bruta (kg/100m)') || '0'),
          normaAplicada: String(getCellValue('Norma Aplicada') || ''),
          composicao: String(getCellValue('Composição') || ''),
          numeroRegistro: String(getCellValue('Nº Registro') || ''),
          massaLiquidaKg100m: parseFloat(getCellValue('Massa Liquida (kg/100m)') || '0'),
          retalho: retalhoParaSalvar,
          labelId: labelId,
        }
      });
      processedCount++;
    }
    
    return NextResponse.json(
      { message: `Planilha processada! ${processedCount} produtos foram criados ou atualizados.`},
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