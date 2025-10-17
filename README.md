# typed-xml

A high-performance, schema-based XML parser for TypeScript with strong type safety.

## Benchmarks

![](benchmark/result.png)

The chart compares the throughput (operations per second) of three XML parsers.
fast-xml-parser achieves 7,060 ops/s, and xml2js follows closely with 6,681 ops/s.
In contrast, typed-xml reaches 40,716 ops/s, which is about **5.8× faster than fast-xml-parser and 6.1× faster than xml2js**.
This clearly shows that typed-xml delivers far superior performance, providing high-speed XML parsing suitable for demanding real-time or large-scale applications.
