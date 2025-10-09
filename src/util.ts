import { InvalidInputError } from "./error";
import type { NodeLike } from "./parser";

export const getChild = (
    node: NodeLike,
    name: string,
): NodeLike | undefined => {
    return node.children?.find((v) => v.name === name);
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
