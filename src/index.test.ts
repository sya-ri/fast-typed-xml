import { expect } from "vitest";
import { tx } from "./index";
import {
    BooleanAttributeSchema,
    BooleanElementSchema,
    NumberAttributeSchema,
    NumberElementSchema,
    RequiredSchema,
    StringAttributeSchema,
    StringElementSchema,
} from "./schema";

describe("tx.string", () => {
    it("should return StringAttributeSchema when optional is true", () => {
        const schema = tx.string("attribute", "NAME", true);
        expect(schema instanceof StringAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping StringAttributeSchema when optional is false", () => {
        const schema = tx.string("attribute", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<string>).schema;
        expect(base instanceof StringAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });

    it("should return StringElementSchema when optional is true", () => {
        const schema = tx.string("element", "NAME", true);
        expect(schema instanceof StringElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping StringElementSchema when optional is false", () => {
        const schema = tx.string("element", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<string>).schema;
        expect(base instanceof StringElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });
});

describe("tx.number", () => {
    it("should return NumberAttributeSchema when optional is true", () => {
        const schema = tx.number("attribute", "NAME", true);
        expect(schema instanceof NumberAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping NumberAttributeSchema when optional is false", () => {
        const schema = tx.number("attribute", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<number>).schema;
        expect(base instanceof NumberAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });

    it("should return NumberElementSchema when optional is true", () => {
        const schema = tx.number("element", "NAME", true);
        expect(schema instanceof NumberElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping NumberElementSchema when optional is false", () => {
        const schema = tx.number("element", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<number>).schema;
        expect(base instanceof NumberElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });
});

describe("tx.boolean", () => {
    it("should return BooleanAttributeSchema when optional is true", () => {
        const schema = tx.boolean("attribute", "NAME", true);
        expect(schema instanceof BooleanAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping BooleanAttributeSchema when optional is false", () => {
        const schema = tx.boolean("attribute", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<boolean>).schema;
        expect(base instanceof BooleanAttributeSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });

    it("should return BooleanElementSchema when optional is true", () => {
        const schema = tx.boolean("element", "NAME", true);
        expect(schema instanceof BooleanElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(schema.name).toBe("NAME");
    });

    it("should return RequiredSchema wrapping BooleanElementSchema when optional is false", () => {
        const schema = tx.boolean("element", "NAME", false);
        // noinspection SuspiciousTypeOfGuard
        expect(schema instanceof RequiredSchema).toBe(true);
        // @ts-expect-error schema is private
        const base = (schema as RequiredSchema<boolean>).schema;
        expect(base instanceof BooleanElementSchema).toBe(true);
        // @ts-expect-error name is private
        expect(base.name).toBe("NAME");
    });
});
