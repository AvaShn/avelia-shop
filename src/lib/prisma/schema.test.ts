import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectPath = process.cwd();
const schema = readFileSync(
  join(projectPath, "prisma", "schema.prisma"),
  "utf8",
);
const migration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260915113500_initial_schema",
    "migration.sql",
  ),
  "utf8",
);

describe("Prisma database contract", () => {
  it.each(["User", "Category", "Product", "Order", "OrderItem", "Payment"])(
    "defines the %s model required by AVELIA",
    (model) => {
      expect(schema).toContain(`model ${model} {`);
    },
  );

  it("stores monetary values as bigint and enforces stock constraints", () => {
    expect(schema).toContain("priceRial          BigInt");
    expect(schema).toContain("totalPrice BigInt");
    expect(migration).toContain('"Product_priceRial_positive"');
    expect(migration).toContain('"Product_stock_nonnegative"');
    expect(migration).toContain('"OrderItem_quantity_positive"');
  });
});
