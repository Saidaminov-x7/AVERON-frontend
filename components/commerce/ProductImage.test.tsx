import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductImage } from "./ProductImage";

vi.mock("next/image", () => ({
  default: ({ unoptimized, ...props }: React.ComponentProps<"img"> & { unoptimized?: boolean }) => (
    <img {...props} data-unoptimized={unoptimized ? "true" : undefined} />
  ),
}));

describe("ProductImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("optimizes same-origin rewritten backend uploads and allowlisted media hosts", () => {
    const { rerender } = render(
      <ProductImage src="/api/backend/uploads/product.jpg" alt="Coat" sizes="240px" />,
    );
    expect(screen.getByRole("img", { name: "Coat" })).toHaveAttribute("sizes", "240px");
    expect(screen.getByRole("img", { name: "Coat" })).not.toHaveAttribute("data-unoptimized");

    rerender(<ProductImage src="https://averon.uz/uploads/product.jpg" alt="Coat" />);
    expect(screen.getByRole("img", { name: "Coat" })).not.toHaveAttribute("data-unoptimized");
  });

  it("normalizes relative and exact API-origin uploads before rendering", () => {
    const { rerender } = render(<ProductImage src="/uploads/coat.jpg" alt="Coat" />);
    expect(screen.getByRole("img", { name: "Coat" })).toHaveAttribute(
      "src",
      "/api/backend/uploads/coat.jpg",
    );

    rerender(<ProductImage src="http://127.0.0.1:8080/uploads/coat.jpg?width=800" alt="Coat" />);
    expect(screen.getByRole("img", { name: "Coat" })).toHaveAttribute(
      "src",
      "/api/backend/uploads/coat.jpg?width=800",
    );
  });

  it("keeps arbitrary supplier image URLs direct and preserves the error fallback", () => {
    const onError = vi.fn();
    render(
      <ProductImage src="https://supplier.example/product.jpg" alt="Supplier coat" onError={onError} />,
    );

    const image = screen.getByRole("img", { name: "Supplier coat" });
    expect(image).toHaveAttribute("src", "https://supplier.example/product.jpg");
    expect(image).toHaveAttribute("data-unoptimized", "true");
    fireEvent.error(image);

    expect(onError).toHaveBeenCalledOnce();
    expect(screen.queryByRole("img", { name: "Supplier coat" })).toBeNull();
    expect(screen.getByText("AVERON")).toBeInTheDocument();
    expect(screen.getByText("AVERON").parentElement).toHaveClass("text-ink");
  });
});
