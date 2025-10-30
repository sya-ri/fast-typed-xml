import { parse } from "./parser";

describe("parse", () => {
    describe("basic element parsing", () => {
        it("parses simple element", () => {
            const xml = "<root></root>";
            expect(parse(xml)).toEqual({
                name: "root",
            });
        });

        it("parses element with text content", () => {
            const xml = "<root>Hello</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "Hello",
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

        it("parses XML with excessive whitespace", () => {
            const xml = `<root    id="1"   ><child   type="test"  >    content   </child  ></root >`;
            expect(parse(xml)).toEqual({
                name: "root",
                attributes: {
                    id: "1",
                },
                children: [
                    {
                        name: "child",
                        attributes: {
                            type: "test",
                        },
                        text: "    content   ", // whitespace is preserved
                    },
                ],
            });
        });

        it("parses XML with missing whitespace", () => {
            const xml =
                '<root><child type="a"id="1">text</child><child type="b"id="2"/></root>';
            expect(parse(xml)).toEqual({
                name: "root",
                children: [
                    {
                        name: "child",
                        attributes: {
                            type: "a",
                            id: "1",
                        },
                        text: "text",
                    },
                    {
                        name: "child",
                        attributes: {
                            type: "b",
                            id: "2",
                        },
                    },
                ],
            });
        });
    });

    describe("element name validation", () => {
        it("parses element names starting with letters and underscore", () => {
            expect(parse("<abc></abc>")).toEqual({ name: "abc" });
            expect(parse("<ABC></ABC>")).toEqual({ name: "ABC" });
            expect(parse("<_test></_test>")).toEqual({ name: "_test" });
        });

        it("parses element names containing numbers, dots and hyphens", () => {
            expect(parse("<test123></test123>")).toEqual({ name: "test123" });
            expect(parse("<my.tag></my.tag>")).toEqual({ name: "my.tag" });
            expect(parse("<data-item></data-item>")).toEqual({
                name: "data-item",
            });
        });

        it("throws error on invalid element names", () => {
            expect(() => parse("<1abc></1abc>")).toThrow("Invalid name start");
            expect(() => parse("<123></123>")).toThrow("Invalid name start");
        });
    });

    describe("attribute parsing", () => {
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
    });

    describe("nested elements parsing", () => {
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
    });

    describe("array elements parsing", () => {
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
    });

    describe("cdata parsing", () => {
        it("parses basic CDATA content", () => {
            const xml = "<root><![CDATA[text content]]></root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "text content",
            });
        });

        it("preserves special characters in CDATA", () => {
            const xml = '<root><![CDATA[<test> & > < "quoted"]]></root>';
            expect(parse(xml)).toEqual({
                name: "root",
                text: '<test> & > < "quoted"',
            });
        });

        it("parses multiple CDATA sections", () => {
            const xml = "<root><![CDATA[first]]><![CDATA[second]]></root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "firstsecond",
            });
        });

        it("parses mixed content with CDATA", () => {
            const xml = "<root>before<![CDATA[cdata]]>after<child/>end</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "beforecdataafterend",
                children: [
                    {
                        name: "child",
                    },
                ],
            });
        });
    });

    describe("skip non XML content", () => {
        it("parses XML with processing instructions", () => {
            const xml =
                '<?xml version="1.0"?><?custom data?><root>content</root>';
            expect(parse(xml)).toEqual({
                name: "root",
                text: "content",
            });
        });

        it("parses XML with DOCTYPE declaration", () => {
            const xml = "<!DOCTYPE html><root>content</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "content",
            });
        });

        it("parses XML with DOCTYPE containing internal subset", () => {
            const xml =
                "<!DOCTYPE root [<!ELEMENT br EMPTY>]><root>content</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "content",
            });
        });

        it("parses XML with comment", () => {
            const xml = "<!-- comment --><root><!-- comment -->content</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "content",
            });
        });

        it("parses XML with mixed misc content", () => {
            const xml =
                '<?xml version="1.0"?><!-- comment --><!DOCTYPE html><root>content</root>';
            expect(parse(xml)).toEqual({
                name: "root",
                text: "content",
            });
        });

        it("parses XML with processing instructions inside elements", () => {
            const xml = "<root>before<?custom data?>after</root>";
            expect(parse(xml)).toEqual({
                name: "root",
                text: "beforeafter",
            });
        });
    });

    describe("error handling", () => {
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

        it("throws error on empty input", () => {
            const xml = "";
            expect(() => parse(xml)).toThrow(
                `Expected element start '<' at 0. Near: ""`,
            );
        });

        it("throws error on unclosed tags", () => {
            const xml = "<root><child>";
            expect(() => parse(xml)).toThrow(
                `Unclosed element <child> at 13. Near: "<root><child>"`,
            );
        });

        it("throws error on unclosed root element with content", () => {
            const xml = "<root>some text without closing tag";
            expect(() => parse(xml)).toThrow(
                `Unclosed element <root> at 35. Near: "<root>some text without closing tag"`,
            );
        });

        it("throws error on unclosed attribute", () => {
            const xml = '<root attr="unclosed>';
            expect(() => parse(xml)).toThrow(
                'Unclosed attribute value at 21. Near: "<root attr="unclosed>"',
            );
        });

        it("throws error on unclosed DOCTYPE", () => {
            const xml = "<!DOCTYPE html [<!ELEMENT br EMPTY<root>test</root>";
            expect(() => parse(xml)).toThrow(
                'Unclosed DOCTYPE at 52. Near: "ml [<!ELEMENT br EMPTY<root>test</root>"',
            );
        });

        it("throws error on unclosed CDATA section", () => {
            const xml = "<root><![CDATA[unclosed</root>";
            expect(() => parse(xml)).toThrow(
                `Expected "]]>" at 15. Near: "<root><![CDATA[unclosed</root>"`,
            );
        });

        it("throws error on unclosed comment", () => {
            const xml = "<root><!-- unclosed comment</root>";
            expect(() => parse(xml)).toThrow(
                `Expected "-->" at 6. Near: "<root><!-- unclosed comment</root>"`,
            );
        });

        it("throws error on unclosed processing instruction", () => {
            const xml = "<root><?test unclosed</root>";
            expect(() => parse(xml)).toThrow(
                `Expected "?>" at 6. Near: "<root><?test unclosed</root>"`,
            );
        });
    });
});
