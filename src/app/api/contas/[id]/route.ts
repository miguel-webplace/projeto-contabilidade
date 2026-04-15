export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmpresaId } from "@/lib/auth-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const empresaId = getEmpresaId(request);
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalido." },
        { status: 400 },
      );
    }

    const conta = await prisma.contaContabil.findUnique({
      where: { id, empresaId },
    });

    if (!conta) {
      return NextResponse.json(
        {
          success: false,
          error: "Conta nao encontrada ou não pertence a esta empresa.",
        },
        { status: 404 },
      );
    }

    if (["1", "2", "3", "4"].includes(conta.codigo)) {
      return NextResponse.json(
        {
          success: false,
          error: "Nao e possivel excluir contas raiz do sistema.",
        },
        { status: 403 },
      );
    }

    const childCount = await prisma.contaContabil.count({
      where: { contaPaiId: id, empresaId },
    });

    if (childCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Conta possui subcontas.",
        },
        { status: 400 },
      );
    }

    const movementCount = await prisma.movimentacaoItem.count({
      where: { contaId: id },
    });

    if (movementCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Conta possui lançamentos.",
        },
        { status: 400 },
      );
    }

    await prisma.contaContabil.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Conta excluida com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno." },
      { status: 500 },
    );
  }
}
