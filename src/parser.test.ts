import { parse } from "./parser";

describe("parseXML", () => {
    it("parses simple element", async () => {
        const xml = "<root></root>";
        expect(await parse(xml)).toEqual({
            name: "root",
        });
    });

    it("parses element with attributes", async () => {
        const xml = '<root id="1" class="main"></root>';
        expect(await parse(xml)).toEqual({
            name: "root",
            attributes: {
                id: "1",
                class: "main",
            },
        });
    });

    it("parses element with text content", async () => {
        const xml = "<root>Hello</root>";
        expect(await parse(xml)).toEqual({
            name: "root",
            text: "Hello",
        });
    });

    it("parses nested elements", async () => {
        const xml = "<root><child>Text</child></root>";
        expect(await parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "child",
                    text: "Text",
                },
            ],
        });
    });

    it("parses self-closing tags", async () => {
        const xml = "<root><empty/></root>";
        expect(await parse(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "empty",
                },
            ],
        });
    });

    it("parses nested elements with attributes and text", async () => {
        const xml = '<root><child id="1">Text</child></root>';
        expect(await parse(xml)).toEqual({
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

    it("parses deeply nested elements", async () => {
        const xml =
            "<root><level1><level2><level3>Deep</level3></level2></level1></root>";
        expect(await parse(xml)).toEqual({
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

    it("parses multiple child elements", async () => {
        const xml =
            "<root><child>First</child><child>Second</child><child>Third</child></root>";
        expect(await parse(xml)).toEqual({
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

    it("parses multiple child elements with mixed content", async () => {
        const xml = "<root><a>1</a><b/><c>3</c></root>";
        expect(await parse(xml)).toEqual({
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

    it("parses multiple sibling elements with attributes", async () => {
        const xml =
            '<root><item id="1" type="a"/><item id="2" type="b"/></root>';
        expect(await parse(xml)).toEqual({
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

    it("ignores comments in XML", async () => {
        const xml =
            "<root><!-- This is a comment -->text<!-- Another comment --></root>";
        expect(await parse(xml)).toEqual({
            name: "root",
            text: "text",
        });
    });

    it("parses XML with DOCTYPE declaration", async () => {
        const xml = '<!DOCTYPE html><root id="1">content</root>';
        expect(await parse(xml)).toEqual({
            name: "root",
            attributes: {
                id: "1",
            },
            text: "content",
        });
    });

    it("throws error on mismatched tags", async () => {
        const xml = "<root><child></root></child>";
        await expect(parse(xml)).rejects.toThrow(
            `Mismatched closing tag: expected </child> got </root> at 19. Near: "<root><child></root></child>"`,
        );
    });

    it("throws error on invalid attribute syntax", async () => {
        const xml = '<root id="1" class=></root>';
        await expect(parse(xml)).rejects.toThrow(
            `Expected quoted attribute value at 19. Near: "<root id="1" class=></root>"`,
        );
    });

    it("throws error on unclosed tags", async () => {
        const xml = "<root><child>";
        await expect(parse(xml)).rejects.toThrow(
            `Unclosed element <child> at 13. Near: "<root><child>"`,
        );
    });

    it("throws error on empty input", async () => {
        const xml = "";
        await expect(parse(xml)).rejects.toThrow(
            `Expected element start '<' at 0. Near: ""`,
        );
    });
});
