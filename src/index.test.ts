import { describe, expect, it } from "vitest";
import type { Infer } from "./index";
import * as tx from "./index";
import type { ArraySchema, ElementSchema, ObjectSchema } from "./schema";

describe("Infer", () => {
    it("should infer required and optional primitive types correctly", () => {
        type Required = Infer<ElementSchema<string, false>>;
        type Optional = Infer<ElementSchema<string, true>>;

        const _required1: Required = "test";
        // @ts-expect-error Required is not undefined
        const _required2: Required = undefined;
        const _optional1: Optional = "test";
        const _optional2: Optional = undefined;
    });

    it("should infer required and optional object properties correctly", () => {
        type Object = Infer<
            ObjectSchema<
                {
                    required: string;
                    optional: string | undefined;
                },
                {
                    required: ElementSchema<string, false>;
                    optional: ElementSchema<string, true>;
                }
            >
        >;

        const _object1: Object = {
            required: "test",
            optional: "test",
        };
        const _object2: Object = {
            // @ts-expect-error required is not undefined
            required: undefined,
            optional: undefined,
        };
    });

    it("should infer nested object properties correctly", () => {
        type Object = Infer<
            ObjectSchema<
                {
                    required: {
                        required: string;
                        optional: string | undefined;
                    };
                    optional:
                        | {
                              required: string;
                              optional: string | undefined;
                          }
                        | undefined;
                },
                {
                    required: ElementSchema<
                        ObjectSchema<
                            {
                                required: string;
                                optional: string | undefined;
                            },
                            {
                                required: ElementSchema<string, false>;
                                optional: ElementSchema<string, true>;
                            }
                        >,
                        false
                    >;
                    optional: ElementSchema<
                        ObjectSchema<
                            {
                                required: string;
                                optional: string | undefined;
                            },
                            {
                                required: ElementSchema<string, false>;
                                optional: ElementSchema<string, true>;
                            }
                        >,
                        true
                    >;
                }
            >
        >;

        const _object1: Object = {
            required: {
                required: "test",
                optional: "test",
            },
            optional: {
                required: "test",
                optional: "test",
            },
        };
        const _object2: Object = {
            required: {
                // @ts-expect-error required is not undefined
                required: undefined,
                optional: undefined,
            },
            optional: {
                // @ts-expect-error required is not undefined
                required: undefined,
                optional: undefined,
            },
        };
        const _object3: Object = {
            // @ts-expect-error required is not undefined
            required: undefined,
            optional: undefined,
        };
    });

    it("should infer required and optional array types correctly", () => {
        type Required = Infer<ArraySchema<string, false, false>>;
        type Optional = Infer<ArraySchema<string, false, true>>;

        const _required1: Required = ["test"];
        // @ts-expect-error Required is not undefined
        const _required2: Required = undefined;
        const _optional1: Optional = ["test"];
        const _optional2: Optional = undefined;
    });

    it("should infer array properties correctly", () => {
        type Array = Infer<
            ObjectSchema<
                {
                    required: string[];
                    optional: string[] | undefined;
                },
                {
                    required: ArraySchema<string, true, false>;
                    optional: ArraySchema<string, true, true>;
                }
            >
        >;

        const _array1: Array = {
            required: ["test"],
            optional: ["test"],
        };
        const _array2: Array = {
            // @ts-expect-error required is not undefined
            required: undefined,
            optional: undefined,
        };
    });

    it("should infer nested array types correctly", () => {
        // string[][]
        type ArrayInArray = Infer<
            ArraySchema<ArraySchema<string, false, false>, false, false>
        >;
        // string[][] | undefined
        type ArrayInOptionalArray = Infer<
            ArraySchema<ArraySchema<string, false, false>, false, true>
        >;
        // (string[] | undefined)[]
        type OptionalArrayInArray = Infer<
            ArraySchema<ArraySchema<string, false, true>, false, false>
        >;

        const _required1: ArrayInArray = [["test"]];
        // @ts-expect-error Required is not undefined
        const _required2: ArrayInArray = undefined;
        // @ts-expect-error Inner array is required
        const _required3: ArrayInArray = [undefined];

        const _optional1: ArrayInOptionalArray = [["test"]];
        const _optional2: ArrayInOptionalArray = undefined;
        // @ts-expect-error Inner array is required
        const _optional3: ArrayInOptionalArray = [undefined];

        const _innerOptional1: OptionalArrayInArray = [["test"]];
        // @ts-expect-error Outer array is required
        const _innerOptional2: OptionalArrayInArray = undefined;
        const _innerOptional3: OptionalArrayInArray = [undefined];
    });
});

