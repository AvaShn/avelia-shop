# Product data entry

Prisma Studio displays `Product` as a horizontally scrollable database grid.
Always match the input cell with the header directly above it; the columns are
not shown in the same order as `schema.prisma`.

## Fields to leave on their database defaults

| Field         | Database type | Default             |
| ------------- | ------------- | ------------------- |
| `id`          | `text`        | generated UUID text |
| `createdAt`   | `timestamp`   | current time        |
| `updatedAt`   | `timestamp`   | current time        |
| `isOriginal`  | `bool`        | `true`              |
| `isFeatured`  | `bool`        | `false`             |
| `isPublished` | `bool`        | `true`              |
| `sortOrder`   | `int4`        | `0`                 |

`CartItem` and `OrderItem` are relation columns and are not filled when a
product is created.

## Fields to fill

| Field                | Database type | Required value                                                   |
| -------------------- | ------------- | ---------------------------------------------------------------- |
| `name`               | `text`        | Persian product name                                             |
| `slug`               | `text`        | unique lowercase English slug using letters, digits, and hyphens |
| `shortDescription`   | `text`        | short Persian card copy                                          |
| `description`        | `text`        | complete Persian description                                     |
| `brand`              | `text`        | brand name                                                       |
| `priceRial`          | `int8`        | positive whole rial amount divisible by 10                       |
| `compareAtPriceRial` | `int8`        | optional; greater than price and divisible by 10                 |
| `images`             | `text[]`      | one or more image paths; no JSON or alt text is required         |
| `keyFeatures`        | `text[]`      | non-empty PostgreSQL text array                                  |
| `usage`              | `text`        | Persian usage instructions                                       |
| `stock`              | `int4`        | zero or a positive integer                                       |
| `categoryId`         | `text`        | `makeup`, `skincare`, or `fragrance`                             |

Put local product images in `public/images/products`. WebP, JPG/JPEG, PNG, and
AVIF files can be used. Then add only their paths to the `images` array in
Prisma Studio, one item per image. Do not enter JSON and do not add `src` or
`alt` keys. The storefront generates accessible alt text from the product name.

Example images value in the Studio array editor:

```text
/images/products/example.webp
/images/products/example-detail.jpg
```

Example key features value in the Studio array editor:

```text
ویژگی اول
ویژگی دوم
```

Set `isPublished` to `true` for storefront visibility. Draft rows and rows with
`isPublished=false` remain visible in Studio but are intentionally excluded
from the product repository and public API.
