import { InvalidInputError } from "./error";
import { type NodeLike, type ParseOptions, parse } from "./parser";
import { getChild, parseBooleanOrFail, parseNumberOrFail } from "./util";

export interface Schema<T, Optional extends boolean> {
    decode: (node: NodeLike) => Optional extends true ? T | undefined : T;

    parse: (
        xml: string,
        options?: ParseOptions,
    ) => Promise<Optional extends true ? T | undefined : T>;
}

export type Infer<S> = S extends Schema<infer T, boolean> ? T : never;

export class AttributeSchema<T, Optional extends boolean>
    implements Schema<T, Optional>
{
    constructor(
        private readonly name: string,
        private readonly optional: Optional,
        private readonly map: (v: string) => T,
    ) {}

    decode(node: NodeLike): Optional extends true ? T | undefined : T {
        const value = node.attributes?.[this.name];
        if (value === undefined) {
            if (this.optional) {
                // @ts-expect-error returns undefined when optional is true
                return undefined;
            } else {
                throw new InvalidInputError("Missing required value");
            }
        }
        return this.map(value);
    }

    async parse(
        xml: string,
        options?: ParseOptions,
    ): Promise<Optional extends true ? T | undefined : T> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}

export const stringAttributeSchema = <Optional extends boolean>(
    name: string,
    optional: Optional,
) => new AttributeSchema(name, optional, (v) => v);

export const numberAttributeSchema = <Optional extends boolean>(
    name: string,
    optional: Optional,
) => new AttributeSchema(name, optional, parseNumberOrFail);

export const booleanAttributeSchema = <Optional extends boolean>(
    name: string,
    optional: Optional,
) => new AttributeSchema(name, optional, parseBooleanOrFail);

export class ValueSchema<T> implements Schema<T, false> {
    constructor(private readonly map: (v: string) => T) {}

    decode(node: NodeLike): T {
        const value = node.text ?? "";
        return this.map(value);
    }

    async parse(xml: string, options?: ParseOptions): Promise<T> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}

export const stringValueSchema = new ValueSchema<string>((v) => v);

export const numberValueSchema = new ValueSchema<number>(parseNumberOrFail);

export const booleanValueSchema = new ValueSchema<boolean>(parseBooleanOrFail);

export class ElementSchema<T, Optional extends boolean>
    implements Schema<T, Optional>
{
    constructor(
        private readonly name: string,
        private readonly schema: Schema<T, Optional>,
        private readonly optional: Optional,
    ) {}

    decode(node: NodeLike): Optional extends true ? T | undefined : T {
        const child = getChild(node, this.name);
        if (child === undefined) {
            if (this.optional) {
                // @ts-expect-error returns undefined when optional is true
                return undefined;
            } else {
                throw new InvalidInputError("Missing required value");
            }
        }
        return this.schema.decode(child);
    }

    async parse(
        xml: string,
        options?: ParseOptions,
    ): Promise<Optional extends true ? T | undefined : T> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}

export class ObjectSchema<T extends Record<string, unknown>>
    implements Schema<T, false>
{
    constructor(
        private readonly children: Record<
            string,
            AttributeSchema<unknown, boolean> | ElementSchema<unknown, boolean>
        >,
    ) {}

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

export class ArraySchema<T, Optional extends boolean>
    implements Schema<T[], Optional>
{
    constructor(
        private readonly schema: Schema<T, boolean>,
        private readonly optional: Optional,
    ) {}

    decode(node: NodeLike): Optional extends true ? T[] | undefined : T[] {
        const children = node.children;
        if (children === undefined) {
            if (this.optional) {
                // @ts-expect-error returns undefined when optional is true
                return undefined;
            } else {
                throw new InvalidInputError("Missing required value");
            }
        }

        const arr: T[] = [];
        for (const child of children) {
            const value = this.schema.decode(child);
            if (value !== undefined) {
                arr.push(value);
            }
        }
        return arr;
    }

    async parse(
        xml: string,
        options?: ParseOptions,
    ): Promise<Optional extends true ? T[] | undefined : T[]> {
        const node = await parse(xml, options);
        return this.decode(node);
    }
}
