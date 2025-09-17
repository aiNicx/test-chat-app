import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { cleanPDFText } from "../knowledgeActions";

describe("cleanPDFText", () => {
  it("mantiene la struttura dei paragrafi dopo la normalizzazione", () => {
    const rawText = [
      "INTRODUZIONE",
      "",
      "Sezione 1: Panoramica",
      "Questo    è    il    primo    paragrafo   con    spazi extra.",
      "Prosegue sulla riga successiva con   altri   spazi.",
      "",
      "",
      "Sezione 2: Dettagli",
      "Un altro paragrafo con testo rilevante.",
      "",
      "",
      "",
      "Conclusioni",
    ].join("\r\n");

    const cleaned = cleanPDFText(rawText);

    const expected = [
      "INTRODUZIONE",
      "",
      "Sezione 1: Panoramica",
      "Questo è il primo paragrafo con spazi extra.",
      "Prosegue sulla riga successiva con altri spazi.",
      "",
      "Sezione 2: Dettagli",
      "Un altro paragrafo con testo rilevante.",
      "",
      "Conclusioni",
    ].join("\n");

    assert.equal(cleaned, expected);
  });

  it("normalizza whitespace e newline senza perdere righe singole", () => {
    const rawText = "Prima riga\r\nSeconda    riga\r\n\r\n\r\nTerza riga con\tspazi\r\n  \r\nQuarta riga";

    const cleaned = cleanPDFText(rawText);

    assert.equal(
      cleaned,
      [
        "Prima riga",
        "Seconda riga",
        "",
        "Terza riga con spazi",
        "",
        "Quarta riga",
      ].join("\n"),
    );
    assert.equal(/\r/.test(cleaned), false);
    assert.equal(/\n{3,}/.test(cleaned), false);
  });
});
