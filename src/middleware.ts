// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Permita acesso do seu frontend Angular (http://localhost:4200)
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:4200');
  // Inclua 'OPTIONS' explicitamente nos métodos permitidos
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Para requisições OPTIONS (pré-voo CORS)
  if (request.method === 'OPTIONS') {
    // Se esta é uma requisição OPTIONS, retorne uma resposta 200 OK imediatamente.
    // Isso é o que o navegador espera para o preflight ser bem-sucedido.
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  // Aplica a todas as rotas da API (que começam com /api)
  matcher: '/api/:path*',
};