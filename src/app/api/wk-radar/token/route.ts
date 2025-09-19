import { NextResponse } from 'next/server';

// o handler OPTIONS é necessário para o CORS

const allowedOrigin = process.env.FRONTEND_URL;

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4000',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}

// endpoint que gera o token de autenticação para a API do radar
export async function POST() {
    const radarApiUrl = `${process.env.WKRADAR_API_URL}/api/v1/token`;

    // as credenciais devem ser guardadas em variáveis de ambiente
    const credentials = {
        empresa: process.env.RADAR_EMPRESA,
        nomeUsuario: process.env.RADAR_NOMEUSUARIO,
        senha: process.env.RADAR_SENHA,
    };

    // verificacao de todas as variáveis de ambiente necessárias
    if (!process.env.WKRADAR_API_URL || !credentials.empresa || !credentials.nomeUsuario || !credentials.senha) {
        console.error('Credenciais ou URL da API do Radar não configuradas no .env');
        return NextResponse.json({ message: 'Credenciais do servidor não configuradas.' }, { status: 500 });
    }

    try {
        const response = await fetch(radarApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Erro ao autenticar com a API do Radar:', response.status, errorBody);
            return NextResponse.json({ message: 'Falha na autenticação com a API externa.' }, { status: response.status });
        }

        const data = await response.json();
        
        return NextResponse.json({ token: data.token }, { status: 200 });

    } catch (error) {
        console.error('Erro de rede ao tentar obter o token do Radar:', error);
        return NextResponse.json({ message: 'Erro de comunicação com a API externa.' }, { status: 503 });
    }
}