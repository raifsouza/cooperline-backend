// src/app/api/labels/route.ts
import { NextResponse } from 'next/server';
import { getAllLabels } from '../../services/labelService';// Verifique este caminho relativo!

console.log('API Route labels/route.ts loaded'); // Add this

export async function GET(request: Request) {
  console.log('GET request received for /api/labels'); // Add this
  try {
    const labels = await getAllLabels();
    console.log('Labels fetched successfully:', labels.length); // Add this
    return NextResponse.json(labels, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao buscar etiquetas do banco de dados MySQL:', error);
    return NextResponse.json(
      { message: 'Falha ao carregar etiquetas do banco de dados.', details: error.message },
      { status: 500 }
    );
  }
}