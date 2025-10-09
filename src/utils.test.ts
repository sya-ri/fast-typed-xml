import { describe, expect, it } from "vitest";
import type { NodeLike } from "./parser";
import { getChild, parseBooleanOrFail, parseNumberOrFail } from "./util";

describe("getChild", () => {
    it("should find a child by name", () => {
        const node: NodeLike = {
            name: "parent",
            children: [{ name: "child1" }, { name: "child2" }],
        };
        expect(getChild(node, "child1")).toEqual({ name: "child1" });
    });

    it("should return undefined for non-existing child", () => {
        const node: NodeLike = {
            name: "parent",
            children: [{ name: "child1" }],
        };
        expect(getChild(node, "non-existing")).toBeUndefined();
    });

    it("should return undefined for node without children", () => {
        const node: NodeLike = {
            name: "parent",
        };
        expect(getChild(node, "any")).toBeUndefined();
    });
});

describe("parseNumberOrFail", () => {
    it("should parse a valid number", () => {
        expect(parseNumberOrFail("123")).toBe(123);
        expect(parseNumberOrFail("-456")).toBe(-456);
        expect(parseNumberOrFail("0.789")).toBe(0.789);
    });

    it("should throw an error for an invalid number", () => {
        expect(() => parseNumberOrFail("abc")).toThrow("Invalid number: abc");
        expect(() => parseNumberOrFail("12.34.56")).toThrow(
            "Invalid number: 12.34.56",
        );
    });
});

describe("parseBooleanOrFail", () => {
    it("should parse a valid boolean", () => {
        expect(parseBooleanOrFail("true")).toBe(true);
        expect(parseBooleanOrFail("false")).toBe(false);
    });

    it("should throw an error for invalid boolean", () => {
        expect(() => parseBooleanOrFail("yes")).toThrow("Invalid boolean: yes");
        expect(() => parseBooleanOrFail("1")).toThrow("Invalid boolean: 1");
    });
});
