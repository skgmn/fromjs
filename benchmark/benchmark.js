function lazinessTest() {
    document.write('<ul>');

    var array = new Array(10000000);
    array[1] = 1;

    var time, elapsed, result;

    // $linq

    document.write('<li>$linq');
    
    time = new Date().getTime();
    result = $linq(array).where('x => x').first();
    if (result == 1) {
        var elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    // LINQ to JavaScript

    document.write('<li>LINQ to JavaScript');
    
    time = new Date().getTime();
    result = JSLINQ(array).Where(function (x) { return x; }).First();
    if (result == 1) {
        var elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    // linq.js

    document.write('<li>linq.js');
    
    time = new Date().getTime();
    result = Enumerable.From(array).Where('x => x').First();
    if (result == 1) {
        var elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    // from.js

    document.write('<li>from.js');
    
    time = new Date().getTime();
    result = from(array).where('x => x').first();
    if (result == 1) {
        elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    document.write('</ul>');
}

function sumTest() {
    document.write('<ul>');

    var array = new Array(1000000);
    for (var i = 0; i < array.length; ++i) {
        array[i] = i;
    }

    var RESULT = 249999500000;

    var time, elapsed, result;

    // $linq

    document.write('<li>$linq');
    
    time = new Date().getTime();
    result = $linq(array).where('x => x % 2 == 0').sum();
    //alert(result);
    if (result == RESULT) {
        var elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    // LINQ to JavaScript

    document.write('<li>LINQ to JavaScript - Not supported</li>');

    // linq.js

    document.write('<li>linq.js');
    
    time = new Date().getTime();
    result = Enumerable.From(array).Where('x => x % 2 == 0').Sum();
    if (result == RESULT) {
        var elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    // from.js

    document.write('<li>from.js');
    
    time = new Date().getTime();
    result = from(array).where('x => x % 2 == 0').sum();
    if (result == RESULT) {
        elapsed = new Date().getTime() - time;
        document.write(' - ' + elapsed + 'ms</li>');
    } else {
        document.write(' - Incorrect result</li>');
    }

    document.write('</ul>');
}

function nestedIterationTest() {
}