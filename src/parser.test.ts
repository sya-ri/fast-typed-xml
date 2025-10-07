import { parseXML } from "./parser";

describe("parseXML", () => {
    it("parses simple element", () => {
        const xml = "<root></root>";
        expect(parseXML(xml)).toEqual({
            name: "root",
        });
    });

    it("parses element with attributes", () => {
        const xml = '<root id="1" class="main"></root>';
        expect(parseXML(xml)).toEqual({
            name: "root",
            attrs: {
                id: "1",
                class: "main",
            },
        });
    });

    it("parses element with text content", () => {
        const xml = "<root>Hello</root>";
        expect(parseXML(xml)).toEqual({
            name: "root",
            text: "Hello",
        });
    });

    it("parses nested elements", () => {
        const xml = "<root><child>Text</child></root>";
        expect(parseXML(xml)).toEqual({
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
        expect(parseXML(xml)).toEqual({
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
        expect(parseXML(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "child",
                    attrs: {
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
        expect(parseXML(xml)).toEqual({
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
        expect(parseXML(xml)).toEqual({
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
        expect(parseXML(xml)).toEqual({
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
        expect(parseXML(xml)).toEqual({
            name: "root",
            children: [
                {
                    name: "item",
                    attrs: {
                        id: "1",
                        type: "a",
                    },
                },
                {
                    name: "item",
                    attrs: {
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
        expect(parseXML(xml)).toEqual({
            name: "root",
            text: "text",
        });
    });

    it("parses XML with DOCTYPE declaration", () => {
        const xml = '<!DOCTYPE html><root id="1">content</root>';
        expect(parseXML(xml)).toEqual({
            name: "root",
            attrs: {
                id: "1",
            },
            text: "content",
        });
    });
});