describe("tx.string", () => {
    it("should parse string from an attribute", () => {
        const schema = tx.object({
            name: tx.string("NAME", "attribute"),
        });
        const actual = schema.parse("<root NAME='test'/>");
        expect(actual.name).toBe("test");
    });

    it("should parse optional string when missing", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "attribute", true),
        });
        const actual = schema.parse("<root></root>");
        expect(actual.value).toBeUndefined();
    });

    it("should parse string from an element", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "element"),
        });
        const actual = schema.parse("<root><VALUE>test</VALUE></root>");
        expect(actual.value).toBe("test");
    });

    it("should parse optional string when missing", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "element", true),
        });
        const actual = schema.parse("<root></root>");
        expect(actual.value).toBeUndefined();
    });

    it("should handle empty string values", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "element"),
        });
        const actual = schema.parse("<root><VALUE></VALUE></root>");
        expect(actual.value).toBe("");
    });

    it("should handle whitespace-only string values", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "element"),
        });
        const actual = schema.parse("<root><VALUE>   </VALUE></root>");
        expect(actual.value).toBe("   ");
    });

    it("should keep special characters escaped in string values", () => {
        const schema = tx.object({
            value: tx.string("VALUE", "element"),
        });
        const actual = schema.parse("<root><VALUE>&lt;test&gt;</VALUE></root>");
        expect(actual.value).toBe("&lt;test&gt;");
    });

    it("should throw an error when the required attribute is missing", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should throw an error when a required element is missing", () => {
        const schema = tx.object({
            name: tx.string("NAME", "element"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });
});

describe("tx.number", () => {
    it("should parse positive integer from an element", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>123</NUM></root>");
        expect(actual.num).toBe(123);
    });

    it("should parse a negative number from an element", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>-456</NUM></root>");
        expect(actual.num).toBe(-456);
    });

    it("should parse a decimal number from an element", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>123.45</NUM></root>");
        expect(actual.num).toBe(123.45);
    });

    it("should parse zero from an element", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>0</NUM></root>");
        expect(actual.num).toBe(0);
    });

    it("should parse number from an attribute", () => {
        const schema = tx.object({
            value: tx.number("VALUE", "attribute"),
        });
        const actual = schema.parse("<root VALUE='789'/>");
        expect(actual.value).toBe(789);
    });

    it("should parse the optional number when missing", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element", true),
        });
        const actual = schema.parse("<root></root>");
        expect(actual.num).toBeUndefined();
    });

    it("should parse scientific notation numbers", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>1.23e10</NUM></root>");
        expect(actual.num).toBe(1.23e10);
    });

    it("should handle negative zero", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse("<root><NUM>-0</NUM></root>");
        expect(actual.num).toBe(-0);
    });

    it("should throw an error when the required attribute is missing", () => {
        const schema = tx.object({
            id: tx.number("ID", "attribute"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should throw an error when a required element is missing", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should throw an error when number parsing fails", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        expect(() => schema.parse("<root><NUM>invalid</NUM></root>")).toThrow();
    });

    it("should provide a clear error for invalid number format", () => {
        const schema = tx.object({
            num: tx.number("NUM", "element"),
        });
        expect(() =>
            schema.parse("<root><NUM>not-a-number</NUM></root>"),
        ).toThrow();
    });
});

describe("tx.boolean", () => {
    it("should parse true from an element", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element"),
        });
        const actual = schema.parse("<root><FLAG>true</FLAG></root>");
        expect(actual.flag).toBe(true);
    });

    it("should parse false from an element", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element"),
        });
        const actual = schema.parse("<root><FLAG>false</FLAG></root>");
        expect(actual.flag).toBe(false);
    });

    it("should parse boolean from an attribute", () => {
        const schema = tx.object({
            active: tx.boolean("ACTIVE", "attribute"),
        });
        const actual = schema.parse("<root ACTIVE='true'/>");
        expect(actual.active).toBe(true);
    });

    it("should parse optional boolean when missing", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element", true),
        });
        const actual = schema.parse("<root></root>");
        expect(actual.flag).toBeUndefined();
    });

    it("should throw an error when the required attribute is missing", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "attribute"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should throw an error when a required element is missing", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element"),
        });
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should throw an error when boolean parsing fails", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element"),
        });
        expect(() =>
            schema.parse("<root><FLAG>invalid</FLAG></root>"),
        ).toThrow();
    });

    it("should provide a clear error for invalid boolean format", () => {
        const schema = tx.object({
            flag: tx.boolean("FLAG", "element"),
        });
        expect(() => schema.parse("<root><FLAG>yes</FLAG></root>")).toThrow();
    });
});

