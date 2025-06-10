import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../lib/db';// Ajuste o caminho para seu arquivo db.ts

// Definir os cabeçalhos CORS uma vez para reutilização
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para requisições OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

// /**
//  * Handler para PUT /api/users/[id]
//  * Atualiza um usuário existente.
//  */
// export async function PUT(req: NextRequest, context: { params: { id: string } }) {
//   // TODO: Implementar verificação de token para garantir que apenas um ADMIN possa fazer isso.

//   const id = context.params.id;
//   let connection;
//   try {
//     const { nome, senha, nivel_acesso } = await req.json();

//     // Regras de negócio: Impede a promoção para ADMIN ou a alteração do próprio ADMIN (ID 1)
//     if (nivel_acesso === 1 || id === '1') {
//       return NextResponse.json({ message: 'Alteração não permitida para este usuário ou nível.' }, { status: 403, headers: corsHeaders });
//     }

//     // Constrói a query de UPDATE dinamicamente com base nos campos enviados
//     const fieldsToUpdate = [];
//     const values = [];

//     if (nome) { fieldsToUpdate.push('nome = ?'); values.push(nome); }
//     if (nivel_acesso) { fieldsToUpdate.push('nivel_acesso = ?'); values.push(nivel_acesso); }
//     if (senha) {
//       // ATENÇÃO: Salvando a senha em texto puro apenas para fins de teste.
//       fieldsToUpdate.push('senha = ?');
//       values.push(senha);
//     }

//     if (fieldsToUpdate.length === 0) {
//       return NextResponse.json({ message: 'Nenhum campo fornecido para atualização.' }, { status: 400, headers: corsHeaders });
//     }

//     values.push(id); // Adiciona o ID no final para a cláusula WHERE

//     connection = await getConnection();
//     await connection.execute(
//       `UPDATE usuarios SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
//       values
//     );

//     return NextResponse.json({ message: 'Usuário atualizado com sucesso.' }, { status: 200, headers: corsHeaders });
//   } catch (error) {
//     console.error(`Erro ao atualizar usuário ${id}:`, error);
//     return NextResponse.json({ message: 'Erro interno do servidor ao atualizar usuário.' }, { status: 500, headers: corsHeaders });
//   } finally {
//     if (connection) connection.release();
//   }
// }

// ================================================================
// Handler para PUT (Atualizar) - Com a abordagem alternativa
// ================================================================

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

// /**
//  * Handler para DELETE /api/users/[id]
//  * Deleta um usuário existente.
//  */
// export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
//   // TODO: Implementar verificação de token para garantir que apenas um ADMIN possa fazer isso.

//   const id = context.params.id;
  
//   // Regra de negócio: Impede que o ADMIN principal (ID 1) seja deletado
//   if (id === '1') {
//       return NextResponse.json({ message: 'O usuário ADMIN principal não pode ser deletado.' }, { status: 403, headers: corsHeaders });
//   }

//   let connection;
//   try {
//     connection = await getConnection();
//     await connection.execute('DELETE FROM usuarios WHERE id = ?', [id]);
//     // Status 204 (No Content) é comum para DELETE, mas 200 com mensagem também funciona bem.
//     return NextResponse.json({ message: 'Usuário deletado com sucesso.' }, { status: 200, headers: corsHeaders });
//   } catch (error) {
//     console.error(`Erro ao deletar usuário ${id}:`, error);
//     return NextResponse.json({ message: 'Erro interno do servidor ao deletar usuário.' }, { status: 500, headers: corsHeaders });
//   } finally {
//     if (connection) connection.release();
//   }
// }

// ================================================================
// Handler para DELETE - Com a abordagem alternativa
// ================================================================
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