import { parse } from "./parser";

describe("parse", () => {
    it("parses simple element", () => {
        const xml = "<root></root>";
        expect(parse(xml)).toEqual({
            name: "root",
        });
    });

    it("parses element with attributes", () => {
        const xml = '<root id="1" class="main"></root>';
        expect(parse(xml)).toEqual({
            name: "root",
            attributes: {
                id: "1",
                class: "main",
            },
        });
    });

    it("parses element names starting with letters and underscore", () => {
        expect(parse("<abc></abc>")).toEqual({ name: "abc" });
        expect(parse("<ABC></ABC>")).toEqual({ name: "ABC" });
        expect(parse("<_test></_test>")).toEqual({ name: "_test" });
    });

    it("parses element names containing numbers, dots and hyphens", () => {
        expect(parse("<test123></test123>")).toEqual({ name: "test123" });
        expect(parse("<my.tag></my.tag>")).toEqual({ name: "my.tag" });
        expect(parse("<data-item></data-item>")).toEqual({ name: "data-item" });
    });

    it("throws error on invalid element names", () => {
        expect(() => parse("<1abc></1abc>")).toThrow("Invalid name start");
        expect(() => parse("<123></123>")).toThrow("Invalid name start");
    });

    it("parses element with text content", () => {
        const xml = "<root>Hello</root>";
        expect(parse(xml)).toEqual({
            name: "root",
            text: "Hello",
        });
    });

    it("parses nested elements", () => {
        const xml = "<root><child>Text</child></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "child",
                    text: "Text",
                },
            ],
        });
    });

    it("parses self-closing tags", () => {
        const xml = "<root><empty/></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "empty",
                },
            ],
        });
    });

    it("parses nested elements with attributes and text", () => {
        const xml = '<root><child id="1">Text</child></root>';
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "child",
                    attributes: {
                        id: "1",
                    },
                    text: "Text",
                },
            ],
        });
    });

    it("parses deeply nested elements", () => {
        const xml =
            "<root><level1><level2><level3>Deep</level3></level2></level1></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "level1",
                    children: [
                        {
                            name: "level2",
                            children: [
                                {
                                    name: "level3",
                                    text: "Deep",
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("parses multiple child elements", () => {
        const xml =
            "<root><child>First</child><child>Second</child><child>Third</child></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "child",
                    text: "First",
                },
                {
                    name: "child",
                    text: "Second",
                },
                {
                    name: "child",
                    text: "Third",
                },
            ],
        });
    });

    it("parses multiple child elements with mixed content", () => {
        const xml = "<root><a>1</a><b/><c>3</c></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "a",
                    text: "1",
                },
                {
                    name: "b",
                },
                {
                    name: "c",
                    text: "3",
                },
            ],
        });
    });

    it("parses multiple sibling elements with attributes", () => {
        const xml =
            '<root><item id="1" type="a"/><item id="2" type="b"/></root>';
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "item",
                    attributes: {
                        id: "1",
                        type: "a",
                    },
                },
                {
                    name: "item",
                    attributes: {
                        id: "2",
                        type: "b",
                    },
                },
            ],
        });
    });

    it("ignores comments in XML", () => {
        const xml =
            "<root><!-- This is a comment -->text<!-- Another comment --></root>";
        expect(parse(xml)).toEqual({
            name: "root",
            text: "text",
        });
    });

    it("parses XML with DOCTYPE declaration", () => {
        const xml = '<!DOCTYPE html><root id="1">content</root>';
        expect(parse(xml)).toEqual({
            name: "root",
            attributes: {
                id: "1",
            },
            text: "content",
        });
    });

    it("parses array elements", () => {
        const xml =
            '<root><array id="1">1</array><array id="2">2</array><array id="3">3</array></root>';
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "array",
                    attributes: {
                        id: "1",
                    },
                    text: "1",
                },
                {
                    name: "array",
                    attributes: {
                        id: "2",
                    },
                    text: "2",
                },
                {
                    name: "array",
                    attributes: {
                        id: "3",
                    },
                    text: "3",
                },
            ],
        });
    });

    it("parses nested array elements", () => {
        const xml =
            '<root><array type="first"><item id="1">1</item><item id="2">2</item></array><array type="second"><item id="3">3</item><item id="4">4</item></array></root>';
        expect(parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "array",
                    attributes: {
                        type: "first",
                    },
                    children: [
                        {
                            name: "item",
                            attributes: {
                                id: "1",
                            },
                            text: "1",
                        },
                        {
                            name: "item",
                            attributes: {
                                id: "2",
                            },
                            text: "2",
                        },
                    ],
                },
                {
                    name: "array",
                    attributes: {
                        type: "second",
                    },
                    children: [
                        {
                            name: "item",
                            attributes: {
                                id: "3",
                            },
                            text: "3",
                        },
                        {
                            name: "item",
                            attributes: {
                                id: "4",
                            },
                            text: "4",
                        },
                    ],
                },
            ],
        });
    });

    it("throws error on mismatched tags", () => {
        const xml = "<root><child></root></child>";
        expect(() => parse(xml)).toThrow(
            `Mismatched closing tag: expected </child> got </root> at 19. Near: "<root><child></root></child>"`,
        );
    });

    it("throws error on invalid attribute syntax", () => {
        const xml = '<root id="1" class=></root>';
        expect(() => parse(xml)).toThrow(
            `Expected quoted attribute value at 19. Near: "<root id="1" class=></root>"`,
        );
    });

    it("throws error on unclosed tags", () => {
        const xml = "<root><child>";
        expect(() => parse(xml)).toThrow(
            `Unclosed element <child> at 13. Near: "<root><child>"`,
        );
    });

    it("throws error on empty input", () => {
        const xml = "";
        expect(() => parse(xml)).toThrow(
            `Expected element start '<' at 0. Near: ""`,
        );
    });
});
