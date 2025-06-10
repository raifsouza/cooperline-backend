import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';
// import bcrypt from 'bcryptjs'; // Removido por enquanto para simplificar o teste de CORS

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200', // Permita especificamente o seu frontend Angular
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Métodos permitidos
  'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Cabeçalhos permitidos
  'Access-Control-Allow-Credentials': 'true', // Permite credenciais (cookies, headers de auth)
};

// Handler para requisições OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Handler para requisições POST (login)
export async function POST(req: NextRequest) {
  try {
    const { nome, senha } = await req.json();

    if (!nome || !senha) {
      return NextResponse.json(
        { message: 'Nome e senha são obrigatórias.' },
        { status: 400, headers: corsHeaders } // Adicionar os cabeçalhos aqui
      );
    }

    const connection = await getConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM usuarios WHERE nome = ?',
        [nome]
      );

      const users = rows as any[];

      if (users.length === 0) {
        return NextResponse.json(
          { message: 'Nome ou senha inválidas.' },
          { status: 401, headers: corsHeaders } // Adicionar os cabeçalhos aqui
        );
      }

      const user = users[0];

      // **ATENÇÃO:** Para produção, usar bcrypt.compare(senha, user.senha);
      const isPasswordValid = (senha === user.senha); // Exemplo simples

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Nome ou senha inválidas.' },
          { status: 401, headers: corsHeaders } // Adicionar os cabeçalhos aqui
        );
      }

      // Login bem-sucedido: retorna informações do usuário (sem a senha)
      const { senha: userPassword, ...userData } = user;
      return NextResponse.json(
        { message: 'Login realizado com sucesso!', user: userData },
        { status: 200, headers: corsHeaders } // Adicionar os cabeçalhos aqui
      );

    } catch (dbError) {
      console.error('Erro ao consultar o banco de dados:', dbError);
      return NextResponse.json(
        { message: 'Erro interno do servidor.' },
        { status: 500, headers: corsHeaders } // Adicionar os cabeçalhos aqui
      );
    } finally {
      await connection.release(); // Fecha a conexão com o banco de dados
    }
  } catch (error) {
    console.error('Erro inesperado na API de login:', error);
    return NextResponse.json(
      { message: 'Erro inesperado no servidor.' },
      { status: 500, headers: corsHeaders } // Adicionar os cabeçalhos aqui
    );
  }
}