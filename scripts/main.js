class PlutoniumSpellTranslator {
  static translations = new Map();

  /**
   * Lê o arquivo de índice e carrega todos os arquivos de tradução em paralelo
   */
  static async init() {
    try {
      // 1. Carrega o arquivo de índice principal
      const indexRes = await fetch(
        "modules/Plutonium-Translator/lang/index.json",
      );
      const indexMap = await indexRes.json();

      // 2. Cria uma lista de requisições (fetches) para todos os arquivos apontados no índice
      const fetchPromises = indexMap.values().map(async (fileName) => {
        const fileRes = await fetch(
          `modules/Plutonium-Translator/lang/${fileName}`,
        );
        return await fileRes.json();
      });

      // 3. Aguarda o download de todos os arquivos de magias em paralelo
      const allFilesData = await Promise.all(fetchPromises);

      // 4. Une o conteúdo de todos os arquivos no mesmo Map de traduções
      allFilesData.forEach((fileContent) => {
        fileContent.entries().forEach(([key, value]) => {
          this.translations.set(key, value);
        });
      });

      console.log(
        `Tradutor Plutonium | ${this.translations.size} magias traduzidas carregadas a partir de ${allFilesData.length} arquivos!`,
      );
    } catch (err) {
      console.error(
        "Tradutor Plutonium | Erro ao carregar o índice ou arquivos de tradução:",
        err,
      );
    }
  }

  /**
   * Intercepta e traduz o item do Plutonium no preCreateItem
   */
  static translateItem(itemData) {
    if (itemData.type !== "spell") return;

    const source =
      itemData.system?.source?.custom ||
      itemData.system?.source?.value ||
      itemData.flags?.plutonium?.page ||
      "PHB";

    const englishName = itemData.name;
    const lookupKey = `${englishName}|${source}`;

    // Busca por "Nome|Fonte" ou por "Nome"
    const translation =
      this.translations.get(lookupKey) || this.translations.get(englishName);

    if (translation) {
      itemData.flags = itemData.flags || {};
      itemData.flags["Plutonium-Translator"] = {
        originalName: englishName,
        source: source,
      };

      if (translation.description) {
        if (itemData.system?.description) {
          itemData.system.description.value = translation.description;
        }
      }

      if (translation.name) {
        itemData.name = translation.name;
      }

      console.log(
        `Tradutor Plutonium | Magia '${englishName}' traduzida com sucesso!`,
      );
    }
  }
}
window.PlutoniumSpellTranslator = PlutoniumSpellTranslator;
// Hooks do Foundry VTT
Hooks.once("init", async () => {
  await PlutoniumSpellTranslator.init();

  Hooks.on("preCreateItem", (doc, _data, _options, _userId) => {
    PlutoniumSpellTranslator.translateItem(doc);
  });
});
