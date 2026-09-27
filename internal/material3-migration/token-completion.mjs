// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Token mapping and active contract. @output Shared verification/completion predicates and workbook formula. @position Disposable acceptance owner. */
const requirements = strategy => [
  ['Contract', 'N', strategy],
  ['Material token', 'B', null],
  ['Astryx candidate', 'D', null],
  ['Relationship', 'E', 'Confirmed'],
  ['Verification', 'F', 'Pass'],
  ['Evidence', 'G', null],
];
const approval = [
  ['Native QA', 'O', 'Approved'],
  ['Review', 'H', 'Approved'],
  ['Merged', 'P', 'Yes'],
];
export function tokenReady(row, strategy, complete = false) {
  return (
    !!row &&
    [...requirements(strategy), ...(complete ? approval : [])].every(
      ([key, , value]) =>
        value === null
          ? String(row[key] ?? '').trim() !== ''
          : row[key] === value,
    )
  );
}
export function tokenCompletionFormula(row, strategy) {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const conditions = [...requirements(strategy), ...approval].map(
    ([, column, value]) =>
      value === null
        ? `LEN(TRIM(${column}${row}))>0`
        : `${column}${row}=${quote(value)}`,
  );
  return `=IF(AND(${conditions.join(',')}),"Yes","No")`;
}