describe("tx.object", () => {
    it("should parse an object", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            str: tx.string("STR", "element"),
            num: tx.number("NUM", "element"),
        });
        const actual = schema.parse(
            "<root ID='abc123'><STR>Hello</STR><NUM>123</NUM></root>",
        );
        expect(actual).toEqual({
            id: "abc123",
            str: "Hello",
            num: 123,
        });
    });

    it("should parse nested objects", () => {
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
        const actual = schema.parse(
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

    it("should parse an object with optional fields present", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
            age: tx.number("AGE", "element", true),
        });
        const actual = schema.parse(
            "<root ID='123'><NAME>John</NAME><AGE>30</AGE></root>",
        );
        expect(actual).toEqual({
            id: "123",
            name: "John",
            age: 30,
        });
    });

    it("should parse an object with optional fields missing", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
            age: tx.number("AGE", "element", true),
        });
        const actual = schema.parse("<root ID='123'><NAME>John</NAME></root>");
        expect(actual).toEqual({
            id: "123",
            name: "John",
            age: undefined,
        });
    });

    it("should parse an object with multiple attributes and elements", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            type: tx.string("TYPE", "attribute"),
            name: tx.string("NAME", "element"),
            value: tx.number("VALUE", "element"),
        });
        const actual = schema.parse(
            "<root ID='abc' TYPE='test'><NAME>Test</NAME><VALUE>42</VALUE></root>",
        );
        expect(actual).toEqual({
            id: "abc",
            type: "test",
            name: "Test",
            value: 42,
        });
    });

    it("should parse an object with multiple nested levels and arrays", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            metadata: tx.object("METADATA", {
                tags: tx.array("TAG", tx.string()),
                properties: tx.object("PROPERTIES", {
                    enabled: tx.boolean("ENABLED", "element"),
                }),
            }),
        });
        const actual = schema.parse(
            "<root ID='xyz'><METADATA><TAG>foo</TAG><TAG>bar</TAG><PROPERTIES><ENABLED>true</ENABLED></PROPERTIES></METADATA></root>",
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

    it("should parse nested objects with named wrappers", () => {
        const schema = tx.object({
            user: tx.object("USER", {
                info: tx.object("INFO", {
                    name: tx.string("NAME", "element"),
                    age: tx.number("AGE", "element"),
                }),
                settings: tx.object("SETTINGS", {
                    active: tx.boolean("ACTIVE", "element"),
                }),
            }),
        });
        const actual = schema.parse(
            "<root><USER><INFO><NAME>John</NAME><AGE>30</AGE></INFO><SETTINGS><ACTIVE>true</ACTIVE></SETTINGS></USER></root>",
        );
        expect(actual).toEqual({
            user: {
                info: {
                    name: "John",
                    age: 30,
                },
                settings: {
                    active: true,
                },
            },
        });
    });

    it("should parse object containing array without wrapper", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            tags: tx.array("TAG", tx.string()),
        });
        const actual = schema.parse(
            "<root ID='123'><TAG>a</TAG><TAG>b</TAG></root>",
        );
        expect(actual).toEqual({
            id: "123",
            tags: ["a", "b"],
        });
    });

    it("should parse object with optional array", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            tags: tx.array("TAG", tx.string(), true),
        });
        const actual = schema.parse("<root ID='123'></root>");
        expect(actual).toEqual({
            id: "123",
            tags: undefined,
        });
    });

    it("should parse optional object when present", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            details: tx.object(
                "DETAILS",
                {
                    name: tx.string("NAME", "element"),
                },
                true,
            ),
        });
        const actual = schema.parse(
            "<root ID='123'><DETAILS><NAME>Test</NAME></DETAILS></root>",
        );
        expect(actual).toEqual({
            id: "123",
            details: { name: "Test" },
        });
    });

    it("should parse optional object when missing", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            details: tx.object(
                "DETAILS",
                {
                    name: tx.string("NAME", "element"),
                },
                true,
            ),
        });
        const actual = schema.parse("<root ID='123'></root>");
        expect(actual).toEqual({
            id: "123",
            details: undefined,
        });
    });

    it("should throw error for required named object when missing", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            details: tx.object("DETAILS", {
                name: tx.string("NAME", "element"),
            }),
        });
        expect(() => schema.parse("<root ID='123'></root>")).toThrow();
    });

    it("should parse empty object schema", () => {
        const schema = tx.object({});
        const actual = schema.parse("<root></root>");
        expect(actual).toEqual({});
    });

    it("should parse named empty object schema", () => {
        const schema = tx.object({
            empty: tx.object("EMPTY", {}),
        });
        const actual = schema.parse("<root><EMPTY/></root>");
        expect(actual).toEqual({
            empty: {},
        });
    });

    it("should omit undefined values from object", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element", true),
            age: tx.number("AGE", "element", true),
        });
        const actual = schema.parse("<root ID='123'></root>");
        expect(actual).toStrictEqual({
            id: "123",
        });
    });

    it("should throw an error when the required field is missing", () => {
        const schema = tx.object({
            id: tx.string("ID", "attribute"),
            name: tx.string("NAME", "element"),
        });
        expect(() => schema.parse("<root ID='123'></root>")).toThrow();
    });

    it("should throw an error when multiple matching objects are found", () => {
        const schema = tx.object({
            name: tx.string("NAME", "element"),
        });
        expect(() =>
            schema.parse("<root><NAME>First</NAME><NAME>Second</NAME></root>"),
        ).toThrow();
    });
});

