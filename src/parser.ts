import { ParseError } from "./error";

export type NodeLike = {
    name: string;
    attributes?: Record<string, string>;
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

const chunkToString = (ch: string | Uint8Array): string => {
    if (typeof ch === "string") return ch;
    return new TextDecoder("utf-8").decode(ch);
};

export async function parseXML(
    xml: string,
    opts: ParseOptions = {},
): Promise<NodeLike> {
    const iterable = (async function* () {
        yield xml;
    })();
    return parseXMLStream(iterable, opts);
}

export async function parseXMLStream(
    src: AsyncIterable<string | Uint8Array>,
    opts: ParseOptions = {},
): Promise<NodeLike> {
    const parser = new XMLParser(src, opts);
    return parser.parseDocument();
}

class XMLParser {
    private s = "";
    private i = 0;
    private done = false;
    private pullPromise: Promise<void> | null = null;
    private readonly trimText: boolean;
    private readonly maxDepth: number;
    private readonly maxChildren: number;
    private readonly maxAttrs: number;
    private readonly it: AsyncIterator<string | Uint8Array>;

    constructor(src: AsyncIterable<string | Uint8Array>, opts: ParseOptions) {
        this.trimText = opts.trimText ?? false;
        this.maxDepth = opts.maxDepth ?? 64;
        this.maxChildren = opts.maxChildren ?? 2000;
        this.maxAttrs = opts.maxAttrs ?? 128;
        this.it = src[Symbol.asyncIterator]();
    }

    private async ensure(n: number): Promise<void> {
        while (!this.done && this.s.length < this.i + n) {
            if (!this.pullPromise) {
                this.pullPromise = (async () => {
                    const r = await this.it.next();
                    if (r.done) {
                        this.done = true;
                        return;
                    }
                    let chunk = chunkToString(r.value);
                    if (this.s.length === 0 && chunk.charCodeAt(0) === 0xfeff) {
                        // Remove BOM if present
                        chunk = chunk.slice(1);
                    }
                    this.s += chunk;
                })().finally(() => {
                    this.pullPromise = null;
                });
            }
            await this.pullPromise;
        }
    }

    private async read(): Promise<void> {
        await this.ensure(1);
    }

    private eof(): boolean {
        return this.done && this.s.length <= this.i;
    }

    private next(): string | unknown {
        const ch = this.s[this.i];
        this.i++;
        return ch;
    }

    private async startsWith(str: string): Promise<boolean> {
        await this.ensure(str.length);
        return this.s.startsWith(str, this.i);
    }

    private error(msg: string): never {
        const from = Math.max(0, this.i - 40);
        const to = Math.min(this.s.length, this.i + 40);
        const excerpt = this.s.slice(from, to).replace(/\n/g, "\\n");
        throw new ParseError(`${msg} at ${this.i}. Near: "${excerpt}"`);
    }

    private skipWSSync() {
        while (!this.eof() && /\s/.test(this.s[this.i] ?? "")) this.i++;
    }

    private async skipWS() {
        await this.read();
        this.skipWSSync();
    }

    private async expect(x: string) {
        if (!(await this.startsWith(x))) this.error(`Expected "${x}"`);
        this.i += x.length;
    }

    private async readUntil(token: string): Promise<string> {
        let idx = this.s.indexOf(token, this.i);
        while (idx < 0) {
            if (this.done) this.error(`Expected "${token}"`);
            await this.read();
            idx = this.s.indexOf(token, this.i);
        }
        const chunk = this.s.slice(this.i, idx);
        this.i = idx + token.length;
        return chunk;
    }

    private async readName(): Promise<string> {
        await this.read();
        const startCh = this.s[this.i];
        if (!startCh || !/[A-Za-z_]/.test(startCh))
            this.error(`Invalid name start "${startCh ?? ""}"`);
        const start = this.i++;
        while (true) {
            const c = this.s[this.i];
            if (c === undefined) {
                if (this.done) break;
                await this.read();
                continue;
            }
            if (/[A-Za-z0-9._-]/.test(c)) {
                this.i++;
                continue;
            }
            break;
        }
        return this.s.slice(start, this.i);
    }

    private async readAttrValue(): Promise<string> {
        await this.skipWS();
        await this.read();
        const q = this.s[this.i];
        if (q !== `"` && q !== `'`)
            this.error("Expected quoted attribute value");
        this.i++;
        const start = this.i;
        while (true) {
            if (this.i >= this.s.length) {
                if (this.done) this.error("Unclosed attribute value");
                await this.read();
                continue;
            }
            if (this.s[this.i] === q) break;
            this.i++;
        }
        const val = this.s.slice(start, this.i);
        this.i++;
        return val;
    }

    private async readComment() {
        await this.expect("<!--");
        await this.readUntil("-->");
    }

    private async readPI() {
        await this.expect("<?");
        await this.readUntil("?>");
    }

    private async readDOCTYPE() {
        await this.expect("<!DOCTYPE");
        let bracketDepth = 0;
        while (true) {
            await this.read();
            const ch = this.next();
            if (ch === "[") bracketDepth++;
            else if (ch === "]" && 0 < bracketDepth) bracketDepth--;
            else if (ch === ">" && bracketDepth === 0) break;
        }
    }

    private async skipMisc() {
        await this.skipWS();
        while (!this.eof()) {
            if (await this.startsWith("<!--")) {
                await this.readComment();
            } else if (await this.startsWith("<?")) {
                await this.readPI();
            } else if (await this.startsWith("<!DOCTYPE")) {
                await this.readDOCTYPE();
            } else {
                break;
            }
            await this.skipWS();
        }
    }

    async parseDocument(): Promise<NodeLike> {
        await this.skipMisc();
        const root = await this.parseElement(0);
        await this.skipMisc();
        if (1 << 14 < this.i) {
            this.s = this.s.slice(this.i);
            this.i = 0;
        }
        return root;
    }

    private async parseElement(depth: number): Promise<NodeLike> {
        if (this.maxDepth < depth) this.error("Depth limit exceeded");
        await this.skipWS();
        if (!(await this.startsWith("<"))) {
            this.error("Expected element start '<'");
        }
        this.i++;
        const name = await this.readName();
        const attributes: Record<string, string> = {};
        let attrCount = 0;

        while (true) {
            await this.skipWS();
            const ch = this.s[this.i];
            if (ch === "/" || ch === ">") break;
            const name = await this.readName();
            await this.skipWS();
            await this.expect("=");
            attributes[name] = await this.readAttrValue();
            if (this.maxAttrs < ++attrCount) this.error("Too many attributes");
        }

        await this.skipWS();
        if (await this.startsWith("/>")) {
            this.i += 2;
            const node: NodeLike = { name };
            if (attrCount) node.attributes = attributes;
            return node;
        }

        await this.expect(">");
        const children: NodeLike[] = [];
        let textBuf = "";

        while (true) {
            if (this.eof()) this.error(`Unclosed element <${name}>`);
            if (await this.startsWith("</")) {
                this.i += 2;
                const endName = await this.readName();
                if (endName !== name)
                    this.error(
                        `Mismatched closing tag: expected </${name}> got </${endName}>`,
                    );
                await this.skipWS();
                await this.expect(">");
                break;
            }
            if (await this.startsWith("<!--")) {
                await this.readComment();
                continue;
            }
            if (await this.startsWith("<![CDATA[")) {
                this.i += "<![CDATA[".length;
                textBuf += await this.readUntil("]]>");
                continue;
            }
            if (await this.startsWith("<?")) {
                await this.readPI();
                continue;
            }

            const ch = this.s[this.i];
            if (ch === "<") {
                const child = await this.parseElement(depth + 1);
                children.push(child);
                if (this.maxChildren < children.length)
                    this.error("Too many children");
            } else {
                let idx = this.s.indexOf("<", this.i);
                while (idx < 0) {
                    if (this.done) {
                        idx = this.s.length;
                        break;
                    }
                    await this.read();
                    idx = this.s.indexOf("<", this.i);
                }
                textBuf += this.s.slice(this.i, idx);
                this.i = idx;
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
