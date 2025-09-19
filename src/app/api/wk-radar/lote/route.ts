import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// função de ajuda para normalizar os lotes já criados
function normalizeLoteNumber(lote: any): string | null {
  if (!lote) return null;
  const loteString = String(lote).trim();
  const match = loteString.match(/^(\d{4}-\d{6})/);
  return match ? match[1] : null;
}

function formatDateToDDMMYYYY(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const allowedOrigin = process.env.FRONTEND_URL;

// o handler OPTIONS para o CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4000',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

// esse endpoint orquestra todo o processo
export async function POST(request: Request) {
    console.log("Iniciando sincronização de lotes do Radar...");

    try {
        
        // chamada interna para a nossa própria API de token
        const tokenResponse = await fetch(`${process.env.INTERNAL_API_URL}/api/wk-radar/token`, {
             method: 'POST' 
            });

        if (!tokenResponse.ok){
            const errorText = await tokenResponse.text();
            console.error(`Falha ao chamer a API interna de token. Status: ${tokenResponse.status}`, errorText);
            throw new Error('Falha ao obter o token de autenticação.');
        }

        // armazenamento do json de resposta do token
        const tokenData = await tokenResponse.json();
        console.log("Dados recebidos da API de token:", tokenData);
        const { token } = tokenData;
        if (!token) throw new Error('Token não recebido da API de autenticação.');

        
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const dataFinal = formatDateToDDMMYYYY(today); // chama a função formatDateToDDMMYYYY [...]
        const dataInicial = formatDateToDDMMYYYY(thirtyDaysAgo); // [...] para que a data fique no formato que a api recebe

        //aqui é feita a consulta do lote na api do WKRadar
        const radarApiUrl = `${process.env.WKRADAR_API_URL}/api/producao/v1/ordem-producao/produto?PeriodoDataInicial=${encodeURIComponent(dataInicial)}&PeriodoDataFinal=${encodeURIComponent(dataFinal)}`;
        console.log('Consultando API do radar com a URL', radarApiUrl);

        const lotsResponse = await fetch(radarApiUrl, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${token}`,},
        });

        if (!lotsResponse.ok) {
            const errorBody = await lotsResponse.text();
            console.error(`Erro ao buscar dados do Radar. Status: ${lotsResponse.status}`, errorBody);
            throw new Error(`Erro ao buscar dados do Radar: ${lotsResponse.statusText}`);
        }

        const radarData = await lotsResponse.json();
        const items = radarData.itens || radarData;
        console.log('Dados da consulta de lotes:', radarData);
        
        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ message: 'Nenhum item encontrado na resposta da API do Radar.' }, { status: 200 });
        }

        // extrai, normaliza e filtra lotes válidos
        const lotesDoRadar = items
            .map((item: any) => normalizeLoteNumber(item.chave))
            .filter((lote: string | null): lote is string => lote !== null);
            
        // remove duplicatas da lista vinda do Radar
        const lotesUnicosDoRadar = [...new Set(lotesDoRadar)];
        
        if (lotesUnicosDoRadar.length === 0) {
            return NextResponse.json({ message: 'Nenhum lote com formato válido encontrado no Radar nos últimos 30 dias.' }, { status: 200 });
        }

        // verifica quais desses lotes já existem no nosso banco
        const lotesExistentes = await prisma.loteEntry.findMany({
            where: { lote: { in: lotesUnicosDoRadar } },
            select: { lote: true }
        });
        const setLotesExistentes = new Set(lotesExistentes.map(l => l.lote));

        // cria a lista apenas com os lotes que são REALMENTE novos
        const lotesParaSalvar = lotesUnicosDoRadar
            .filter(lote => !setLotesExistentes.has(lote))
            .map(lote => ({ lote })); // Formata para o createMany

        // aqui os lotes vão ser salvos no banco de dados
        if (lotesParaSalvar.length > 0) {
            const result = await prisma.loteEntry.createMany({
                data: lotesParaSalvar,
            });
            console.log(`${result.count} novos lotes foram salvos no banco de dados.`);
            return NextResponse.json({ message: `Sincronização concluída. ${result.count} novos lotes adicionados.` }, { status: 201 });
        }

        console.log("Nenhum lote novo para adicionar. O banco de dados já está atualizado.");
        return NextResponse.json({ message: 'Sincronização concluída. Nenhum lote novo encontrado.' }, { status: 200 });

    } catch (error: any) {
        console.error('Erro durante a sincronização de lotes do Radar:', error);
        return NextResponse.json({ message: 'Erro interno do servidor durante a sincronização.', details: error.message }, { status: 500 });
    }
}