export type NodeLike = {
    name: string;
    attrs?: Record<string, string>;
    children?: NodeLike[];
    text?: string;
};

export type ParseOptions = {
    /** if true, trims text nodes (outside CDATA) */
    trimText?: boolean;
    /** guard: Maximum depth (default 64) */
    maxDepth?: number;
    /** guard: Max children per element (default 2000) */
    maxChildren?: number;
    /** guard: Max attributes per element (default 128) */
    maxAttrs?: number;
};

export function parseXML(xml: string, opts: ParseOptions = {}): NodeLike {
    const p = new XMLMiniParser(xml, opts);
    return p.parseDocument();
}

class XMLMiniParser {
    private i = 0;
    private readonly n: number;
    private readonly s: string;
    private readonly trimText: boolean;
    private readonly maxDepth: number;
    private readonly maxChildren: number;
    private readonly maxAttrs: number;

    constructor(xml: string, opts: ParseOptions) {
        // Strip BOM if present
        if (xml.charCodeAt(0) === 0xfeff) xml = xml.slice(1);
        this.s = xml;
        this.n = xml.length;
        this.trimText = opts.trimText ?? false;
        this.maxDepth = opts.maxDepth ?? 64;
        this.maxChildren = opts.maxChildren ?? 2000;
        this.maxAttrs = opts.maxAttrs ?? 128;
    }

    parseDocument(): NodeLike {
        this.skipMisc();
        const root = this.parseElement(0);
        this.skipMisc();
        return root;
    }

    private eof() {
        return this.n <= this.i;
    }

    private peek() {
        return this.s[this.i];
    }

    private next() {
        return this.s[this.i++];
    }

    private startsWith(str: string) {
        return this.s.startsWith(str, this.i);
    }

    private error(msg: string): never {
        const from = Math.max(0, this.i - 20);
        const to = Math.min(this.n, this.i + 20);
        const excerpt = this.s.slice(from, to).replace(/\n/g, "\\n");
        throw new Error(`${msg} at ${this.i}. Near: "${excerpt}"`);
    }

    private skipWS() {
        // biome-ignore lint/style/noNonNullAssertion: already checked for EOF
        while (!this.eof() && /\s/.test(this.peek()!)) this.i++;
    }

    // Skip comments, PI, DOCTYPE junk around root
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

    private readUntil(str: string) {
        const idx = this.s.indexOf(str, this.i);
        if (idx < 0) this.error(`Expected "${str}"`);
        const chunk = this.s.slice(this.i, idx);
        this.i = idx + str.length;
        return chunk;
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
        // naive: consume until '>' (doesn't handle internal subset with '>')
        // handle internal subset with brackets by counting '[' ... ']'
        let depth = 0;
        while (!this.eof()) {
            const ch = this.next();
            if (ch === "[") depth++;
            else if (ch === "]" && depth > 0) depth--;
            else if (ch === ">" && depth === 0) break;
        }
    }

    private expect(x: string) {
        if (!this.startsWith(x)) this.error(`Expected "${x}"`);
        this.i += x.length;
    }

    private readName(): string {
        // XML Name (very simplified): [A-Za-z_][A-Za-z0-9._-]*
        const start = this.i;
        if (this.eof()) this.error("Unexpected EOF while reading name");
        // biome-ignore lint/style/noNonNullAssertion: already checked for EOF
        const head = this.peek()!;
        if (!/[A-Za-z_]/.test(head)) this.error(`Invalid name start "${head}"`);
        this.i++;
        while (!this.eof()) {
            // biome-ignore lint/style/noNonNullAssertion: already checked for EOF
            const c = this.peek()!;
            if (/[A-Za-z0-9._-]/.test(c)) this.i++;
            else break;
        }
        return this.s.slice(start, this.i);
    }

    private readAttrValue(): string {
        this.skipWS();
        const q = this.peek();
        if (q !== `"` && q !== `'`)
            this.error("Expected quoted attribute value");
        this.i++; // skip quote
        const start = this.i;
        while (!this.eof() && this.peek() !== q) this.i++;
        if (this.eof()) this.error("Unclosed attribute value");
        const value = this.s.slice(start, this.i);
        this.i++; // skip closing quote
        return value;
    }

    private parseElement(depth: number): NodeLike {
        if (depth > this.maxDepth) this.error("Depth limit exceeded");
        this.skipWS();
        if (!this.startsWith("<")) this.error("Expected element start '<'");
        this.next(); // '<'

        const name = this.readName();
        const attrs: Record<string, string> = {};
        let attrCount = 0;

        // attributes
        while (true) {
            this.skipWS();
            const ch = this.peek();
            if (ch === "/" || ch === ">") break;
            const aname = this.readName();
            this.skipWS();
            this.expect("=");
            attrs[aname] = this.readAttrValue();
            attrCount++;
            if (attrCount > this.maxAttrs) this.error("Too many attributes");
        }

        // Self-closing?
        this.skipWS();
        if (this.startsWith("/>")) {
            this.i += 2;
            const node: NodeLike = { name };
            if (attrCount) node.attrs = attrs;
            return node;
        }

        this.expect(">");

        // content
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
                const raw = this.readUntil("]]>");
                textBuf += raw; // CDATA: no entity decoding
                continue;
            }
            if (this.startsWith("<?")) {
                this.readPI();
                continue;
            }

            const ch = this.peek();
            if (ch === "<") {
                // child element
                const child = this.parseElement(depth + 1);
                children.push(child);
                if (this.maxChildren < children.length)
                    this.error("Too many children");
            } else {
                // text node
                const start = this.i;
                while (!this.eof() && this.peek() !== "<") this.i++;
                textBuf += this.s.slice(start, this.i);
            }
        }

        const node: NodeLike = { name };
        if (attrCount) node.attrs = attrs;
        const text = this.trimText ? textBuf.trim() : textBuf;
        if (children.length) node.children = children;
        if (text?.length) node.text = text;
        return node;
    }
}
