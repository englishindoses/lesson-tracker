# Font licences

The fonts in `src/fonts/` are bundled with the app so it keeps its typography
offline. They were downloaded unmodified from Google Fonts by
`scripts/fetch-fonts.mjs`.

**All seven are under the SIL Open Font License 1.1.** Verified against the
`google/fonts` repository, where a font's licence is determined by the directory
it lives in; all seven are under `ofl/`. Full text for each is in
`src/fonts/licences/`, downloaded by `scripts/fetch-font-licences.mjs`.

| Font | Used by | Copyright |
|---|---|---|
| Quicksand | Minimalist — headings | The Quicksand Project Authors. Reserved Font Name: Quicksand |
| Inter | Minimalist — body | The Inter Project Authors |
| Sacramento | Cozy — headings | Brian J. Bonislawsky / Astigmatic. Reserved Font Name: Sacramento |
| Amatic SC | Cozy — accents; Whimsical — headings | The Amatic SC Project Authors |
| Caveat | Cozy — body | The Caveat Project Authors |
| Indie Flower | Whimsical — accents | The Indie Flower Authors (Kimberly Geswein) |
| Patrick Hand | Whimsical — body | Patrick Wagesreiter |

## What the OFL allows

- Bundling the fonts in an application, **including one you sell**. There is no
  fee, no attribution requirement in the user interface, and no obligation to
  open-source the app itself.
- Redistribution, as long as the licence text goes with the fonts — which is why
  `src/fonts/licences/` exists and should not be deleted.

## What it does not allow

- Selling the fonts on their own, as fonts.
- Releasing a **modified** version of Quicksand or Sacramento under those names.
  Both carry a Reserved Font Name, so a modified copy would need renaming. This
  only matters if the font files themselves are edited; using them as they are
  is unaffected.

To re-download: `node scripts/fetch-fonts.mjs` and
`node scripts/fetch-font-licences.mjs`.
