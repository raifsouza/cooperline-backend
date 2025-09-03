import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';// Ajuste o caminho para seu arquivo db.ts

// Definir os cabeçalhos CORS uma vez para reutilização
const allowedOrigin = process.env.FRONTEND_URL;

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para requisições OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PUT(req: NextRequest) { // Tive que usar extração manual da URL porque o acesso via context.params
  let connection;                             // ficava estourando um erro persistente no console
  try {                                       

    // Extrai o ID diretamente da URL da requisição
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1]; // Pega o último segmento da URL

    // TODO: Implementar verificação de token de ADMIN

    const { nome, senha, nivel_acesso } = await req.json();

    if (nivel_acesso === 1 || id === '1') {
      return NextResponse.json({ message: 'Alteração não permitida.' }, { status: 403, headers: corsHeaders });
    }

    // O restante da sua lógica de UPDATE continua aqui...
    const fieldsToUpdate = [];
    const values = [];

    if (nome) { fieldsToUpdate.push('nome = ?'); values.push(nome); }
    if (senha) { fieldsToUpdate.push('senha = ?'); values.push(senha); }
    if (nivel_acesso) { fieldsToUpdate.push('nivel_acesso = ?'); values.push(nivel_acesso); }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'Nenhum campo para atualizar.' }, { status: 400, headers: corsHeaders });
    }

    values.push(id);
    connection = await getConnection();
    await connection.execute(`UPDATE usuarios SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);
    
    return NextResponse.json({ message: 'Usuário atualizado com sucesso.' }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error(`Erro ao atualizar usuário:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500, headers: corsHeaders });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(req: NextRequest) { // Removido o segundo argumento 'context'
  let connection;
  try {
    // Extrai o ID diretamente da URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];

    // TODO: Implementar verificação de token de ADMIN

    if (id === '1') {
      return NextResponse.json({ message: 'O usuário ADMIN não pode ser deletado.' }, { status: 403, headers: corsHeaders });
    }

    connection = await getConnection();
    await connection.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Usuário deletado com sucesso.' }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`Erro ao deletar usuário:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500, headers: corsHeaders });
  } finally {
    if (connection) connection.release();
  }
}