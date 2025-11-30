import type { JsonSchema } from "./interfaces";

/**
 * Utility for generating and manipulating JSON schemas.
 */

// biome-ignore lint/complexity/noStaticOnlyClass: <Technical debt>
export class SchemaGenerator {
  /**
   * Creates a string representation of a schema for LLM prompts.
   * @param schema The JSON schema object.
   * @returns A string description of the schema.
   */
  static toPromptString(schema: JsonSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Validates if an object roughly matches the schema structure.
   * Note: This is a basic validation and not a full JSON Schema validator.
   * @param data The data to validate.
   * @param schema The schema to validate against.
   * @returns True if valid, throws error if invalid.
   */
  
// biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
static  validate(data: any, schema: JsonSchema): boolean {
    if (schema.type === "object" && schema.properties) {
      if (typeof data !== "object" || data === null) {
        throw new Error(`Expected object, got ${typeof data}`);
      }

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in data)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      }

      // Check property types (recursive)
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          SchemaGenerator.validate(data[key], propSchema);
        }
      }
    } else if (schema.type === "array" && schema.items) {
      if (!Array.isArray(data)) {
        throw new Error(`Expected array, got ${typeof data}`);
      }
      for (const item of data) {
        SchemaGenerator.validate(item, schema.items);
      }
    } else if (schema.type === "string") {
      if (typeof data !== "string") {
        throw new Error(`Expected string, got ${typeof data}`);
      }
    } else if (schema.type === "number" || schema.type === "integer") {
      if (typeof data !== "number") {
        throw new Error(`Expected number, got ${typeof data}`);
      }
    } else if (schema.type === "boolean") {
      if (typeof data !== "boolean") {
        throw new Error(`Expected boolean, got ${typeof data}`);
      }
    }

    return true;
  }

  /**
   * Helper to create a simple object schema.
   */
  static createObject(
    properties: Record<string, JsonSchema>,
    required?: string[]
  ): JsonSchema {
    return {
      type: "object",
      properties,
      required,
    };
  }

  /**
   * Helper to create an array schema.
   */
  static createArray(itemSchema: JsonSchema): JsonSchema {
    return {
      type: "array",
      items: itemSchema,
    };
  }
}
