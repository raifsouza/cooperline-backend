// lib/cors.ts

import Cors from 'cors';
import type { NextApiRequest, NextApiResponse } from 'next';

// Inicializa o middleware CORS com suas configurações
const cors = Cors({
  // É crucial incluir 'OPTIONS' aqui para que o middleware lide com as requisições de pré-voo
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  // A URL EXATA do seu frontend Angular
  origin: 'http://localhost:4200',
  // Importante se você estiver usando credenciais (cookies, headers de Autorização)
  credentials: true,
  // O status esperado para requisições OPTIONS bem-sucedidas
  optionsSuccessStatus: 200,
});

// Helper para executar o middleware em suas rotas de API
export default function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}