// Pirâmide invertida pela tabela NCT da numerologia cabalística brasileira.
(() => {
  'use strict';

  const groups = ['AIQJY', 'BKR', 'CGLS', 'DMT', 'EHN', 'UVW', 'OZ', 'FP'];
  const values = Object.fromEntries(groups.flatMap((group, index) => [...group].map(letter => [letter, index + 1])));
  const reduce = value => value > 9 ? Math.floor(value / 10) + value % 10 : value;

  function build(name) {
    const letters = [...String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()].filter(letter => values[letter]);
    if (letters.length < 2) return null;
    const rows = [letters.map(letter => values[letter])];
    while (rows.at(-1).length > 1) {
      const previous = rows.at(-1);
      rows.push(previous.slice(0, -1).map((value, index) => reduce(value + previous[index + 1])));
    }
    const runs = [];
    rows.forEach((row, rowIndex) => {
      for (let start = 0; start < row.length;) {
        let end = start + 1;
        while (end < row.length && row[end] === row[start]) end++;
        if (end - start >= 3) runs.push({ value: row[start], length: end - start, row: rowIndex + 1, start });
        start = end;
      }
    });
    return { letters, rows, final: rows.at(-1)[0], runs };
  }

  window.CODIGO4_PYRAMID = { build };
})();