describe("tx.array", () => {
    it("should use string() without arguments as ValueSchema", () => {
        const schema = tx.array(tx.string());
        const actual = schema.parse(
            "<root><item>a</item><item>b</item></root>",
        );
        expect(actual).toEqual(["a", "b"]);
    });

    it("should use number() without arguments as ValueSchema", () => {
        const schema = tx.array(tx.number());
        const actual = schema.parse(
            "<root><item>1</item><item>2</item></root>",
        );
        expect(actual).toEqual([1, 2]);
    });

    it("should use boolean() without arguments as ValueSchema", () => {
        const schema = tx.array(tx.boolean());
        const actual = schema.parse(
            "<root><item>true</item><item>false</item></root>",
        );
        expect(actual).toEqual([true, false]);
    });

    it("should parse array with specific element name", () => {
        const stringSchema = tx.array("ITEM", tx.string());
        const numberSchema = tx.array("NUM", tx.number());

        expect(
            stringSchema.parse("<root><ITEM>a</ITEM><ITEM>b</ITEM></root>"),
        ).toEqual(["a", "b"]);
        expect(
            numberSchema.parse("<root><NUM>1</NUM><NUM>2</NUM></root>"),
        ).toEqual([1, 2]);
    });

    it("should parse array with specific element name for objects", () => {
        const schema = tx.array(
            tx.object({
                name: tx.string("NAME", "element"),
            }),
        );
        const actual = schema.parse(
            "<root><USER><NAME>Alice</NAME></USER><USER><NAME>Bob</NAME></USER></root>",
        );
        expect(actual).toEqual([{ name: "Alice" }, { name: "Bob" }]);
    });

    it("should parse optional named array when empty", () => {
        const schema = tx.array("ITEM", tx.string(), true);
        const actual = schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should throw error for required named array when empty", () => {
        const schema = tx.array("ITEM", tx.string());
        expect(() => schema.parse("<root></root>")).toThrow();
    });

    it("should parse named nested arrays", () => {
        const schema = tx.array("GROUP", tx.array(tx.string()));
        const actual = schema.parse(
            "<root><GROUP><ITEM>a</ITEM><ITEM>b</ITEM></GROUP><GROUP><ITEM>c</ITEM></GROUP></root>",
        );
        expect(actual).toEqual([["a", "b"], ["c"]]);
    });

    it("should parse an array of objects", () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                name: tx.string("NAME", "element"),
                age: tx.number("AGE", "element"),
                active: tx.boolean("ACTIVE", "element"),
            }),
        );
        const actual = schema.parse(
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

    it("should parse a single element array", () => {
        const schema = tx.array(tx.string());
        const actual = schema.parse("<root><VALUE>test</VALUE></root>");
        expect(actual).toEqual(["test"]);
    });

    it("should parse a single object with a name", () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                name: tx.string("NAME", "element"),
                age: tx.number("AGE", "element"),
            }),
        );
        const actual = schema.parse(
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

    it("should parse an empty array", () => {
        const schema = tx.array(tx.string(), true);
        const actual = schema.parse("<root></root>");
        expect(actual).toBeUndefined();
    });

    it("should parse an array of strings", () => {
        const schema = tx.array(tx.string());
        const actual = schema.parse(
            "<root><VALUE>a</VALUE><VALUE>b</VALUE><VALUE>c</VALUE></root>",
        );
        expect(actual).toEqual(["a", "b", "c"]);
    });

    it("should parse an array of numbers", () => {
        const schema = tx.array(tx.number());
        const actual = schema.parse(
            "<root><VALUE>1</VALUE><VALUE>2</VALUE><VALUE>3</VALUE></root>",
        );
        expect(actual).toEqual([1, 2, 3]);
    });

    it("should parse an array of booleans", () => {
        const schema = tx.array(tx.boolean());
        const actual = schema.parse(
            "<root><VALUE>true</VALUE><VALUE>false</VALUE><VALUE>true</VALUE></root>",
        );
        expect(actual).toEqual([true, false, true]);
    });

    it("should parse an array of objects containing arrays", () => {
        const schema = tx.array(
            tx.object({
                id: tx.string("ID", "attribute"),
                tags: tx.array("TAG", tx.string()),
            }),
        );
        const actual = schema.parse(
            "<root><item ID='1'><TAG>a</TAG><TAG>b</TAG></item><item ID='2'><TAG>c</TAG></item></root>",
        );
        expect(actual).toEqual([
            { id: "1", tags: ["a", "b"] },
            { id: "2", tags: ["c"] },
        ]);
    });

    it("should parse nested arrays", () => {
        const schema = tx.array(tx.array(tx.string()));
        const actual = schema.parse(
            "<root><GROUP><VALUE>a</VALUE><VALUE>b</VALUE></GROUP><GROUP><VALUE>c</VALUE><VALUE>d</VALUE></GROUP></root>",
        );
        expect(actual).toEqual([
            ["a", "b"],
            ["c", "d"],
        ]);
    });

    it("should parse nested arrays in object", () => {
        const schema = tx.object({
            groups: tx.array("GROUP", tx.array(tx.string())),
        });
        const actual = schema.parse(
            "<root><GROUP><VALUE>a</VALUE><VALUE>b</VALUE></GROUP><GROUP><VALUE>c</VALUE><VALUE>d</VALUE></GROUP></root>",
        );
        expect(actual).toEqual({
            groups: [
                ["a", "b"],
                ["c", "d"],
            ],
        });
    });

    it("should parse triple-nested arrays with named items", () => {
        const schema = tx.array("ITEM", tx.array(tx.array(tx.string())));
        const actual = schema.parse(
            "<root><ITEM><GROUP><VALUE>a</VALUE><VALUE>b</VALUE></GROUP><GROUP><VALUE>c</VALUE></GROUP></ITEM><ITEM><GROUP><VALUE>d</VALUE></GROUP></ITEM></root>",
        );
        expect(actual).toEqual([[["a", "b"], ["c"]], [["d"]]]);
    });

    it("should parse multiple array items with nested objects", () => {
        const schema = tx.array(
            tx.object({
                name: tx.string("NAME", "element"),
                details: tx.object("DETAILS", {
                    age: tx.number("AGE", "element"),
                    active: tx.boolean("ACTIVE", "element"),
                }),
            }),
        );
        const actual = schema.parse(
            "<root><USER><NAME>John</NAME><DETAILS><AGE>30</AGE><ACTIVE>true</ACTIVE></DETAILS></USER><USER><NAME>Jane</NAME><DETAILS><AGE>25</AGE><ACTIVE>false</ACTIVE></DETAILS></USER></root>",
        );
        expect(actual).toEqual([
            {
                name: "John",
                details: {
                    age: 30,
                    active: true,
                },
            },
            {
                name: "Jane",
                details: {
                    age: 25,
                    active: false,
                },
            },
        ]);
    });

    it("should throw an error when a required array is empty", () => {
        const schema = tx.array(tx.string());
        expect(() => schema.parse("<root></root>")).toThrow();
    });
});
