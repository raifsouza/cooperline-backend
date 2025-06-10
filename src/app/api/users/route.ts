import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para requisições OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Handler para GET /api/users
 * Lista todos os usuários do sistema.
 */
export async function GET(req: NextRequest) {
  // TODO: Implementar verificação de token para garantir que apenas um ADMIN possa listar usuários.
  
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(
      // Seleciona apenas os campos seguros para serem exibidos no frontend
      'SELECT id, nome, nivel_acesso FROM usuarios'
    );
    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar usuários.' }, { status: 500, headers: corsHeaders });
  } finally {
    if (connection) connection.release(); // Libera a conexão de volta para o pool
  }
}

/**
 * Handler para POST /api/users
 * Cria um novo usuário.
 */
export async function POST(req: NextRequest) {
  // TODO: Implementar verificação de token para garantir que apenas um ADMIN possa criar usuários.

  let connection;
  try {
    const { nome, senha, nivel_acesso } = await req.json();

    // Validação de campos obrigatórios
    if (!nome || !senha || !nivel_acesso) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400, headers: corsHeaders });
    }

    // Regra de negócio: Impede a criação de usuários ADMIN pela API
    if (nivel_acesso === 1) {
      return NextResponse.json({ message: 'A criação de usuários ADMIN não é permitida via API.' }, { status: 403, headers: corsHeaders });
    }

    // ATENÇÃO: Salvando a senha em texto puro apenas para fins de teste.
    const passwordToSave = senha;

    connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nome, senha, nivel_acesso) VALUES (?, ?, ?)',
      [nome, passwordToSave, nivel_acesso]
    );

    const insertResult = result as any;
    // Retorna os dados do novo usuário criado (sem a senha)
    const newUser = {
      id: insertResult.insertId,
      nome,
      nivel_acesso
    };
    
    return NextResponse.json(newUser, { status: 201, headers: corsHeaders }); // 201 Created

  } catch (error: any) {
    // Trata o erro de chave duplicada (ex: nome já existe)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ message: 'A nome informado já está em uso.' }, { status: 409, headers: corsHeaders });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao criar usuário.' }, { status: 500, headers: corsHeaders });
  } finally {
    if (connection) connection.release();
  }
}