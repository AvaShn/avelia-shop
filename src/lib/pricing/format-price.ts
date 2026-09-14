import { numberToWords } from "@persian-tools/persian-tools";

const rialFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

export type FormattedPrice = {
  rial: string;
  tomanWords: string;
};

export function formatPriceRial(value: number | bigint): FormattedPrice {
  const rial = typeof value === "bigint" ? value : BigInt(value);

  if (rial < 0n) {
    throw new RangeError("Price cannot be negative.");
  }

  if (rial % 10n !== 0n) {
    throw new RangeError(
      "Rial price must be divisible by ten for toman display.",
    );
  }

  const toman = rial / 10n;
  const tomanInWords = numberToWords(toman.toString());

  if (tomanInWords instanceof TypeError) {
    throw tomanInWords;
  }

  return {
    rial: `${rialFormatter.format(rial)} ریال`,
    tomanWords: `${tomanInWords} تومان`,
  };
}
