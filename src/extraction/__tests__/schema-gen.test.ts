import { describe, expect, it } from "vitest";
import type { JsonSchema } from "../interfaces";
import { SchemaGenerator } from "../schema-gen";

describe("SchemaGenerator", () => {
  const schema: JsonSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
    },
    required: ["name"],
  };

  it("should validate correct data", () => {
    const data = { name: "John", age: 30 };
    expect(SchemaGenerator.validate(data, schema)).toBe(true);
  });

  it("should fail on missing required field", () => {
    const data = { age: 30 };
    expect(() => SchemaGenerator.validate(data, schema)).toThrow(
      "Missing required field: name"
    );
  });

  it("should fail on incorrect type", () => {
    const data = { name: "John", age: "30" };
    expect(() => SchemaGenerator.validate(data, schema)).toThrow(
      "Expected number, got string"
    );
  });

  it("should generate prompt string", () => {
    const str = SchemaGenerator.toPromptString(schema);
    expect(str).toContain('"name":');
    expect(str).toContain('"type": "string"');
  });

  it("should create object schema helper", () => {
    const s = SchemaGenerator.createObject(
      {
        field: { type: "string" },
      },
      ["field"]
    );

    expect(s.type).toBe("object");
    expect(s.required).toContain("field");
  });

  it("should create array schema helper", () => {
    const s = SchemaGenerator.createArray({ type: "string" });
    expect(s.type).toBe("array");
    expect(s.items?.type).toBe("string");
  });
});
