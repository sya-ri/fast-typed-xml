import * as fs from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { Bench } from "tinybench";
import * as tx from "ts-xml";
import * as txParser from "ts-xml/parser";
import { parseStringPromise } from "xml2js";

const xml = fs.readFileSync("example.xml", "utf-8");

// fast-xml-parser
const parser = new XMLParser({
    ignoreAttributes: false,
});

// ts-xml
const schema = tx.array(
    tx.object({
        id: tx.string("id", "attribute"),
        author: tx.string("author", "element"),
        title: tx.string("title", "element"),
        genre: tx.array("genre", tx.string()),
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
            genre: Array.isArray(book.genre) ? book.genre : [book.genre],
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
                genre: Array.isArray(book.genre) ? book.genre : [book.genre],
                price: Number(book.price),
                publish_date: book.publish_date,
                description: book.description,
            })),
        );
    });

    bench.add("ts-xml (parse only)", async () => {
        txParser.parse(xml);
    });

    let txResult: unknown;
    bench.add("ts-xml", async () => {
        txResult = schema.parse(xml);
    });

    await bench.run();

    console.log("Output:");
    const fxpResultJson = JSON.stringify(fxpResult);
    console.log(`---[ fast-xml-parser (${fxpResultJson.length}) ]---`);
    console.log(fxpResultJson);
    console.log();
    const xml2jsResultJson = JSON.stringify(xml2jsResult);
    console.log(`---[ xml2js (${xml2jsResultJson.length}) ]---`);
    console.log(xml2jsResultJson);
    console.log();
    const txResultJson = JSON.stringify(txResult);
    console.log(`---[ ts-xml (${txResultJson.length}) ]---`);
    console.log(txResultJson);
    console.log();
    console.log(`Result: ${bench.name}`);
    console.table(bench.table());
};

main();
