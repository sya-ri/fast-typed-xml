import { faker } from "@faker-js/faker";
import { describe, expect } from "vitest";
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
            const actual = fn(kind, "NAME", optional);

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
        const schema = tx.string("attribute", "NAME");
        const actual = await schema.parse("<root NAME='test'/>");
        expect(actual).toBe("test");
    });

    it("should parse optional string when missing", async () => {
        const schema = tx.string("attribute", "VALUE", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should parse string from an element", async () => {
        const schema = tx.string("element", "VALUE");
        const actual = await schema.parse("<root><VALUE>test</VALUE></root>");
        expect(actual).toBe("test");
    });

    it("should parse optional string when missing", async () => {
        const schema = tx.string("element", "VALUE", true);
        const actual = await schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });
});

describe("tx.object", () => {
    it("should parse an object", async () => {
        const schema = tx.object({
            id: tx.string("attribute", "ID"),
            str: tx.string("element", "STR"),
            num: tx.number("element", "NUM"),
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
            id: tx.string("attribute", "ID"),
            info: tx.object("INFO", {
                name: tx.string("element", "NAME"),
                details: tx.object("DETAILS", {
                    age: tx.number("element", "AGE"),
                    active: tx.boolean("element", "ACTIVE"),
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
});

describe("tx.array", () => {
    it("should parse an array of objects", async () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("attribute", "ID"),
                name: tx.string("element", "NAME"),
                age: tx.number("element", "AGE"),
                active: tx.boolean("element", "ACTIVE"),
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
                id: tx.string("attribute", "ID"),
                name: tx.string("element", "NAME"),
                age: tx.number("element", "AGE"),
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
});
