import 'babel-polyfill';
import assert from 'assert';

import SQLConditionBuilder from './index.js';


var builder = new SQLConditionBuilder();

describe('plain content', function () {
    it('should generate correct condition from object', function () {
        var obj = { test: 'xxx', hello: 'wor\'ld', number: 25 };
        var cond = builder.build(obj);

        assert.equal(cond, 'test = \'xxx\' AND hello = \'wor\\\'ld\' AND number = 25');
    })
    it('should generate correct condition from array', function () {
        var arr = ['test=\'xxx\'', 'hello=\'world\'', 'number=25', 'value=`value`'];
        var cond = builder.build(arr);

        assert.equal(cond, 'test=\'xxx\' OR hello=\'world\' OR number=25 OR value=`value`');
    })
})

describe('nested content', function () {
    it('should generate correct condition from nested objects/arrays', function () {
        var obj = { ignoredKey: [{ aa: 'aa', bb: 'bb' }, { xx: 'yy', yy: 'xx' }], test: 125 };
        var arr = [{ ignoredKey: [{ aa: 'aa', bb: 'bb' }, { xx: 'yy', yy: 'xx' }] }, { test: 125 }];
        var cond = builder.build(obj);
        var cond2 = builder.build(arr);

        assert.equal(cond, '((aa = \'aa\' AND bb = \'bb\') OR (xx = \'yy\' AND yy = \'xx\')) AND test = 125');
        assert.equal(cond2, '(((aa = \'aa\' AND bb = \'bb\') OR (xx = \'yy\' AND yy = \'xx\'))) OR (test = 125)');
    })
})

describe('value parsers', function () {
    it('should parse basic content', function () {
        var obj = { less: '<25', lessEq: '<=52', more: '>125', moreEq: '>=521', notEqual: '!ahoj', equal: 'svete', like: 'li*k?', between: '[10 TO 1000]', in: '[1,2,aa]' };
        var cond = builder.build(obj);

        assert.equal(cond, "less < '25' AND lessEq <= '52' AND more > '125' AND moreEq >= '521' AND notEqual <> 'ahoj' AND equal = 'svete' AND like LIKE 'li%k_' AND between BETWEEN '10' AND '1000' AND in IN ('1','2','aa')")
    })
})

describe('null values', function () {
    it('should recognize null comparisons', function () {
        var obj = { a: null, b: 'null', c: '!null' };
        var cond = builder.build(obj);

        assert.equal(cond, "a IS NULL AND b IS NULL AND c IS NOT NULL");
    })
})
