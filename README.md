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
                .orderByDesc(function (value) {
                    return value;
                })
                .take(3)
                .average();
                
console.log(average);
```

## Not yet completed

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
