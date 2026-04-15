/// <reference types="node" />
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o plantio das contas raiz...");

  // Garantir que a empresa padrão exista
  const empresa = await prisma.empresa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nome: "Minha Empresa Real",
      isDemo: false,
    },
  });

  const empresaId = empresa.id;

  // Cria as contas raiz usando compound unique (codigo + empresaId)
  const ativo = await prisma.contaContabil.upsert({
    where: { codigo_empresaId: { codigo: "1", empresaId } },
    update: {},
    create: {
      codigo: "1",
      nome: "ATIVO",
      tipo: "Ativo",
      aceitaLancamento: false,
      empresaId,
    },
  });

  const passivo = await prisma.contaContabil.upsert({
    where: { codigo_empresaId: { codigo: "2", empresaId } },
    update: {},
    create: {
      codigo: "2",
      nome: "PASSIVO",
      tipo: "Passivo",
      aceitaLancamento: false,
      empresaId,
    },
  });

  const receitas = await prisma.contaContabil.upsert({
    where: { codigo_empresaId: { codigo: "3", empresaId } },
    update: {},
    create: {
      codigo: "3",
      nome: "RECEITAS",
      tipo: "Receita",
      aceitaLancamento: false,
      empresaId,
    },
  });

  const despesas = await prisma.contaContabil.upsert({
    where: { codigo_empresaId: { codigo: "4", empresaId } },
    update: {},
    create: {
      codigo: "4",
      nome: "DESPESAS",
      tipo: "Despesa",
      aceitaLancamento: false,
      empresaId,
    },
  });

  console.log("Plano de Contas basico criado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
