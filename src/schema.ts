import { InvalidInputError } from "./error";
import { type NodeLike, parse } from "./parser";
import { getChild, parseBooleanOrFail, parseNumberOrFail } from "./util";

export interface Schema<T, Optional extends boolean> {
    decode: (node: NodeLike) => Optional extends true ? T | undefined : T;

    parse: (xml: string) => Optional extends true ? T | undefined : T;
}

export abstract class AbstractSchema<T, Optional extends boolean>
    implements Schema<T, Optional>
{
    abstract decode(node: NodeLike): Optional extends true ? T | undefined : T;

    parse(xml: string): Optional extends true ? T | undefined : T {
        const node = parse(xml);
        return this.decode(node);
    }
}

export class AttributeSchema<
    T,
    Optional extends boolean,
> extends AbstractSchema<T, Optional> {
    constructor(
        private readonly name: string,
        private readonly optional: Optional,
        private readonly map: (v: string) => T,
    ) {
        super();
    }

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

export class ValueSchema<T> extends AbstractSchema<T, false> {
    constructor(private readonly map: (v: string) => T) {
        super();
    }

    decode(node: NodeLike): T {
        const value = node.text ?? "";
        return this.map(value);
    }
}

export const stringValueSchema = new ValueSchema<string>((v) => v);

export const numberValueSchema = new ValueSchema<number>(parseNumberOrFail);

export const booleanValueSchema = new ValueSchema<boolean>(parseBooleanOrFail);

export class ElementSchema<T, Optional extends boolean> extends AbstractSchema<
    T,
    Optional
> {
    constructor(
        private readonly name: string,
        private readonly schema: Schema<T, Optional>,
        private readonly optional: Optional,
    ) {
        super();
    }

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

export class ObjectSchema<
    T extends Record<string, unknown>,
> extends AbstractSchema<T, false> {
    constructor(
        private readonly children: Record<
            string,
            | AttributeSchema<unknown, boolean>
            | ElementSchema<unknown, boolean>
            | ArraySchema<unknown, true, boolean>
        >,
    ) {
        super();
    }

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
}

export class ArraySchema<
    T,
    IsElement extends boolean,
    Optional extends boolean,
> extends AbstractSchema<T[], Optional> {
    constructor(
        private readonly name: IsElement extends true ? string : undefined,
        private readonly schema: Schema<T, boolean>,
        private readonly optional: Optional,
    ) {
        super();
    }

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

        const arr: T[] = [];
        for (const child of children) {
            const value = this.schema.decode(child);
            if (value !== undefined) {
                arr.push(value);
            }
        }
        return arr;
    }
}
