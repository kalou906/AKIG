import Papa from "papaparse";

export function importTransactions(file, onComplete) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      onComplete?.(results.data);
    },
  });
}
