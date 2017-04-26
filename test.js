import assert from 'assert'

import SQLConditionBuilder from './src/sql-condition-builder'


const builder = new SQLConditionBuilder()

describe("plain content", () => {
  it("should generate correct condition from object", () => {
    const obj = { test: "xxx", hello: "wor'ld", number: 25 }
    const cond = builder.build(obj)

    assert.equal(cond, "test = 'xxx' AND hello = 'wor\\'ld' AND number = 25")
  })

  it("should generate correct condition from array", () => {
    const arr = ["test='xxx'", "hello='world'", "number=25", "value=`value`"]
    const cond = builder.build(arr)

    assert.equal(cond, "test='xxx' OR hello='world' OR number=25 OR value=`value`")
  })
})

describe("nested content", () => {
  it("should generate correct condition from nested objects/arrays", () => {
    const obj = { ignoredKey: [{ aa: "aa", bb: "bb" }, { xx: "yy", yy: "xx" }], test: 125 }
    const arr = [{ ignoredKey: [{ aa: "aa", bb: "bb" }, { xx: "yy", yy: "xx" }] }, { test: 125 }]
    const cond = builder.build(obj)
    const cond2 = builder.build(arr)

    assert.equal(cond, "(aa = 'aa' AND bb = 'bb' OR xx = 'yy' AND yy = 'xx') AND test = 125")
    assert.equal(cond2, "(aa = 'aa' AND bb = 'bb' OR xx = 'yy' AND yy = 'xx') OR test = 125")
  })
})

describe("value parsers", () => {
  it("should parse basic content", () => {
    const obj = {
      less: "<25",
      lessEq: "<=52",
      more: ">125",
      moreEq: ">=521",
      notEqual: "!ahoj",
      equal: "svete",
      like: "li*k?",
      between: "[10 TO 1000]",
      in: "[1,2,aa]",
      in2: "[aa]",
      in3: '["aa","bb"]'
    }
    const cond = builder.build(obj)

    assert.equal(
      cond,
      "less < '25' AND lessEq <= '52' AND more > '125' AND moreEq >= '521' AND notEqual <> 'ahoj' AND equal = 'svete' AND like LIKE 'li%k_' AND between BETWEEN '10' AND '1000' AND in IN ('1','2','aa') AND in2 IN ('aa') AND in3 IN ('aa','bb')"
    )
  })
})

describe("null values", () => {
  it("should recognize null comparisons", () => {
    const obj = { a: null, b: "null", c: "!null" }
    const cond = builder.build(obj)

    assert.equal(cond, "a IS NULL AND b IS NULL AND c IS NOT NULL")
  })
})
