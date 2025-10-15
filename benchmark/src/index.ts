import * as fs from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { Bench } from "tinybench";
import * as tx from "typed-xml";
import * as txParser from "typed-xml/parser";
import { parseStringPromise } from "xml2js";

const xml = fs.readFileSync("example.xml", "utf-8");

// fast-xml-parser
const parser = new XMLParser({
    ignoreAttributes: false,
});

// typed-xml
const schema = tx.array(
    tx.object({
        id: tx.string("id", "attribute"),
        author: tx.string("author", "element"),
        title: tx.string("title", "element"),
        genre: tx.string("genre", "element"),
        price: tx.number("price", "element"),
        publish_date: tx.string("publish_date", "element"),
        description: tx.string("description", "element"),
    }),
);

const main = async () => {
    const bench = new Bench({
        name: "Example Benchmark (4.3kB)",
    });

    let fxpResult: unknown;
    bench.add("fast-xml-parser", async () => {
        const parsed = parser.parse(xml);
        // biome-ignore lint/suspicious/noExplicitAny: ignore type
        fxpResult = parsed.catalog.book.map((book: any) => ({
            id: book["@_id"],
            author: book.author,
            title: book.title,
            genre: book.genre,
            price: book.price,
            publish_date: book.publish_date,
            description: book.description,
        }));
    });

    let xml2jsResult: unknown;
    bench.add("xml2js", async () => {
        xml2jsResult = await parseStringPromise(xml, {
            explicitArray: false,
        }).then((parsed) =>
            // biome-ignore lint/suspicious/noExplicitAny: ignore type
            parsed.catalog.book.map((book: any) => ({
                id: book.$.id,
                author: book.author,
                title: book.title,
                genre: book.genre,
                price: Number(book.price),
                publish_date: book.publish_date,
                description: book.description,
            })),
        );
    });

    bench.add("typed-xml (parse only)", async () => {
        txParser.parse(xml);
    });

    let txResult: unknown;
    bench.add("typed-xml", async () => {
        txResult = schema.parse(xml);
    });

    await bench.run();

    console.log("Output:");
    console.log("---[ fast-xml-parser ]---");
    console.log(JSON.stringify(fxpResult));
    console.log();
    console.log("---[ xml2js ]---");
    console.log(JSON.stringify(xml2jsResult));
    console.log();
    console.log("---[ typed-xml ]---");
    console.log(JSON.stringify(txResult));
    console.log();
    console.log(`Result: ${bench.name}`);
    console.table(bench.table());
};

main();
