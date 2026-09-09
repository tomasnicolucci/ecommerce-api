import { describe, expect, it } from "vitest";
import { Category } from "../../../modules/catalog/domain/entities/category.js";

describe("Category", () => {
  it("should create a category", () => {
    const category = Category.create({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    expect(category.id).toBeNull();
    expect(category.name).toBe("Technology");
    expect(category.slug).toBe("technology");
    expect(category.parentId).toBeNull();
    expect(category.active).toBe(true);
  });

  it("should not create a category with an empty name", () => {
    expect(() =>
      Category.create({
        name: "",
        slug: "technology",
        parentId: null,
        attributes: [],
        active: true
      })
    ).toThrow("Category name is required");
  });

  it("should not create a category with an empty slug", () => {
    expect(() =>
      Category.create({
        name: "Technology",
        slug: "",
        parentId: null,
        attributes: [],
        active: true
      })
    ).toThrow("Category slug is required");
  });

  it("should rename a category", () => {
    const category = Category.create({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    category.rename("Electronics");

    expect(category.name).toBe("Electronics");
  });

  it("should change the slug", () => {
    const category = Category.create({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    category.changeSlug("electronics");

    expect(category.slug).toBe("electronics");
  });

  it("should deactivate and activate a category", () => {
    const category = Category.create({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    category.deactivate();

    expect(category.active).toBe(false);

    category.activate();

    expect(category.active).toBe(true);
  });

  it("should change category attributes", () => {
    const category = Category.create({
      name: "Laptops",
      slug: "laptops",
      parentId: null,
      attributes: [],
      active: true
    });

    category.changeAttributes([
      {
        name: "processor",
        type: "string",
        scope: "product",
        required: true
      },
      {
        name: "ram",
        type: "select",
        scope: "variant",
        required: true,
        options: ["8GB", "16GB", "32GB"]
      }
    ]);

    expect(category.attributes).toEqual([
      {
        name: "processor",
        type: "string",
        scope: "product",
        required: true
      },
      {
        name: "ram",
        type: "select",
        scope: "variant",
        required: true,
        options: ["8GB", "16GB", "32GB"]
      }
    ]);
  });

  it("should not allow a category to be its own parent", () => {
    const category = Category.restore("category-1", {
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    expect(() =>
      category.changeParent("category-1")
    ).toThrow("Category cannot be its own parent");
  });
});