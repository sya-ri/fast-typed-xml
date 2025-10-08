export class ParseError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "ParseError";
    }
}

export class InvalidInputError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "InvalidInputError";
    }
}
