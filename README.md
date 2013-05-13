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

## Currently being migrated from CodePlex
This project is currently on working on migration from http://fromjs.codeplex.com/
You can reference documents at the site to get information about from.js, but before doing so, you have to be notified that several things have been changed.

* *require('from');* → *var from = require('fromjs');* on node.js
* *$from(something)* → *from(something)*
* *$empty()* → *from()*
* *$range(1, 10, 2)* → *from.range(1, 10, 2)*
* aggregate() and aggregateSeed() were united into aggregate()
* groupBy(), groupBy2(), groupBy3(), groupBy4() were united into groupBy()

Reference documents will be migrated and updated to here soon.
