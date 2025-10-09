import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import * as tx from "./index";
import {
    AttributeSchema,
    booleanValueSchema,
    ElementSchema,
    numberValueSchema,
    stringValueSchema,
} from "./schema";

describe.each([
    [
        tx.string,
        [
            ["attribute", AttributeSchema, undefined],
            ["element", ElementSchema, stringValueSchema],
        ],
    ],
    [
        tx.number,
        [
            ["attribute", AttributeSchema, undefined],
            ["element", ElementSchema, numberValueSchema],
        ],
    ],
    [
        tx.boolean,
        [
            ["attribute", AttributeSchema, undefined],
            ["element", ElementSchema, booleanValueSchema],
        ],
    ],
] as const)("%o", (fn, cases) => {
    // @ts-expect-error
    describe.each(cases)("%s -> %o", (kind, clazz, innerSchema) => {
        it("should return schema", () => {
            const optional = faker.datatype.boolean();

            // @ts-expect-error
            const actual = fn("NAME", kind, optional);

            expect(actual instanceof clazz).toBe(true);
            // @ts-expect-error name is private
            expect(actual.name).toBe("NAME");
            // @ts-expect-error optional is private
            expect(actual.optional).toBe(optional);
            // @ts-expect-error schema is private
            expect(actual.schema).toBe(innerSchema);
        });
    });
});

describe("tx.string", () => {
    it("should parse string from an attribute", async () => {
        const schema = tx.string("NAME", "attribute");
        const actual = await schema.parse("<root NAME='test'/>");
        expect(actual).toBe("test");
    });

    it("should parse optional string when missing", async () => {
        const schema = tx.string("VALUE", "attribute", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should parse string from an element", async () => {
        const schema = tx.string("VALUE", "element");
        const actual = await schema.parse("<root><VALUE>test</VALUE></root>");
        expect(actual).toBe("test");
    });

    it("should parse optional string when missing", async () => {
        const schema = tx.string("VALUE", "element", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should handle empty string values", async () => {
        const schema = tx.string("VALUE", "element");
        const actual = await schema.parse("<root><VALUE></VALUE></root>");
        expect(actual).toBe("");
    });

    it("should handle whitespace-only string values", async () => {
        const schema = tx.string("VALUE", "element");
        const actual = await schema.parse("<root><VALUE>   </VALUE></root>");
        expect(actual).toBe("   ");
    });

    it("should keep special characters escaped in string values", async () => {
        const schema = tx.string("VALUE", "element");
        const actual = await schema.parse(
            "<root><VALUE>&lt;test&gt;</VALUE></root>",
        );
        expect(actual).toBe("&lt;test&gt;");
    });

    it("should throw an error when the required attribute is missing", async () => {
        const schema = tx.string("ID", "attribute");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });

    it("should throw an error when a required element is missing", async () => {
        const schema = tx.string("NAME", "element");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });
});

describe("tx.number", () => {
    it("should parse positive integer from an element", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>123</NUM></root>");
        expect(actual).toBe(123);
    });

    it("should parse a negative number from an element", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>-456</NUM></root>");
        expect(actual).toBe(-456);
    });

    it("should parse a decimal number from an element", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>123.45</NUM></root>");
        expect(actual).toBe(123.45);
    });

    it("should parse zero from an element", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>0</NUM></root>");
        expect(actual).toBe(0);
    });

    it("should parse number from an attribute", async () => {
        const schema = tx.number("VALUE", "attribute");
        const actual = await schema.parse("<root VALUE='789'/>");
        expect(actual).toBe(789);
    });

    it("should parse the optional number when missing", async () => {
        const schema = tx.number("NUM", "element", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should parse scientific notation numbers", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>1.23e10</NUM></root>");
        expect(actual).toBe(1.23e10);
    });

    it("should handle negative zero", async () => {
        const schema = tx.number("NUM", "element");
        const actual = await schema.parse("<root><NUM>-0</NUM></root>");
        expect(actual).toBe(-0);
    });

    it("should throw an error when the required attribute is missing", async () => {
        const schema = tx.number("ID", "attribute");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });

    it("should throw an error when a required element is missing", async () => {
        const schema = tx.number("NUM", "element");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });

    it("should throw an error when number parsing fails", async () => {
        const schema = tx.number("NUM", "element");
        await expect(
            schema.parse("<root><NUM>invalid</NUM></root>"),
        ).rejects.toThrow();
    });

    it("should provide a clear error for invalid number format", async () => {
        const schema = tx.number("NUM", "element");
        await expect(
            schema.parse("<root><NUM>not-a-number</NUM></root>"),
        ).rejects.toThrow();
    });
});

