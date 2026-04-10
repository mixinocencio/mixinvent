import { OrigemEntrada, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.assetLog.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.consumable.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deviceModel.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.stockType.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      nome: "Empresa demonstração",
      cnpj: "11222333000181",
      emailContato: "contato@empresa-demo.com.br",
      telefone: "(16) 3333-4444",
      cep: "01310100",
      rua: "Avenida Paulista",
      numero: "1000",
      complemento: "Conj. 101",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    },
  });

  const ti = await prisma.department.create({
    data: {
      nome: "Tecnologia da Informação",
      localizacao: "Ribeirão Preto",
      centroCusto: "CC-5000-TI",
    },
  });

  const catNotebook = await prisma.category.create({
    data: { nome: "Notebook", tipo: "PATRIMONIO" },
  });
  await prisma.category.create({ data: { nome: "Desktop", tipo: "PATRIMONIO" } });
  const catInsumoPerifericos = await prisma.category.create({
    data: { nome: "Periféricos", tipo: "INSUMO" },
  });
  await prisma.consumable.create({
    data: {
      nome: "Cabo HDMI 2 m",
      categoryId: catInsumoPerifericos.id,
      quantidadeEstoque: 25,
      estoqueMinimo: 5,
    },
  });

  const brandDell = await prisma.brand.create({
    data: {
      nome: "Dell Inc.",
      site: "https://www.dell.com",
      telefoneSuporte: "0800-721-7754",
      emailSuporte: "suporte@dell.com",
    },
  });
  const modelLatitude = await prisma.deviceModel.create({
    data: {
      nome: "Latitude 3540",
      brandId: brandDell.id,
      partNumber: "LAT3540-I5-16G",
      mesesGarantia: 36,
      mesesDepreciacao: 60,
      isSerialized: true,
    },
  });
  const stockPatrimonio = await prisma.stockType.create({
    data: { nome: "Patrimônio corporativo" },
  });

  await prisma.user.create({
    data: {
      nome: "Pamela",
      email: "pamela@empresa.com.br",
      samAccountName: "pamela.infra",
      userPrincipalName: "pamela.infra@empresa.corp",
      cargo: "Assistente de Infraestrutura",
      telefone: "11999990000",
      cidade: "São Paulo",
      estado: "SP",
      departamentoId: ti.id,
      companyId: company.id,
      licencasO365: "O365_BUSINESS_PREMIUM, FLOW_FREE",
      status: "ATIVO",
    },
  });

  await prisma.asset.create({
    data: {
      tagPatrimonio: "10026200",
      origem: OrigemEntrada.IMPORTACAO_INICIAL,
      hostname: "RPO-EBSDNBTI001",
      sistemaOperacional: "Windows 11 Pro",
      statusAntivirus: "Protected",
      categoryId: catNotebook.id,
      companyId: company.id,
      status: "DISPONIVEL",
      brandId: brandDell.id,
      modelId: modelLatitude.id,
      stockTypeId: stockPatrimonio.id,
    },
  });

  console.log("Seed executado: Banco alimentado com dados de Infraestrutura!");
  console.log(
    "Dica EBEG: crie o administrador mestre com Argon2 via `npm run db:seed-admin` (veja .env.example).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
