import { beforeEach, describe, expect, it } from "vitest";
import { CreateCategory } from "../../../modules/catalog/application/use-cases/create-category.js";
import { Category } from "../../../modules/catalog/domain/entities/category.js";
import { InMemoryCategoryRepository } from "../../helpers/in-memory-category-repository.js";

describe("CreateCategory", () => {
  let repository: InMemoryCategoryRepository;
  let createCategory: CreateCategory;

  beforeEach(() => {
    repository = new InMemoryCategoryRepository();
    createCategory = new CreateCategory(repository);
  });

  it("should create a category", async () => {
    const category = await createCategory.execute({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: []
    });

    expect(category.id).not.toBeNull();
    expect(category.name).toBe("Technology");
    expect(category.slug).toBe("technology");
    expect(repository.categories).toHaveLength(1);
  });

  it("should create a category with product and variant attributes", async () => {
    const category = await createCategory.execute({
      name: "Laptops",
      slug: "laptops",
      parentId: null,
      attributes: [
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
      ]
    });

    expect(category.attributes).toHaveLength(2);
    expect(category.attributes[0]?.scope).toBe("product");
    expect(category.attributes[1]?.scope).toBe("variant");
  });

  it("should not create a category with an existing slug", async () => {
    await createCategory.execute({
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: []
    });

    await expect(
      createCategory.execute({
        name: "Other Technology",
        slug: "technology",
        parentId: null,
        attributes: []
      })
    ).rejects.toThrow("Category slug already exists");

    expect(repository.categories).toHaveLength(1);
  });

  it("should not create a category with a non-existing parent", async () => {
    await expect(
      createCategory.execute({
        name: "Laptops",
        slug: "laptops",
        parentId: "non-existing-category",
        attributes: []
      })
    ).rejects.toThrow("Parent category not found");
  });

  it("should create a category with an existing parent", async () => {
    const parent = Category.restore("technology-id", {
      name: "Technology",
      slug: "technology",
      parentId: null,
      attributes: [],
      active: true
    });

    repository.categories.push(parent);

    const category = await createCategory.execute({
      name: "Laptops",
      slug: "laptops",
      parentId: parent.id,
      attributes: [
        {
          name: "processor",
          type: "string",
          scope: "product",
          required: true
        }
      ]
    });

    expect(category.parentId).toBe("technology-id");
    expect(repository.categories).toHaveLength(2);
  });
});