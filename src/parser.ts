import { ParseError } from "./error";

export type NodeLike = {
    name: string;
    attributes?: Record<string, string>;
    children?: NodeLike[];
    text?: string;
};

export function parse(xml: string): NodeLike {
    const parser = new XMLParser(xml);
    return parser.parseDocument();
}

class XMLParser {
    private i = 0;

    constructor(private readonly src: string) {}

    private eof(): boolean {
        return this.src.length <= this.i;
    }

    private startsWith(str: string): boolean {
        const len = str.length;
        if (this.i + len > this.src.length) return false;
        for (let j = 0; j < len; j++) {
            if (this.src.charCodeAt(this.i + j) !== str.charCodeAt(j)) {
                return false;
            }
        }
        return true;
    }

    private error(msg: string): never {
        const from = Math.max(0, this.i - 40);
        const to = Math.min(this.src.length, this.i + 40);
        const excerpt = this.src.slice(from, to).replace(/\n/g, "\\n");
        throw new ParseError(`${msg} at ${this.i}. Near: "${excerpt}"`);
    }

    private isNameStartChar(code: number): boolean {
        return (
            (code >= 65 && code <= 90) || // A-Z
            (code >= 97 && code <= 122) || // a-z
            code === 95 // _
        );
    }

    private isNameChar(code: number): boolean {
        return (
            (code >= 48 && code <= 57) || // 0-9
            (code >= 65 && code <= 90) || // A-Z
            (code >= 97 && code <= 122) || // a-z
            code === 46 || // .
            code === 95 || // _
            code === 45 // -
        );
    }

    private skipWS() {
        while (this.i < this.src.length) {
            const code = this.src.charCodeAt(this.i);
            // space(32), tab(9), newline(10), carriage return(13)
            if (code !== 32 && code !== 9 && code !== 10 && code !== 13) break;
            this.i++;
        }
    }

    private expect(x: string) {
        if (!this.startsWith(x)) this.error(`Expected "${x}"`);
        this.i += x.length;
    }

    private readUntil(token: string): string {
        const idx = this.src.indexOf(token, this.i);
        if (idx < 0) this.error(`Expected "${token}"`);
        const chunk = this.src.slice(this.i, idx);
        this.i = idx + token.length;
        return chunk;
    }

    private readName(): string {
        const startCode = this.src.charCodeAt(this.i);
        if (!this.isNameStartChar(startCode)) this.error(`Invalid name start`);
        const start = this.i++;
        while (
            this.i < this.src.length &&
            this.isNameChar(this.src.charCodeAt(this.i))
        ) {
            this.i++;
        }
        return this.src.slice(start, this.i);
    }

    private readAttrValue(): string {
        this.skipWS();
        const q = this.src[this.i];
        if (q !== `"` && q !== `'`)
            this.error("Expected quoted attribute value");
        this.i++;
        const start = this.i;
        while (this.i < this.src.length && this.src[this.i] !== q) {
            this.i++;
        }
        if (this.i >= this.src.length) this.error("Unclosed attribute value");
        const val = this.src.slice(start, this.i);
        this.i++;
        return val;
    }

    private skipMisc() {
        this.skipWS();
        while (!this.eof()) {
            if (this.startsWith("<!--")) {
                this.readUntil("-->");
            } else if (this.startsWith("<?")) {
                this.readUntil("?>");
            } else if (this.startsWith("<!DOCTYPE")) {
                // DOCTYPE declarations can contain nested brackets for DTD internal subset
                // Example: <!DOCTYPE root [<!ELEMENT br EMPTY>]>
                // We need to track bracket depth to find the correct closing angle bracket
                let bracketDepth = 0;
                while (true) {
                    const ch = this.src[this.i];
                    this.i++;
                    if (ch === "[") bracketDepth++;
                    else if (ch === "]" && 0 < bracketDepth) bracketDepth--;
                    else if (ch === ">" && bracketDepth === 0) break;
                    else if (ch === undefined) this.error("Unclosed DOCTYPE");
                }
            } else {
                break;
            }
            this.skipWS();
        }
    }

    parseDocument(): NodeLike {
        this.skipMisc();
        const root = this.parseElement(0);
        this.skipMisc();
        return root;
    }

    private parseElement(depth: number): NodeLike {
        this.skipWS();
        if (!this.startsWith("<")) {
            this.error("Expected element start '<'");
        }
        this.i++;
        const name = this.readName();
        const attributes: Record<string, string> = {};
        let attrCount = 0;

        while (true) {
            this.skipWS();
            const ch = this.src[this.i];
            if (ch === "/" || ch === ">") break;
            const name = this.readName();
            this.skipWS();
            this.expect("=");
            attributes[name] = this.readAttrValue();
            ++attrCount;
        }

        this.skipWS();
        if (this.startsWith("/>")) {
            this.i += 2;
            const node: NodeLike = { name };
            if (attrCount) node.attributes = attributes;
            return node;
        }

        this.expect(">");
        const children: NodeLike[] = [];
        let text = "";

        while (true) {
            if (this.eof()) this.error(`Unclosed element <${name}>`);
            if (this.startsWith("</")) {
                this.i += 2;
                const endName = this.readName();
                if (endName !== name)
                    this.error(
                        `Mismatched closing tag: expected </${name}> got </${endName}>`,
                    );
                this.skipWS();
                this.expect(">");
                break;
            }
            if (this.startsWith("<!--")) {
                this.readUntil("-->");
                continue;
            }
            if (this.startsWith("<![CDATA[")) {
                this.i += "<![CDATA[".length;
                text += this.readUntil("]]>");
                continue;
            }
            if (this.startsWith("<?")) {
                this.readUntil("?>");
                continue;
            }

            const ch = this.src[this.i];
            if (ch === "<") {
                const child = this.parseElement(depth + 1);
                children.push(child);
            } else {
                const idx = this.src.indexOf("<", this.i);
                if (idx < 0) {
                    text += this.src.slice(this.i);
                    this.i = this.src.length;
                } else {
                    text += this.src.slice(this.i, idx);
                    this.i = idx;
                }
            }
        }

        const node: NodeLike = { name };
        if (attrCount) node.attributes = attributes;
        if (children.length) node.children = children;
        if (text?.length) node.text = text;
        return node;
    }
}
