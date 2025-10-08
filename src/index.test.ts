import { describe, expect } from "vitest";
import * as tx from "./index";
import {
    BooleanAttributeSchema,
    BooleanElementSchema,
    NumberAttributeSchema,
    NumberElementSchema,
    RequiredSchema,
    StringAttributeSchema,
    StringElementSchema,
} from "./schema";

describe.each([
    [
        tx.string,
        [
            ["attribute", StringAttributeSchema],
            ["element", StringElementSchema],
        ],
    ],
    [
        tx.number,
        [
            ["attribute", NumberAttributeSchema],
            ["element", NumberElementSchema],
        ],
    ],
    [
        tx.boolean,
        [
            ["attribute", BooleanAttributeSchema],
            ["element", BooleanElementSchema],
        ],
    ],
] as const)("%o", (fn, cases) => {
    // @ts-expect-error ignore cases type error
    describe.each(cases)("%s -> %o", (kind, clazz) => {
        it("should return schema when optional is true", () => {
            const schema = fn(kind, "NAME", true);
            expect(schema instanceof clazz).toBe(true);
            // @ts-expect-error name is private
            expect(schema.name).toBe("NAME");
        });

        it("should return RequiredSchema wrapping schema when optional is false", () => {
            const wrapped = fn(kind, "NAME", false);
            // noinspection SuspiciousTypeOfGuard
            expect(wrapped instanceof RequiredSchema).toBe(true);
            // @ts-expect-error schema is private
            const base = wrapped.schema;
            expect(base instanceof clazz).toBe(true);
            expect(base.name).toBe("NAME");
        });
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
});

describe("tx.array", () => {
    it("should parse an array of objects", async () => {
        const schema = tx.array({
            id: tx.string("attribute", "ID"),
            name: tx.string("element", "NAME"),
            age: tx.number("element", "AGE"),
            active: tx.boolean("element", "ACTIVE"),
        });
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

    it("should parse empty array", async () => {
        const schema = tx.array({
            item: tx.string("element", "ITEM"),
        });
        const actual = await schema.parse("<root></root>");
        expect(actual).toEqual([]);
    });
});
