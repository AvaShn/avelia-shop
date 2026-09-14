const integerFormatters = new Map<number, Intl.NumberFormat>();

export function formatPersianInteger(value: number, minimumIntegerDigits = 1) {
  let formatter = integerFormatters.get(minimumIntegerDigits);

  if (!formatter) {
    formatter = new Intl.NumberFormat("fa-IR", {
      minimumIntegerDigits,
      maximumFractionDigits: 0,
      useGrouping: false,
    });
    integerFormatters.set(minimumIntegerDigits, formatter);
  }

  return formatter.format(value);
}
