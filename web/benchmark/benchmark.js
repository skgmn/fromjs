function test(name, expected, algorithm) {
    document.write('<li>' + name);

    if (!algorithm) {
        document.write(' - Not supported</li>');
        return;
    } else if (typeof algorithm == 'string') {
        document.write(' - ' + algorithm + '</li>');
        return;
    }

    var time = new Date().getTime();
    var result = algorithm();
    var elapsed = new Date().getTime() - time;

    var comparer;
    if (expected instanceof Function) {
        comparer = expected;
    } else {
        comparer = function (x) { return x == expected; };
    }
     
    if (comparer(result)) {
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }
}

function lazinessTest() {
    document.write('<ul>');

    var array = new Array(10000000);
    array[1] = 1;

    var EXPECTED = 1;

    test('$linq (not lazy)', EXPECTED, function() {
        return $linq(array).where('x => x').first();
    });
    test('linq.js (lazy)', EXPECTED, function() {
        return Enumerable.From(array).Where('x => x').First();
    });
    test('from.js (lazy)', EXPECTED, function() {
        return from(array).where('x => x').first();
    });

    document.write('</ul>');
}

function sumTest() {
    document.write('<ul>');

    var array = new Array(1000000);
    for (var i = 0; i < array.length; ++i) {
        array[i] = i;
    }

    var EXPECTED = 249999500000;

    test('$linq', EXPECTED, function() {
        return $linq(array).where('x => x % 2 == 0').sum();
    });
    test('linq.js', EXPECTED, function() {
        return Enumerable.From(array).Where('x => x % 2 == 0').Sum();
    });
    test('from.js', EXPECTED, function() {
        return from(array).where('x => x % 2 == 0').sum();
    });

    document.write('</ul>');
}

function arrayOptimizationTest() {
    document.write('<ul>');

    var array = new Array(1000000);
    var size = array.length;

    array[0] = array[1] = array[2] = 1;
    array[size - 1] = array[size - 2] = array[size - 3] = array[size - 4] = 1;

    var EXPECTED = array.length - 7;

    test('$linq', EXPECTED, function() {
        return $linq(array).skipWhile('x => x').reverse().skipWhile('x => x').count();
    });
    test('linq.js', EXPECTED, function() {
        return Enumerable.From(array).SkipWhile('x => x').Reverse().SkipWhile('x => x').Count();
    });
    test('from.js', EXPECTED, function() {
        return from(array).skipWhile('x => x').reverse().skipWhile('x => x').count();
    });

    document.write('</ul>');
}

function primeNumberTest() {
    function isPrime_$linq(n) {
        return n == 2 ||
                (n % 2 == 1 &&
                !linq.range(3, n - 1, 2)
                    .takeWhile('x => x * x <=' + n)
                    .any('x =>' + n + ' % x == 0'));
    }
    function isPrime_LinqJs(n) {
        return n == 2 ||
                (n % 2 == 1 &&
                !Enumerable.Range(3, n - 1, 2)
                    .TakeWhile('x => x * x <=' + n)
                    .Any('x =>' + n + ' % x == 0'));
    }
    function isPrime_fromjs(n) {
        return n == 2 ||
                (n % 2 == 1 &&
                !from.range(3, n, 2)
                    .takeWhile('(x, _, n) => x * x <= n', n)
                    .any('(x, _, n) => n % x == 0', n));
    }

    function getPrimeBiggerThan_$linq(n, count) {
        n = parseInt(n) + 1;
        if (n % 2 == 0) ++n;
        return linq.range(n, Infinity, 2).where(function(x) { return isPrime_$linq(x); }).take(count).toArray();
    }
    function getPrimeBiggerThan_LinqJs(n, count) {
        n = parseInt(n) + 1;
        if (n % 2 == 0) ++n;
        return Enumerable.Range(n, Infinity, 2).Where(function(x) { return isPrime_LinqJs(x); }).Take(count).ToArray();
    }
    function getPrimeBiggerThan_fromjs(n, count) {
        n = parseInt(n) + 1;
        if (n % 2 == 0) ++n;
        return from.range(n, Infinity, 2).where('(x, _, f) => f(x)', isPrime_fromjs).take(count).toArray();
    }

    document.write('<ul>');

    var n = 10000000;
    var count = 1000;

    var verifier = function (x) {
        return x.length == 1000 && x[0] == 10000019 && x[x.length - 1] == 10016051;
    };

    /*test('$linq', verifier, function () {
        return getPrimeBiggerThan_$linq(n, count);
    });*/
    test('$linq', verifier, 'Out of memory');
    test('linq.js', verifier, function () {
        return getPrimeBiggerThan_LinqJs(n, count);
    });
    test('from.js', verifier, function () {
        return getPrimeBiggerThan_fromjs(n, count);
    });

    document.write('</ul>');
}