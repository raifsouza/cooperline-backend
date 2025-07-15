// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Permita acesso do seu frontend Angular (http://localhost:4200)
  // Certifique-se de que a origem do seu frontend esteja correta
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true'); // Se estiver usando cookies/autenticação

  // Para requisições OPTIONS (pré-voo CORS)
  if (request.method === 'OPTIONS') {
    return response;
  }

  return response;
}

// Defina para quais rotas este middleware deve ser aplicado
// Aqui, aplicamos a todas as rotas da API (que começam com /api)
export const config = {
  matcher: '/api/:path*', // Aplica a todas as rotas que começam com /api/
};