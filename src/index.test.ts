import { describe, expect } from "vitest";
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
