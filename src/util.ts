import { InvalidInputError } from "./error";
import type { NodeLike } from "./parser";

export const getAttribute = (
    node: NodeLike,
    name: string,
): string | undefined => {
    return node.attributes?.[name];
};

export const getElement = (
    node: NodeLike,
    name: string,
): string | undefined => {
    return node.children?.find((v) => v.name === name)?.text;
};

export const parseNumberOrFail = (value: string): number => {
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new InvalidInputError(`Invalid number: ${value}`);
    }
    return num;
};

export const parseBooleanOrFail = (value: string): boolean => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new InvalidInputError(`Invalid boolean: ${value}`);
};
