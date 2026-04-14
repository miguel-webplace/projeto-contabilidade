import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const contas = await prisma.contaContabil.findMany({
      orderBy: {
        codigo: 'asc'
      },
      include: {
        contasFilhas: true
      }
    });

    // Para o front-end facilitar a renderização, podemos retornar a estrutura flat 
    // ou montar uma árvore recursiva. O roadmap sugere popular dropdowns.
    return NextResponse.json({ success: true, data: contas });
  } catch (error) {
    console.error("Erro ao buscar contas:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar o plano de contas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, nome, tipo, aceitaLancamento, contaPaiId } = body;

    if (!codigo || !nome || !tipo) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios (codigo, nome, tipo) não preenchidos." },
        { status: 400 }
      );
    }

    const newConta = await prisma.contaContabil.create({
      data: {
        codigo,
        nome,
        tipo,
        aceitaLancamento: aceitaLancamento ?? false,
        contaPaiId: contaPaiId ? Number(contaPaiId) : null,
      }
    });

    return NextResponse.json({ success: true, data: newConta }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao criar conta:", error);
    
    // Tratamento de erro único de código
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code: string }).code === 'P2002') {
        return NextResponse.json(
          { success: false, error: "Uma conta com este código já existe." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Erro interno ao criar a conta contábil." },
      { status: 500 }
    );
  }
}
