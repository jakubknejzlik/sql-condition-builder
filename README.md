# sql-condition-builder

This module builds SQL conditions from plain javascript objects. Objects are parsed as AND and Arrays are parsed as OR. It's primary use case is to build url queries easily with parsed to SQL.

This gives the possibility to...

\`{a:'Hello',b:'!World'} => "a = 'Hello' AND b != 'World'"` *(?a=Hello&b=!World)*


## Installation

	npm install sql-condition-builder

## Basic usage

	var SQLConditionBuilder = require('sql-condition-builder');
	var builder = new SQLConditionBuilder();

	var obj = {a:'Hello',b:'!World'}
	var condition = builder.build(obj); // ->"a = 'Hello' AND b != 'World'"

## Examples

* `{a:'[25 TO 250]'} => "a BETWEEN '25' AND '250` *(?a=[25 TO 250])*
* `{x[{a:'>25'},{b:'<100'}]} => "a > 25 OR b <  100"`*(?x[a]=>25&x[b]=<100)*


NOTE: in last example ***x*** is ignored because it's pointing to array of values (or statement). Keys pointing to Object or Array are ignored from statement.


## Supported values

* **{a:null}** or **{a:'null'}** –> `a IS NULL`
* **{a:'!null'}** –> `a IS NOT NULL`
* **{a:'value'}** –> `a = 'value'`
* **{a:'!value'}** –> `a <> 'value'`
* **{a:'>25'}** –> `a > '25'`
* **{a:'<25'}** –> `a < '25'`
* **{a:'>=25'}** –> `a >= '25'`
* **{a:'<=25'}** –> `a <= '25'`
* **{a:'[2 TO 200]'}** –> `a BETWEEN '2' AND '200'`
* **{a:'[1,2,3,aa]'}** –> `a IN ('1','2','3','aa')`
* **{a:'He?lo wor\*'}** –> `a LIKE 'He_lo wor%'`
