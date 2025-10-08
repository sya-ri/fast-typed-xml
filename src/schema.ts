import { InvalidInputError } from "./error";
import { type NodeLike, type ParseOptions, parse } from "./parser";
import {
    getAttribute,
    getElement,
    parseBooleanOrFail,
    parseNumberOrFail,
} from "./util";

export interface Schema<T> {
    decode: (node: NodeLike) => T;
}

export interface RootableSchema<T> extends Schema<T> {
    parse: (xml: string, options?: ParseOptions) => Promise<T>;
}

export type OptionalSchema<T> = Schema<T | undefined>;

export class RequiredSchema<T> implements Schema<T> {
    constructor(private readonly schema: Schema<T | undefined>) {}

    decode: (node: NodeLike) => T = (node) => {
        const value = this.schema.decode(node);
        if (value === undefined) {
            throw new InvalidInputError("Missing required value");
        }
        return value;
    };
}

export type Infer<S> = S extends Schema<infer T> ? T : never;

export class StringAttributeSchema implements Schema<string | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): string | undefined {
        return getAttribute(node, this.name);
    }
}

export class StringElementSchema implements Schema<string | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): string | undefined {
        return getElement(node, this.name);
    }
}

export class NumberAttributeSchema implements Schema<number | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): number | undefined {
        const value = getAttribute(node, this.name);
        if (value === undefined) return undefined;
        return parseNumberOrFail(value);
    }
}

export class NumberElementSchema implements Schema<number | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): number | undefined {
        const value = getElement(node, this.name);
        if (value === undefined) return undefined;
        return parseNumberOrFail(value);
    }
}

export class BooleanAttributeSchema implements Schema<boolean | undefined> {
    constructor(private readonly name: string) {}

    decode(node: NodeLike): boolean | undefined {
        const value = getAttribute(node, this.name);
        if (value === undefined) return undefined;
        return parseBooleanOrFail(value);
    }
}

export class BooleanElementSchema implements Schema<boolean | undefined> {
    constructor(readonly name: string) {}

    decode(node: NodeLike): boolean | undefined {
        const value = getElement(node, this.name);
        if (value === undefined) return undefined;
        return parseBooleanOrFail(value);
    }
}

export class ObjectSchema<T extends Record<string, unknown>>
    implements RootableSchema<T>
{
    constructor(private readonly children: Record<string, Schema<unknown>>) {}

    decode(node: NodeLike): T {
        const obj: Record<string, unknown> = {};
        for (const [key, schema] of Object.entries(this.children)) {
            const value = schema.decode(node);
            if (value !== undefined) {
                obj[key] = value;
            }
        }
        return obj as T;
    }

    async parse(xml: string, options?: ParseOptions): Promise<T> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}

export class ArraySchema<T extends Record<string, unknown>>
    implements RootableSchema<T[]>
{
    constructor(private readonly children: Record<string, Schema<unknown>>) {}

    decode(node: NodeLike): T[] {
        const arr: T[] = [];
        for (const child of node.children ?? []) {
            const obj: Record<string, unknown> = {};
            for (const [key, schema] of Object.entries(this.children)) {
                const value = schema.decode(child);
                if (value !== undefined) {
                    obj[key] = value;
                }
            }
            arr.push(obj as T);
        }
        return arr;
    }

    async parse(xml: string, options?: ParseOptions): Promise<T[]> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}
