# from.js
from.js is a super fast, extremely-optimized LINQ engine for JavaScript.

## Features
* **High-performance** ([See the benchmark result](https://github.com/suckgamoni/fromjs/blob/work/web/benchmark/result.png))
* Supports most LINQ functions that .NET provides
* 100% lazy evaluation
* Supports lambda expression

## Supported platforms
* Web
* node.js

## This is intended to

* make it easy to use LINQ in JavaScript for whom is familiar with .NET environment.
* provide LINQ features to JavaScript developers without worrying about performance.

## Importing module

**Web**

```html
<script src='from.js'></script>
```

**node.js** (It can be installed by using _npm install fromjs_)

```javascript
var from = require('fromjs');
```
## Basic iteration

You can basically iterate Array, String, Object by using each(). 

```javascript
var array = [1, 2, 3, 4];
from(array).each(function (value, key) {
    console.log('Value ' + value + ' at index ' + key);
});

// Value 1 at index 0
// Value 2 at index 1
// Value 3 at index 2
// Value 4 at index 3
```

```javascript
var o = {foo: 1, bar: 2};
from(o).each(function (value, key) {
    console.log(key + ' = ' + value);
});

// foo = 1
// bar = 2
```

An iteration can be stopped by returning false.

```javascript
var array = [1, 2, 3, 4];
from(array).each(function (value, key) {
    console.log('Value ' + value + ' at index ' + key);
    return value != 2;
});

// Value 1 at index 0
// Value 2 at index 1
```

_broken_ parameter can be used to investigate either the iteration was broken.

```javascript
var array = [1, 2, 3, 4];
var broken = from(array).each(function (value, key) {
    return value != 2;
}).broken;

console.log(broken); // true
```

## Basic query

**Printing numbers less than 5 in an array**
```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 

from(numbers)
    .where(function (value) {
        return value < 5;
    })
    .each(function (value) {
        console.log(value);
    });
```

**Printing each number + 1 in an array**
```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 
      
from(numbers)
    .select(function (value) {
        return value + 1;
    })
    .each(function (value) {
        console.log(value);
    });
```

**Printing the average of top 3 grades**
```javascript
var grades = [ 59, 82, 70, 56, 92, 98, 85 ];
      
var average = from(grades)
                .orderByDesc()
                .take(3)
                .average();
                
console.log(average);
```

## Lambda expression

It will be so tiring work to write every nested function every time. It can be evaded by using lambda expression.
Its format is almost same as C#'s.

Here's an example.

```javascript
function (arg1, arg2, arg3) {
    return arg1 * arg2 + arg3;
}
```

The function given above can be re-written as below using lambda expression.

```
(arg1, arg2, arg3) => arg1 * arg2 + arg3
```

Parentheses can be omitted when it has only one argument.

```
arg1 => arg1 * 3
```

Now let's apply it into real JavaScript code.

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 

from(numbers)
    .where(function (value) {
        return value < 5;
    })
    .each(function (value) {
        console.log(value);
    });
```

The example above can be re-written as below.

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 

from(numbers)
    .where('value => value < 5')
    .each('value => console.log(value)');
```

## Omitting argument list

Lambda expression can be shorten more by omitting argument list.
But how can it be used without any argument specified?
from.js provides several abbreviations which can be used in this case.

| Abbreviation | Meaning                          |
| ------------ | -------------------------------- |
| #n           | The _n_-th argument (zero based) |
| $            | The first argument (same as #0)  |
| $$           | The second argument (same as #1) |
| @            | The last argument                |

For example,

```
(arg0, arg1, arg2, arg3) => arg0 * arg1 + arg2 * arg3
```

the expression above can be shorten as below.

```
#0 * #1 + #2 * #3
```

or

```
$ * $$ + #2 * @
```

Let's apply it into JavaScript code.

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 

from(numbers)
    .where(function (value) {
        return value < 5;
    })
    .each(function (value) {
        console.log(value);
    });
```

The sample above can be shorten as below.

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 
from(numbers).where('$ < 5').each('console.log($)');
```

As you will see, most predicator functions have similar arguments list (except comparers).
In most cases, the first argument means 'value', the second means 'key', and the last means 'external argument'.
(This is the most different part from .NET)
You can habitually consider $ as a value, $$ as a key, and @ as an external argument.

## External argument

Because lambda expressions are given as String, any variables in the current context can't be referenced. For example,

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 
var n = 5;
from(numbers).where('value => value < n').each('value => console.log(value)');
```

this code won't work. Then how can it be get around?
Most predicator functions provided by from.js support external argument.
If an object is given as an external argument, it can be referenced in lambda expression.

The example above should be like this:

```javascript
var numbers = [ 5, 4, 1, 3, 9, 8, 6, 7, 2, 0 ]; 
var n = 5;
from(numbers).where('(value, key, arg) => value < arg', n).each('value => console.log(value)');
// or simply
from(numbers).where('$ < @', n).each('console.log($)');
```

## Some more conveniences on lambda expression

There are still more chances to shorten lambda expressions.

* 'Dot' can be omitted between $,$$,@ and following keyword. For instance, _$length_ will be processed identically as _$.length_.

```javascript
// Print fruit names ordered by its length
var fruits = [ "apple", "passionfruit", "banana", "mango",
    "orange", "blueberry", "grape", "strawberry" ];
from(fruits).orderBy('$length').each('console.log($)');
```

* Referencing array of $,$$,@ can be shorten like this: @[3] --> @3

```javascript
var fruits = [ "apple", "passionfruit", "banana", "mango",
    "orange", "blueberry", "grape", "strawberry" ];
var appleOrBanana = from(fruits).count('$ == @0 || $ == @1', ['apple', 'banana']);
console.log(appleOrBanana); // 2
```

## Empty iterable

 Sometimes it is needed to use an empty iterable object. In this case, simply call from() without any argument,

```javascript
var names1 = [ "Hartono, Tommy" ];
var names2 = [ "Adams, Terry", "Andersen, Henriette Thaulow", "Hedlund, Magnus", "Ito, Shu" ];
var names3 = [ "Solanki, Ajay", "Hoeing, Helge", "Andersen, Henriette Thaulow", "Potra, Cristina", "Iallo, Lucio" ];

var namesList = [ names1, names2, names3 ];

// Only include arrays that have four or more elements
from(namesList)
    .aggregate(from(), "(current, next) => next.length > 3 ? current.union(next) : current")
    .each("console.log($)");
    
/*
 This code produces the following output:

 Adams, Terry
 Andersen, Henriette Thaulow
 Hedlund, Magnus
 Ito, Shu
 Solanki, Ajay
 Hoeing, Helge
 Potra, Cristina
 Iallo, Lucio
*/
```

## Ranged iterable

 It is able to generate a ranged iterable by using from.range().
 
```javascript
from.range(n)                // from 0 to n - 1
from.range(start, end)       // from start to end - 1
from.range(start, end, step) // from start to end - 1, increasing by step
```

```javascript
from.range(4)
    .select("$ * $")
    .each("console.log($)");

/*
 This code produces the following output:
 0
 1
 4
 9
*/
```

```javascript
// Generate a sequence of three integers starting at 4, 
// and then select their squares.
from.range(4, 7)
    .select("$ * $")
    .each("console.log($)");

/*
 This code produces the following output:
 16
 25
 36
*/
```

```javascript
from.range(3, 13, 3)
    .select("$ * $")
    .each("console.log($)");

/*
 This code produces the following output:
 9
 36
 81
 144
*/
```

## Repeator

```javascript
console.log(from.repeat('a', 4).toString());

/*
 This code produces the following output:
 aaaa
*/
```

## Regular expression iteration

```javascript
var myRe = /ab*/g;
var str = "abbcdefabh";

from(myRe).match(str)
    .each(function (m) {
        console.log('Found ' + m +
            '. Next match starts at ' + (m.index + m[0].length));
    });

/*
 This code produces the following output:

  Found abb. Next match starts at 3
  Found ab. Next match starts at 9
*/
```

```javascript
var str = 'Hello world!';
console.log(from(/Hello/g).match(str).any()); // true
console.log(from(/Hello/g, str).any()); // true

console.log(from(/W3Schools/g, str).any()); // false
```

## Supported queries

* [aggregate](https://github.com/suckgamoni/fromjs/wiki/aggregate(seed, func[, arg]%29)
* [all](https://github.com/suckgamoni/fromjs/wiki/all(predicate[, arg]%29)
* [any](https://github.com/suckgamoni/fromjs/wiki/any([predicate, arg]%29)
* [at](https://github.com/suckgamoni/fromjs/wiki/at(index%29)
* [atOrDefault](https://github.com/suckgamoni/fromjs/wiki/atOrDefault(index, defValue%29)
* [average](https://github.com/suckgamoni/fromjs/wiki/average(%29)
* [concat](https://github.com/suckgamoni/fromjs/wiki/concat(second%29)
* [contains](https://github.com/suckgamoni/fromjs/wiki/contains(value[, comparer, arg]%29)
* [count](https://github.com/suckgamoni/fromjs/wiki/count([predicate, arg]%29)
* [defaultIfEmpty](https://github.com/suckgamoni/fromjs/wiki/defaultIfEmpty(defValue%29)
* [distinct](https://github.com/suckgamoni/fromjs/wiki/distinct([comparer, arg]%29)
* [except](https://github.com/suckgamoni/fromjs/wiki/except(second[, comparer, arg]%29)
* [first](https://github.com/suckgamoni/fromjs/wiki/first([predicate, arg]%29)
* [firstOrDefault](https://github.com/suckgamoni/fromjs/wiki/firstOrDefault(defValue%29 , firstOrDefault(predicate, defValue[, arg]%29)
* [groupBy](https://github.com/suckgamoni/fromjs/wiki/groupBy(selectors[, comparer, arg]%29)
* [groupJoin](https://github.com/suckgamoni/fromjs/wiki/groupJoin(inner, outerKeySelector, innerKeySelector, resultSelector[, comparer, arg]%29)
* [intersect](https://github.com/suckgamoni/fromjs/wiki/intersect(second[, comparer, arg]%29)
* [join](https://github.com/suckgamoni/fromjs/wiki/join(inner, outerKeySelector, innerKeySelector, resultSelector[, comparer, arg]%29)
* [last](https://github.com/suckgamoni/fromjs/wiki/last([predicate, arg]%29)
* [lastOrDefault](https://github.com/suckgamoni/fromjs/wiki/lastOrDefault(defValue%29 , lastOrDefault(predicate, defValue[, arg]%29)
* [max](https://github.com/suckgamoni/fromjs/wiki/max([selector, arg]%29)
* [min](https://github.com/suckgamoni/fromjs/wiki/min([selector, arg]%29)
* [orderBy](https://github.com/suckgamoni/fromjs/wiki/orderBy(keySelector[, comparer, arg]%29)
* [orderByDesc](https://github.com/suckgamoni/fromjs/wiki/orderByDesc(keySelector[, comparer, arg]%29)
* [reverse](https://github.com/suckgamoni/fromjs/wiki/reverse(%29)
* [select](https://github.com/suckgamoni/fromjs/wiki/select(selector[, arg]%29)
* [selectMany](https://github.com/suckgamoni/fromjs/wiki/selectMany(selector[, arg]%29)
* [selectPair](https://github.com/suckgamoni/fromjs/wiki/selectPair(valueSelector, keySelector[, arg]%29)
* [sequenceEqual](https://github.com/suckgamoni/fromjs/wiki/sequenceEqual(second[, comparer, arg]%29)
* [single](https://github.com/suckgamoni/fromjs/wiki/single([predicate, arg]%29)
* [singleOrDefault](https://github.com/suckgamoni/fromjs/wiki/singleOrDefault(defValue%29 , singleOrDefault(predicate, defValue[, arg]%29)
* [skip](https://github.com/suckgamoni/fromjs/wiki/skip(count%29)
* [skipWhile](https://github.com/suckgamoni/fromjs/wiki/skipWhile(predicate[, arg]%29)
* [sum](https://github.com/suckgamoni/fromjs/wiki/sum(%29)
* [take](https://github.com/suckgamoni/fromjs/wiki/take(count%29)
* [takeWhile](https://github.com/suckgamoni/fromjs/wiki/takeWhile(predicate[, arg]%29)
* [thenBy](https://github.com/suckgamoni/fromjs/wiki/thenBy(keySelector[, comparer, arg]%29)
* [thenByDesc](https://github.com/suckgamoni/fromjs/wiki/thenByDesc(keySelector[, comparer, arg]%29)
* [toArray](https://github.com/suckgamoni/fromjs/wiki/toArray(%29)
* [toJSON](https://github.com/suckgamoni/fromjs/wiki/toJSON(%29)
* [toString](https://github.com/suckgamoni/fromjs/wiki/toString([separator]%29)
* [toURLEncoded](https://github.com/suckgamoni/fromjs/wiki/toURLEncoded(%29)
* [trim](https://github.com/suckgamoni/fromjs/wiki/trim([left, right, arg]%29)
* [union](https://github.com/suckgamoni/fromjs/wiki/union(second[, comparer, arg]%29)
* [where](https://github.com/suckgamoni/fromjs/wiki/where(predicate[, arg]%29)
* [zip](https://github.com/suckgamoni/fromjs/wiki/zip(second, resultSelector[, arg]%29)

## Some practical examples

```javascript
// Determine either n is a prime number.
function isPrime(n) {
    return n == 2 ||
        (n % 2 == 1 &&
        !from.range(3, n, 2)
            .takeWhile('$ * $ <= @', n)
            .any('@ % $ == 0', n));
}

// Get prime numbers bigger than n.
// Returns [count] numbers in a array, or a single number if count is zero.
function getPrimeBiggerThan(n, count) {
    n = parseInt(n) + 1;
    if (n % 2 == 0) ++n;

    var query = from.range(n, Infinity, 2).where('@($)', isPrime);
    if (!count) {
        return query.first();
    } else {
        return query.take(count).toArray();
    }
}

console.log(getPrimeBiggerThan(10, 5));

// [ 11, 13, 17, 19, 23 ]
```

```javascript
function splitTrimmed(s, delimiter) {
    return from(s.split(delimiter))
                .select('from($).trim().toString()')
                .where('$length > 0')
                .toArray();
}

var s = splitTrimmed('  a |  b  |  c  |  |  d  |  |  ', '|');
console.log(s);

// [ 'a', 'b', 'c', 'd' ]
```

```javascript
var array = [1, 2, 3];

// Make a shallow copy of a array
var copy = from(array).toArray();

array.push(4);
console.log(copy);
// [ 1, 2, 3 ]
```

## License

This software uses MIT license.

```
Copyright 2012-2013 suckgamony@gmail.com

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```
