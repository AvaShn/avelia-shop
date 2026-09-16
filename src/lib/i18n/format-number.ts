const integerFormatters = new Map<number, Intl.NumberFormat>();
const latinDigits = "0123456789";
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toPersianDigits(value: string | number) {
  return String(value).replace(/[0-9]/g, (digit) => {
    const index = latinDigits.indexOf(digit);
    return index >= 0 ? persianDigits[index]! : digit;
  });
}

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