describe("tx.boolean", () => {
    it("should parse true from an element", async () => {
        const schema = tx.boolean("FLAG", "element");
        const actual = await schema.parse("<root><FLAG>true</FLAG></root>");
        expect(actual).toBe(true);
    });

    it("should parse false from an element", async () => {
        const schema = tx.boolean("FLAG", "element");
        const actual = await schema.parse("<root><FLAG>false</FLAG></root>");
        expect(actual).toBe(false);
    });

    it("should parse boolean from an attribute", async () => {
        const schema = tx.boolean("ACTIVE", "attribute");
        const actual = await schema.parse("<root ACTIVE='true'/>");
        expect(actual).toBe(true);
    });

    it("should parse optional boolean when missing", async () => {
        const schema = tx.boolean("FLAG", "element", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should throw an error when the required attribute is missing", async () => {
        const schema = tx.boolean("FLAG", "attribute");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });

    it("should throw an error when a required element is missing", async () => {
        const schema = tx.boolean("FLAG", "element");
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });

    it("should throw an error when boolean parsing fails", async () => {
        const schema = tx.boolean("FLAG", "element");
        await expect(
            schema.parse("<root><FLAG>invalid</FLAG></root>"),
        ).rejects.toThrow();
    });

    it("should provide a clear error for invalid boolean format", async () => {
        const schema = tx.boolean("FLAG", "element");
        await expect(
            schema.parse("<root><FLAG>yes</FLAG></root>"),
        ).rejects.toThrow();
    });
});

describe("tx.object", () => {
    it("should parse an object", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            str: tx.string("STR", "element"),
            num: tx.number("NUM", "element"),
        });
        const actual = await schema.parse(
            "<root ID='abc123'><STR>Hello</STR><NUM>123</NUM></root>",
        );
        expect(actual).toEqual({
            id: "abc123",
            str: "Hello",
            num: 123,
        });
    });

    it("should parse nested objects", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            info: tx.object("INFO", {
                name: tx.string("NAME", "element"),
                details: tx.object("DETAILS", {
                    age: tx.number("AGE", "element"),
                    active: tx.boolean("ACTIVE", "element"),
                }),
            }),
        });
        const actual = await schema.parse(
            "<root ID='xyz789'><INFO><NAME>John</NAME><DETAILS><AGE>30</AGE><ACTIVE>true</ACTIVE></DETAILS></INFO></root>",
        );
        expect(actual).toEqual({
            id: "xyz789",
            info: {
                name: "John",
                details: {
                    age: 30,
                    active: true,
                },
            },
        });
    });

    it("should parse an object with optional fields present", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
            age: tx.number("AGE", "element", true),
        });
        const actual = await schema.parse(
            "<root ID='123'><NAME>John</NAME><AGE>30</AGE></root>",
        );
        expect(actual).toEqual({
            id: "123",
            name: "John",
            age: 30,
        });
    });

    it("should parse an object with optional fields missing", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
            age: tx.number("AGE", "element", true),
        });
        const actual = await schema.parse(
            "<root ID='123'><NAME>John</NAME></root>",
        );
        expect(actual).toEqual({
            id: "123",
            name: "John",
            age: undefined,
        });
    });

    it("should parse an object with multiple attributes and elements", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            type: tx.string("TYPE", "attribute"),
            name: tx.string("NAME", "element"),
            value: tx.number("VALUE", "element"),
        });
        const actual = await schema.parse(
            "<root ID='abc' TYPE='test'><NAME>Test</NAME><VALUE>42</VALUE></root>",
        );
        expect(actual).toEqual({
            id: "abc",
            type: "test",
            name: "Test",
            value: 42,
        });
    });

    it("should parse an object with multiple nested levels and arrays", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            metadata: tx.object("METADATA", {
                tags: tx.array("TAGS", tx.string()),
                properties: tx.object("PROPERTIES", {
                    enabled: tx.boolean("ENABLED", "element"),
                }),
            }),
        });
        const actual = await schema.parse(
            "<root ID='xyz'><METADATA><TAGS><TAG>foo</TAG><TAG>bar</TAG></TAGS><PROPERTIES><ENABLED>true</ENABLED></PROPERTIES></METADATA></root>",
        );
        expect(actual).toEqual({
            id: "xyz",
            metadata: {
                tags: ["foo", "bar"],
                properties: {
                    enabled: true,
                },
            },
        });
    });

    it("should throw an error when the required field is missing", async () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
        });
        await expect(schema.parse("<root ID='123'></root>")).rejects.toThrow();
    });
});

