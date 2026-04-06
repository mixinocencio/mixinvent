import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.assetLog.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.consumable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();

  const ti = await prisma.department.create({
    data: { nome: "Tecnologia da Informação", localizacao: "Ribeirão Preto" },
  });

  const catNotebook = await prisma.category.create({
    data: { nome: "Notebook", tipo: "PATRIMONIO" },
  });
  await prisma.category.create({ data: { nome: "Desktop", tipo: "PATRIMONIO" } });

  await prisma.user.create({
    data: {
      nome: "Pamela",
      email: "pamela@empresa.com.br",
      samAccountName: "pamela.infra",
      cargo: "Assistente de Infraestrutura",
      departamentoId: ti.id,
      licencasO365: "O365_BUSINESS_PREMIUM, FLOW_FREE",
      status: "ATIVO",
    },
  });

  await prisma.asset.create({
    data: {
      tagPatrimonio: "10026200",
      hostname: "RPO-EBSDNBTI001",
      marca: "Dell Inc.",
      modelo: "Latitude 3540",
      sistemaOperacional: "Windows 11 Pro",
      statusAntivirus: "Protected",
      categoryId: catNotebook.id,
      status: "DISPONIVEL",
    },
  });

  console.log("Seed executado: Banco alimentado com dados de Infraestrutura!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
