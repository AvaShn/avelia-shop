import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders an accessible button with the requested variant", () => {
    render(<Button variant="outline">مشاهده جزئیات</Button>);

    const button = screen.getByRole("button", { name: "مشاهده جزئیات" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveClass("border-border");
  });
});
