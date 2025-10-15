import { ParseError } from "./error";

export type NodeLike = {
    name: string;
    attributes?: Record<string, string>;
    children?: NodeLike[];
    text?: string;
};

export type ParseOptions = {
    /**
     * If true, trims text nodes (outside CDATA)
     */
    trimText?: boolean;

    /**
     * Maximum element nesting depth
     * @default 64
     */
    maxDepth?: number;

    /**
     * Maximum number of children per element
     * @default 2000
     */
    maxChildren?: number;

    /**
     * Maximum number of attributes per element
     * @default 128
     */
    maxAttributes?: number;
};

export function parse(xml: string, options: ParseOptions = {}): NodeLike {
    const parser = new XMLParser(xml, options);
    return parser.parseDocument();
}

class XMLParser {
    private s: string;
    private i = 0;
    private readonly trimText: boolean;
    private readonly maxDepth: number;
    private readonly maxChildren: number;
    private readonly maxAttributes: number;

    constructor(src: string, options: ParseOptions) {
        this.s = src;
        this.trimText = options.trimText ?? false;
        this.maxDepth = options.maxDepth ?? 64;
        this.maxChildren = options.maxChildren ?? 2000;
        this.maxAttributes = options.maxAttributes ?? 128;
    }

    private eof(): boolean {
        return this.s.length <= this.i;
    }

    private next(): string | unknown {
        const ch = this.s[this.i];
        this.i++;
        return ch;
    }

    private startsWith(str: string): boolean {
        const len = str.length;
        if (this.i + len > this.s.length) return false;
        for (let j = 0; j < len; j++) {
            if (this.s.charCodeAt(this.i + j) !== str.charCodeAt(j)) {
                return false;
            }
        }
        return true;
    }

    private error(msg: string): never {
        const from = Math.max(0, this.i - 40);
        const to = Math.min(this.s.length, this.i + 40);
        const excerpt = this.s.slice(from, to).replace(/\n/g, "\\n");
        throw new ParseError(`${msg} at ${this.i}. Near: "${excerpt}"`);
    }

    private skipWSSync() {
        while (this.i < this.s.length) {
            const code = this.s.charCodeAt(this.i);
            // space(32), tab(9), newline(10), carriage return(13)
            if (code !== 32 && code !== 9 && code !== 10 && code !== 13) break;
            this.i++;
        }
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
        this.skipWSSync();
    }

    private expect(x: string) {
        if (!this.startsWith(x)) this.error(`Expected "${x}"`);
        this.i += x.length;
    }

    private readUntil(token: string): string {
        const idx = this.s.indexOf(token, this.i);
        if (idx < 0) this.error(`Expected "${token}"`);
        const chunk = this.s.slice(this.i, idx);
        this.i = idx + token.length;
        return chunk;
    }

    private readName(): string {
        const startCode = this.s.charCodeAt(this.i);
        if (!this.isNameStartChar(startCode)) this.error(`Invalid name start`);
        const start = this.i++;
        while (
            this.i < this.s.length &&
            this.isNameChar(this.s.charCodeAt(this.i))
        ) {
            this.i++;
        }
        return this.s.slice(start, this.i);
    }

    private readAttrValue(): string {
        this.skipWS();
        const q = this.s[this.i];
        if (q !== `"` && q !== `'`)
            this.error("Expected quoted attribute value");
        this.i++;
        const start = this.i;
        while (this.i < this.s.length && this.s[this.i] !== q) {
            this.i++;
        }
        if (this.i >= this.s.length) this.error("Unclosed attribute value");
        const val = this.s.slice(start, this.i);
        this.i++;
        return val;
    }

    private readComment() {
        this.expect("<!--");
        this.readUntil("-->");
    }

    private readPI() {
        this.expect("<?");
        this.readUntil("?>");
    }

    private readDOCTYPE() {
        this.expect("<!DOCTYPE");
        let bracketDepth = 0;
        while (true) {
            const ch = this.next();
            if (ch === "[") bracketDepth++;
            else if (ch === "]" && 0 < bracketDepth) bracketDepth--;
            else if (ch === ">" && bracketDepth === 0) break;
        }
    }

    private skipMisc() {
        this.skipWS();
        while (!this.eof()) {
            if (this.startsWith("<!--")) {
                this.readComment();
            } else if (this.startsWith("<?")) {
                this.readPI();
            } else if (this.startsWith("<!DOCTYPE")) {
                this.readDOCTYPE();
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
        if (1 << 14 < this.i) {
            this.s = this.s.slice(this.i);
            this.i = 0;
        }
        return root;
    }

    private parseElement(depth: number): NodeLike {
        if (this.maxDepth < depth) this.error("Depth limit exceeded");
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
            const ch = this.s[this.i];
            if (ch === "/" || ch === ">") break;
            const name = this.readName();
            this.skipWS();
            this.expect("=");
            attributes[name] = this.readAttrValue();
            if (this.maxAttributes < ++attrCount)
                this.error("Too many attributes");
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
        let textBuf = "";

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
                this.readComment();
                continue;
            }
            if (this.startsWith("<![CDATA[")) {
                this.i += "<![CDATA[".length;
                textBuf += this.readUntil("]]>");
                continue;
            }
            if (this.startsWith("<?")) {
                this.readPI();
                continue;
            }

            const ch = this.s[this.i];
            if (ch === "<") {
                const child = this.parseElement(depth + 1);
                children.push(child);
                if (this.maxChildren < children.length)
                    this.error("Too many children");
            } else {
                const idx = this.s.indexOf("<", this.i);
                if (idx < 0) {
                    textBuf += this.s.slice(this.i);
                    this.i = this.s.length;
                } else {
                    textBuf += this.s.slice(this.i, idx);
                    this.i = idx;
                }
            }
        }

        const node: NodeLike = { name };
        if (attrCount) node.attributes = attributes;
        const text = this.trimText ? textBuf.trim() : textBuf;
        if (children.length) node.children = children;
        if (text?.length) node.text = text;
        if (1 << 14 < this.i) {
            this.s = this.s.slice(this.i);
            this.i = 0;
        }
        return node;
    }
}
