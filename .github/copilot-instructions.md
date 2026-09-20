# Copilot instructions

## Project overview

This repository is a Foundry VTT module named `Plutonium-Translator`. It translates spell names and descriptions imported by the Plutonium module into Brazilian Portuguese. The module targets Foundry VTT version 11 or newer and is verified through version 12; it requires the `plutonium` module.

The runtime entry point is `scripts/main.js`:

1. On Foundry's `init` hook, it fetches `lang/index.json`.
2. Each value in the index is treated as a JSON filename under `lang/` and fetched in parallel.
3. Every entry from those files is merged into the static `PlutoniumSpellTranslator.translations` `Map`.
4. A `preCreateItem` hook checks only spell documents and looks up a translation by `English Name|Source`, then by English name alone.
5. When a match exists, the hook stores the original name/source in `flags["Plutonium-Translator"]`, replaces `name`, and replaces `system.description.value` when a translated description is present.

Only files referenced by `lang/index.json` are loaded at runtime. Adding a translation file is incomplete until its filename is added to that index.

## Commands and validation

There is no package manifest, build script, automated test suite, or configured linter in this repository. Use PowerShell from the repository root for the available validation:

```powershell
# Parse every JSON file and fail on malformed JSON
Get-ChildItem -Recurse -Filter *.json | ForEach-Object {
  Get-Content -Raw $_.FullName | ConvertFrom-Json | Out-Null
}

# Validate one changed JSON file
Get-Content -Raw .\lang\cantrips.json | ConvertFrom-Json | Out-Null
```

There is no single-test command. For a focused change, validate the changed JSON file with the second command and inspect the corresponding index entry and translation key; runtime behavior must be checked in a Foundry world with Plutonium enabled.

## Data and implementation conventions

- Keep the module ID and asset paths consistent with `Plutonium-Translator`. The runtime uses the absolute Foundry asset prefix `modules/Plutonium-Translator/lang/...`; changing the module ID or directory layout requires updating all related paths.
- `lang/index.json` is an object whose values are filenames, for example `"cantrips": "cantrips.json"`. Keep every runtime translation file listed there.
- Translation JSON is an object. Keys normally use `English Name|Source` (for example, `Acid Splash|XPHB`); a bare English-name key is supported as a fallback but can be ambiguous across sources.
- Each value may contain `name` and/or `description`. Descriptions are HTML strings intended for Foundry and may contain Plutonium/Foundry inline syntax such as `@variantrule[...]`, `[[/damage ...]]`, and `[[/r ...]]`; preserve that syntax while translating surrounding prose.
- Source identifiers are part of lookup behavior. Preserve the source suffix used by the imported Plutonium item (`XPHB`, `EGW`, and similar) rather than normalizing or translating it.
- Spell-only behavior is intentional: `translateItem` returns for any item whose `type` is not `"spell"`. Keep optional chaining and the existing source fallback order when adapting lookup logic.
- The module relies on Foundry hooks and mutates the document during `preCreateItem`; keep initialization in the one-time `init` hook and register the item hook only after translations finish loading.
- Runtime failures are reported through the existing `console.error` message. New loading or lookup errors should remain visible rather than being silently ignored.
