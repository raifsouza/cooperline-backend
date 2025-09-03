// src/app/api/time/route.ts
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigin = process.env.FRONTEND_URL;

const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders});
}

export async function GET(request: NextRequest) {
    try {
        const serverTime = new Date().toISOString();
        return NextResponse.json({ currentTime: serverTime}, { status: 200, headers: corsHeaders });
    } catch (error) {
        return NextResponse.json({ message: 'Erro ao obter a hora do servidor.'}, { status: 500, headers: corsHeaders });
    }
}