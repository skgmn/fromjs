# from.js
from.js is a super fast, well-optimized LINQ engine for JavaScript.

## Features
* **High-performance**
* Supports most LINQ functions that .NET provides
* 100% lazy evaluation
* Supports lambda expression

## Supported platforms
* Web (working)
* node.js

## Concept

from.js is intended to make it easy to use LINQ in JavaScript for whom is familiar with .NET environment. Most functions are adopted from .NET, and some features are modified/added to utilize characteristics of JavaScript.

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

It will be so tiring work to write a new function every time. It can be solved by using lambda expression.
Its format is almost same with C#'s.

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
var array = [1, 2, 3, 4];
from(array).each(function (value, key) {
    console.log('Value ' + value + ' at index ' + key);
});
```

The example above can be re-written as below.

```javascript
var array = [1, 2, 3, 4];
from(array).each('(value, key) => console.log("Value " + value + " at index " + key)');
```

## Omitting argument list

Lambda expression can be shorten more by omitting argument list.
But how can it be used if there's no argument list?
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

## Document not yet completed

This project is currently on working on migration from http://fromjs.codeplex.com/
You can reference documents at the site to get information about from.js, but before doing so, you have to be notified that several things have been changed.

* now can be installed with `npm install fromjs`
* `require('./from');` → `var from = require('fromjs');` on node.js
* *$from(something)* → *from(something)*
* *$empty()* → *from()*
* *$range(1, 10, 2)* → *from.range(1, 10, 2)*
* aggregate() and aggregateSeed() were united into aggregate()
* groupBy(), groupBy2(), groupBy3(), groupBy4() were united into groupBy()

Reference documents will be completely migrated and updated to here soon.
