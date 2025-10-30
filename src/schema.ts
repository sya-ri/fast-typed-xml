import { InvalidInputError } from "./error";
import { type NodeLike, parse } from "./parser";
import { getChild, parseBooleanOrFail, parseNumberOrFail } from "./util";

type MakeOptional<T, Optional extends boolean> = Optional extends true
    ? T | undefined
    : T;

export type Infer<S> = S extends AttributeSchema<infer T, infer Optional>
    ? MakeOptional<T, Optional>
    : S extends ValueSchema<infer T>
      ? T
      : S extends ElementSchema<infer T, infer Optional>
        ? MakeOptional<Infer<T>, Optional>
        : S extends ObjectSchema<infer T, infer _>
          ? { [key in keyof T]: Infer<T[key]> }
          : S extends ArraySchema<infer T, boolean, infer Optional>
            ? MakeOptional<Infer<T>[], Optional>
            : S;

interface Schema<T, Optional extends boolean> {
    decode: (node: NodeLike) => Optional extends true ? T | undefined : T;
}

export class AttributeSchema<const T, const Optional extends boolean>
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
                throw new InvalidInputError(
                    `Missing required value: ${this.name}`,
                );
            }
        }
        return this.map(value);
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

export class ValueSchema<const T> implements Schema<T, false> {
    constructor(private readonly map: (v: string) => T) {}

    decode(node: NodeLike): T {
        const value = node.text ?? "";
        return this.map(value);
    }
}

export const stringValueSchema = new ValueSchema<string>((v) => v);

export const numberValueSchema = new ValueSchema<number>(parseNumberOrFail);

export const booleanValueSchema = new ValueSchema<boolean>(parseBooleanOrFail);

export class ElementSchema<const T, const Optional extends boolean>
    implements Schema<T, Optional>
{
    constructor(
        private readonly name: string,
        private readonly schema: Schema<T, Optional>,
        private readonly optional: Optional,
    ) {}

    decode(node: NodeLike): Optional extends true ? T | undefined : T {
        const child = getChild(node, this.name, true);
        if (child === undefined) {
            if (this.optional) {
                // @ts-expect-error returns undefined when optional is true
                return undefined;
            } else {
                throw new InvalidInputError(
                    `Missing required value: ${this.name}`,
                );
            }
        }
        return this.schema.decode(child);
    }
}

export type PropertySchema =
    | AttributeSchema<unknown, boolean>
    | ElementSchema<unknown, boolean>
    | ArraySchema<unknown, true, boolean>;

export class ObjectSchema<
    const T extends { [key in keyof S]: Infer<S[key]> },
    const S extends Record<string, PropertySchema>,
> implements Schema<T, false>
{
    constructor(private readonly children: S) {}

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

    parse(xml: string): ReturnType<typeof this.decode> {
        const node = parse(xml);
        return this.decode(node);
    }
}

export class ArraySchema<
    const T,
    const IsElement extends boolean,
    const Optional extends boolean,
> implements Schema<T[], Optional>
{
    constructor(
        private readonly name: IsElement extends true ? string : undefined,
        private readonly schema: Schema<T, false>,
        private readonly optional: Optional,
    ) {}

    decode(node: NodeLike): Optional extends true ? T[] | undefined : T[] {
        const children =
            this.name !== undefined
                ? getChild(node, this.name, false)
                : node.children;
        if (children === undefined) {
            if (this.optional) {
                // @ts-expect-error returns undefined when optional is true
                return undefined;
            } else {
                throw new InvalidInputError(
                    `Missing required value: ${node.name}`,
                );
            }
        }

        return children.map((child) => this.schema.decode(child));
    }

    parse(xml: string): ReturnType<typeof this.decode> {
        const node = parse(xml);
        return this.decode(node);
    }
}
