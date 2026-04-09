/**
 * Uso (raiz do projeto, com DATABASE_URL no .env):
 *   npx tsx scripts/strip-csv-prefix-from-asset-tags.ts
 *
 * Remove o prefixo "CSV-" do início de `tag_patrimonio` nos ativos que o tiverem.
 * Em colisão de unicidade, acrescenta um sufixo numérico.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function stripLeadingCsvPrefix(tag: string): string {
  return tag.replace(/^CSV-/i, "").trim();
}

async function main() {
  const allTags = await prisma.asset.findMany({
    select: { id: true, tagPatrimonio: true },
    orderBy: { id: "asc" },
  });
  const assets = allTags.filter((a) => /^csv-/i.test(a.tagPatrimonio));

  if (assets.length === 0) {
    console.log("Nenhum ativo com tag começando em CSV-.");
    return;
  }

  let updated = 0;
  for (const a of assets) {
    const next = stripLeadingCsvPrefix(a.tagPatrimonio);
    if (!next || next === a.tagPatrimonio) continue;

    let candidate = next;
    let n = 0;
    for (;;) {
      const clash = await prisma.asset.findFirst({
        where: {
          tagPatrimonio: candidate,
          NOT: { id: a.id },
        },
        select: { id: true },
      });
      if (!clash) break;
      n += 1;
      candidate = `${next}-${n}`;
    }

    await prisma.asset.update({
      where: { id: a.id },
      data: { tagPatrimonio: candidate },
    });
    updated += 1;
    console.log(`${a.tagPatrimonio} → ${candidate}`);
  }

  console.log(`Concluído: ${updated} registro(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
