import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectPath = process.cwd();
const schema = readFileSync(
  join(projectPath, "prisma", "schema.prisma"),
  "utf8",
);
const initialMigration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260915113500_initial_schema",
    "migration.sql",
  ),
  "utf8",
);
const cartCheckoutMigration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260916090000_phase_6_cart_checkout_foundation",
    "migration.sql",
  ),
  "utf8",
);
const apiSecurityMigration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260916120000_phase_7_api_security",
    "migration.sql",
  ),
  "utf8",
);
const productDataIntegrityMigration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260916170000_product_data_integrity",
    "migration.sql",
  ),
  "utf8",
);
const productImagePathsMigration = readFileSync(
  join(
    projectPath,
    "prisma",
    "migrations",
    "20260916180000_product_image_paths",
    "migration.sql",
  ),
  "utf8",
);
const migrations = `${initialMigration}\n${cartCheckoutMigration}\n${apiSecurityMigration}\n${productDataIntegrityMigration}\n${productImagePathsMigration}`;

describe("Prisma database contract", () => {
  it.each([
    "User",
    "Category",
    "Product",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "Payment",
    "ApiRateLimit",
  ])("defines the %s model required by AVELIA", (model) => {
    expect(schema).toContain(`model ${model} {`);
  });

  it("uses a shared persistent rate-limit model for serverless API instances", () => {
    expect(schema).toContain("model ApiRateLimit {");
    expect(schema).toContain("@@id([scope, keyHash, windowStart])");
    expect(apiSecurityMigration).toContain('CREATE TABLE "ApiRateLimit"');
  });

  it("stores monetary values as bigint and enforces stock constraints", () => {
    expect(schema).toContain("priceRial          BigInt");
    expect(schema).toContain("totalPriceRial");
    expect(schema).toContain("unitPriceRial");
    expect(migrations).toContain('"Product_priceRial_positive"');
    expect(migrations).toContain('"Product_stock_nonnegative"');
    expect(migrations).toContain('"OrderItem_quantity_positive"');
    expect(migrations).toContain('"CartItem_quantity_positive"');
    expect(migrations).toContain('"Product_priceRial_toman_compatible"');
    expect(migrations).toContain(
      '"Product_compareAtPriceRial_toman_compatible"',
    );
  });

  it("protects direct product entry from incomplete storefront records", () => {
    expect(schema).toContain(
      'id                 String      @id @default(dbgenerated("gen_random_uuid()::text"))',
    );
    expect(schema).toContain(
      "updatedAt          DateTime    @default(now()) @updatedAt",
    );
    expect(productDataIntegrityMigration).toContain('"Product_slug_format"');
    expect(schema).toContain("images             String[]");
    expect(productImagePathsMigration).toContain(
      'DROP CONSTRAINT "Product_images_nonempty_array"',
    );
    expect(productImagePathsMigration).toContain(
      'ALTER COLUMN "images" TYPE TEXT[]',
    );
    expect(productImagePathsMigration).toContain('"Product_images_nonempty"');
    expect(productDataIntegrityMigration).toContain(
      '"Product_keyFeatures_nonempty"',
    );
  });

  it("defines exact order and payment states", () => {
    expect(schema).toMatch(
      /enum OrderStatus \{\s+PENDING_PAYMENT\s+WAITING_REVIEW\s+PAID\s+REJECTED\s+\}/,
    );
    expect(schema).toMatch(
      /enum PaymentStatus \{\s+PENDING\s+UNDER_REVIEW\s+APPROVED\s+REJECTED\s+\}/,
    );
  });

  it("protects public lookups, checkout retries, and private receipts", () => {
    expect(schema).toContain("publicToken");
    expect(schema).toContain("checkoutIdempotencyKeyHash");
    expect(schema).toContain("paymentSessionTokenHash");
    expect(schema).toContain("providerUpdateId");
    expect(schema).toContain("receiptObjectKey");
    expect(schema).not.toContain("receiptImage");
  });

  it("tracks inventory reservation lifecycle and review audit data", () => {
    expect(schema).toContain("inventoryReservationExpiresAt");
    expect(schema).toContain("inventoryCommittedAt");
    expect(schema).toContain("inventoryReleasedAt");
    expect(schema).toContain("reviewedAt");
    expect(schema).toContain("reviewedBy");
    expect(schema).toContain("reviewNote");
    expect(schema).toMatch(
      /model OrderItem \{[\s\S]*createdAt\s+DateTime @default\(now\(\)\)[\s\S]*updatedAt\s+DateTime @updatedAt/,
    );
  });
});
