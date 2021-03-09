import SQLConditionBuilder from "./src/sql-condition-builder";
import assert from "assert";

const builder = new SQLConditionBuilder();

describe("plain content", () => {
  it("should generate correct condition from object", () => {
    const obj = { test: "xxx", hello: "wor'ld", number: 25 };
    const cond = builder.build(obj);

    assert.equal(cond, "test = 'xxx' AND hello = 'wor\\'ld' AND number = 25");
  });

  it("should generate correct condition from array", () => {
    const arr = ["test='xxx'", "hello='world'", "number=25", "value=`value`"];
    const cond = builder.build(arr);

    assert.equal(
      cond,
      "test='xxx' OR hello='world' OR number=25 OR value=`value`"
    );
  });
});

describe("nested content", () => {
  it("should generate correct condition from nested objects/arrays", () => {
    const obj = {
      ignoredKey: [
        { aa: "aa", bb: "bb" },
        { xx: "yy", yy: "xx" },
      ],
      test: 125,
    };
    const arr = [
      {
        ignoredKey: [
          { aa: "aa", bb: "bb" },
          { xx: "yy", yy: "xx" },
        ],
      },
      { test: 125 },
    ];
    const cond = builder.build(obj);
    const cond2 = builder.build(arr);

    assert.equal(
      cond,
      "(aa = 'aa' AND bb = 'bb' OR xx = 'yy' AND yy = 'xx') AND test = 125"
    );
    assert.equal(
      cond2,
      "(aa = 'aa' AND bb = 'bb' OR xx = 'yy' AND yy = 'xx') OR test = 125"
    );
  });
});

describe("value parsers", () => {
  it("should parse in", () => {
    const obj = {
      inNumber: "[1, 2]",
      inString: "[a, b]",
      inQuoted: '["1", "2"]',
    };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "inNumber IN (1, 2) AND inString IN ('a', 'b') AND inQuoted IN ('1', '2')"
    );
  });
  it("should not parse in for text brackets", () => {
    const obj = { inString: "[a, b]", notInString: "prefix [text] sufix" };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "inString IN ('a', 'b') AND notInString = 'prefix [text] sufix'"
    );
  });
  it("should parse text brackets with quotes", () => {
    const obj = { inString: "['a', 'b']" };
    const cond = builder.build(obj);

    assert.equal(cond, "inString IN ('a', 'b')");
  });
  it("should parse text brackets with double quotes", () => {
    const obj = { inString: `["a", "b"]` };
    const cond = builder.build(obj);

    assert.equal(cond, "inString IN ('a', 'b')");
  });

  it("should parse between", () => {
    const obj = {
      btNumber: "[10 TO 1000]",
      btString: "[a TO z]",
      btQuoted: '["1" TO "10"]',
    };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "btNumber BETWEEN 10 AND 1000 AND btString BETWEEN 'a' AND 'z' AND btQuoted BETWEEN '1' AND '10'"
    );
  });

  it("should parse like", () => {
    const obj = { like: "li*k?" };
    const cond = builder.build(obj);

    assert.equal(cond, "like LIKE 'li%k_'");
  });

  it("should parse not equal", () => {
    const obj = { neNumber: "!25", neString: "!aa", neQuoted: '!"25"' };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "neNumber <> 25 AND neString <> 'aa' AND neQuoted <> '25'"
    );
  });

  it("should parse equal", () => {
    const obj = { eqNumber: 25, eqStrNumber: "25", eqString: "aa" };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "eqNumber = 25 AND eqStrNumber = '25' AND eqString = 'aa'"
    );
  });

  it("should parse greater or equal than", () => {
    const obj = { geNumber: ">=25", geString: ">=aa", geQuoted: '>="25"' };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "geNumber >= 25 AND geString >= 'aa' AND geQuoted >= '25'"
    );
  });

  it("should parse greater than", () => {
    const obj = { gtNumber: ">25", gtString: ">aa", gtQuoted: '>"25"' };
    const cond = builder.build(obj);

    assert.equal(cond, "gtNumber > 25 AND gtString > 'aa' AND gtQuoted > '25'");
  });

  it("should parse less or equal than", () => {
    const obj = { leNumber: "<=25", leString: "<=aa", leQuoted: '<="25"' };
    const cond = builder.build(obj);

    assert.equal(
      cond,
      "leNumber <= 25 AND leString <= 'aa' AND leQuoted <= '25'"
    );
  });

  it("should parse less than", () => {
    const obj = { ltNumber: "<25", ltString: "<aa", ltQuoted: '<"25"' };
    const cond = builder.build(obj);

    assert.equal(cond, "ltNumber < 25 AND ltString < 'aa' AND ltQuoted < '25'");
  });
});

describe("null values", () => {
  it("should recognize null comparisons", () => {
    const obj = { a: null, b: "null", c: "!null" };
    const cond = builder.build(obj);

    assert.equal(cond, "a IS NULL AND b IS NULL AND c IS NOT NULL");
  });
});