describe("tx.array", () => {
    it("should parse an array of objects", async () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                name: tx.string("NAME", "element"),
                age: tx.number("AGE", "element"),
                active: tx.boolean("ACTIVE", "element"),
            }),
        );
        const actual = await schema.parse(
            "<root><item ID='1'><NAME>Alice</NAME><AGE>25</AGE><ACTIVE>true</ACTIVE></item><item ID='2'><NAME>Bob</NAME><AGE>30</AGE><ACTIVE>false</ACTIVE></item></root>",
        );
        expect(actual).toEqual([
            {
                id: "1",
                name: "Alice",
                age: 25,
                active: true,
            },
            {
                id: "2",
                name: "Bob",
                age: 30,
                active: false,
            },
        ]);
    });

    it("should parse a single element array", async () => {
        const schema = tx.array(tx.string());
        const actual = await schema.parse("<root><VALUE>test</VALUE></root>");
        expect(actual).toEqual(["test"]);
    });

    it("should parse a single object with a name", async () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                name: tx.string("NAME", "element"),
                age: tx.number("AGE", "element"),
            }),
        );
        const actual = await schema.parse(
            "<root><item ID='1'><NAME>Alice</NAME><AGE>25</AGE></item></root>",
        );
        expect(actual).toEqual([
            {
                id: "1",
                name: "Alice",
                age: 25,
            },
        ]);
    });

    it("should parse an empty array", async () => {
        const schema = tx.array(tx.string(), true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should parse an array of strings", async () => {
        const schema = tx.array(tx.string());
        const actual = await schema.parse(
            "<root><VALUE>a</VALUE><VALUE>b</VALUE><VALUE>c</VALUE></root>",
        );
        expect(actual).toEqual(["a", "b", "c"]);
    });

    it("should parse an array of numbers", async () => {
        const schema = tx.array(tx.number());
        const actual = await schema.parse(
            "<root><VALUE>1</VALUE><VALUE>2</VALUE><VALUE>3</VALUE></root>",
        );
        expect(actual).toEqual([1, 2, 3]);
    });

    it("should parse an array of booleans", async () => {
        const schema = tx.array(tx.boolean());
        const actual = await schema.parse(
            "<root><VALUE>true</VALUE><VALUE>false</VALUE><VALUE>true</VALUE></root>",
        );
        expect(actual).toEqual([true, false, true]);
    });

    it("should parse an array of objects containing arrays", async () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                tags: tx.array("TAGS", tx.string()),
            }),
        );
        const actual = await schema.parse(
            "<root><item ID='1'><TAGS><TAG>a</TAG><TAG>b</TAG></TAGS></item><item ID='2'><TAGS><TAG>c</TAG></TAGS></item></root>",
        );
        expect(actual).toEqual([
            { id: "1", tags: ["a", "b"] },
            { id: "2", tags: ["c"] },
        ]);
    });

    it("should throw an error when a required array is empty", async () => {
        const schema = tx.array(tx.string());
        await expect(schema.parse("<root></root>")).rejects.toThrow();
    });
});
