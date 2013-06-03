// Unit test using nodeunit

var from = require('../from.src');

exports['test1'] = function (test) {
    var n = 17;

    function isPrime(n) {
        return !from.range(3, n + 1, 2).takeWhile("$ * $ <= @", n).any("@ % $ == 0", n);
    }

    var result = from([2]).concat(from.range(3, n + 1, 2).where("@($)", isPrime)).toArray();
    
    test.ok(
        result.length == 7 &&
        result[0] == 2 &&
        result[1] == 3 &&
        result[2] == 5 &&
        result[3] == 7 && 
        result[4] == 11 &&
        result[5] == 13 &&
        result[6] == 17);
    test.done();
};

exports['test2'] = function (test) {
    from.range(1, 101)
        .groupBy({key: "$ % 2"})
        .select("{mod2: $$, sum: $sum()}")
        .each(function (result) {
            if (result.mod2 == 0) {
                test.ok(result.sum == 2550);
            } else {
                test.ok(result.sum == 2500);
            }
        });
    test.done();
};

exports['test3'] = function (test) {
    var data = [0, 1, "foo", 2, 3, 4, "bar"];

    var foobar = from(data).where("typeof($) == 'string'")
                            .toString(" and ");
                            
    test.ok(foobar == 'foo and bar');
    test.done();
};

exports['test4'] = function (test) {
    var names1 = [ "Hartono, Tommy" ];
    var names2 = [ "Adams, Terry", "Andersen, Henriette Thaulow", "Hedlund, Magnus", "Ito, Shu" ];
    var names3 = [ "Solanki, Ajay", "Hoeing, Helge", "Andersen, Henriette Thaulow", "Potra, Cristina", "Iallo, Lucio" ];

    var namesList = [ names1, names2, names3 ];

    var allNames = from(namesList)
        .aggregate(from(), "(current, next) => next.length > 3 ? current.union(next) : current")
        .toArray();

    test.ok(
        allNames.length == 8 &&
        allNames[0] == 'Adams, Terry' &&
        allNames[1] == 'Andersen, Henriette Thaulow' &&
        allNames[2] == 'Hedlund, Magnus' &&
        allNames[3] == 'Ito, Shu' &&
        allNames[4] == 'Solanki, Ajay' &&
        allNames[5] == 'Hoeing, Helge' &&
        allNames[6] == 'Potra, Cristina' &&
        allNames[7] == 'Iallo, Lucio');
    test.done();
};

exports['test5'] = function (test) {
    var s = from('asdf').reverse().toString();
    test.ok(s == 'fdsa');
    
    test.done();
};

exports['regular expression test'] = function (test) {
    from(/ab*/g).match('abbcdefabh')
        .each(function (m, i) {
            switch (i) {
            case 0:
                test.ok(m == 'abb' && m.index == 0);
                break;
                
            case 1:
                test.ok(m == 'ab' && m.index == 7);
                break;
                
            default:
                test.ok(false);
                break;
            }
        });
        
    test.done();
};

exports['range() test'] = function (test) {
    var squares = from.range(4).select("$ * $").toArray();
    test.ok(
        squares.length == 4 &&
        squares[0] == 0 &&
        squares[1] == 1 &&
        squares[2] == 4 &&
        squares[3] == 9);
        
    squares = from.range(4, 7).select("$ * $").toArray();
    test.ok(
        squares.length == 3 &&
        squares[0] == 16 &&
        squares[1] == 25 &&
        squares[2] == 36);
        
    squares = from.range(3, 13, 3).select("$ * $").toArray();
    test.ok(
        squares.length == 4 &&
        squares[0] == 9 &&
        squares[1] == 36 &&
        squares[2] == 81 &&
        squares[3] == 144);
        
    test.done();
};

exports['aggregate() test'] = function (test) {
    // without seed
    
    var sentence = "the quick brown fox jumps over the lazy dog";

    var words = sentence.split(' ');

    var reversed = from(words).aggregate(null,
        "(workingSentence, next) => next + ' ' + workingSentence");
        
    test.ok(reversed == 'dog lazy the over jumps fox brown quick the');
    
    // with seed
    
    var ints = [ 4, 8, 8, 3, 9, 0, 7, 8, 2 ];

    var numEven = from(ints).aggregate(0, 
        "(total, next) => next % 2 == 0 ? total + 1 : total");

    test.ok(numEven == 6);

    test.done();
};

exports['all() test'] = function (test) {
    var pets = [ { name: "Barley", age: 10 },
			     { name: "Boots", age: 4 },
			     { name: "Whiskers", age: 6 } ];

    var allStartWithB = from(pets).all("$name[0] == 'B'");
    
    test.ok(!allStartWithB);
    
    var people = [
        { lastName: "Haas",
          pets: [ { name: "Barley", age: 10 },
                  { name: "Boots", age: 14 },
                  { name: "Whiskers", age: 6 } ] },
        { lastName: "Fakhouri",
	      pets: [ { name: "Snowball", age: 1 } ] },
        { lastName: "Antebi",
	      pets: [ { name: "Belle", age: 8 } ] },
        { lastName: "Philips",
	      pets: [ { name: "Sweetie", age: 2 },
	              { name: "Rover", age: 13 } ] }
    ];

    var names = from(people)
        .where("from($pets).all('$age > 5')")
        .select("$lastName")
        .toArray();

    test.ok(
        names.length == 2 &&
        names[0] == 'Haas' &&
        names[1] == 'Antebi');
    
    test.done();
};

exports['any() test'] = function (test) {
    var numbers = [ 1, 2 ];
    var hasElements = from(numbers).any();
    
    test.ok(hasElements);
    
    var pets = [
        { name: "Barley", age: 8, vaccinated: true },
	    { name: "Boots", age: 4, vaccinated: false },
	    { name: "Whiskers", age: 1, vaccinated: false } 
    ];

    var unvaccinated = from(pets).any("$age > 1 && $vaccinated == false");

    test.ok(unvaccinated);
    
    test.done();
};

exports['at() test'] = function (test) {
    var names = [ "Hartono, Tommy", "Adams, Terry", "Andersen, Henriette Thaulow",  "Hedlund, Magnus", "Ito, Shu" ];
    var name = from(names).at(1);

    test.ok(name == 'Adams, Terry');
    test.done();
};

exports['atOrDefault() test'] = function (test) {
    var names = [ "Hartono, Tommy", "Adams, Terry", "Andersen, Henriette Thaulow",  "Hedlund, Magnus", "Ito, Shu" ];

    var index = 20;
    var name = from(names).atOrDefault(index, null);
    
    test.ok(name === null);
    test.done();
};

exports['average() test'] = function (test) {
    var grades = [ 78, 92, 100, 37, 81 ];
    var average = from(grades).average();
    
    test.ok(average == 77.6);
    test.done();
};

exports['concat() test'] = function (test) {
    function getCats()
    {
        return [ { name: "Barley", age: 8 },
                 { name: "Boots", age: 4 },
                 { name: "Whiskers", age: 1 } ];
    }

    function getDogs()
    {
	    return [ { name: "Bounder", age: 3 },
                 { name: "Snoopy", age: 14 },
                 { name: "Fido", age: 9 } ];
    }

    var cats = getCats();
    var dogs = getDogs();

    var results = from(cats).select("$name").concat(from(dogs).select("$name")).toArray();
    
    test.ok(
        results.length == 6 &&
        results[0] == 'Barley' &&
        results[1] == 'Boots' &&
        results[2] == 'Whiskers' &&
        results[3] == 'Bounder' &&
        results[4] == 'Snoopy' &&
        results[5] == 'Fido');
    test.done();
};

exports['contains() test'] = function (test) {
    var fruits = [ "apple", "banana", "mango", "orange", "passionfruit", "grape" ];
    var fruit = "mango";
    var hasMango = from(fruits).contains(fruit);

    test.ok(hasMango);
    
    fruits = [ { name: "apple", code: 9 },
                   { name: "orange", code: 4 }, 
                   { name: "lemon", code: 12 } ];

    var apple = { name: "apple", code: 9 };
    var kiwi = {name: "kiwi", code: 8 };

    var comparer = "(#0 == #1) || (#0 && #1 && #0.code == #1.code && #0.name == #1.name)";

    var fruitsIterable = from(fruits);
    var hasApple = fruitsIterable.contains(apple, comparer);
    var hasKiwi = fruitsIterable.contains(kiwi, comparer);

    test.ok(hasApple && !hasKiwi);
    
    test.done();
};

exports['count() test'] = function (test) {
    var fruits = [ "apple", "banana", "mango", "orange", "passionfruit", "grape" ];
    var numberOfFruits = from(fruits).count();
    
    test.ok(numberOfFruits == 6);
    
    var pets = [ { name: "Barley", vaccinated: true },
                 { name: "Boots", vaccinated: false },
                 { name: "Whiskers", vaccinated: false } ];

    var numberUnvaccinated = from(pets).count("$vaccinated == false");
    
    test.ok(numberUnvaccinated == 2);
    
    test.done();
};

exports['defaultIfEmpty() test'] = function (test) {
    var defaultPet = { name: "Default Pet", age: 0 };

    var pets1 = [ { name: "Barley", age: 8 },
                  { name: "Boots", age: 4 },
                  { name: "Whiskers", age: 1 } ];

    var pets = from(pets1).defaultIfEmpty(defaultPet).toArray();
    
    test.ok(
        pets.length == 3 &&
        pets[0].name == 'Barley' && pets[0].age == 8 &&
        pets[1].name == 'Boots' && pets[1].age == 4 &&
        pets[2].name == 'Whiskers' && pets[2].age == 1);

    var pets2 = [];

    pets = from(pets2).defaultIfEmpty(defaultPet).toArray();
    
    test.ok(
        pets.length == 1 &&
        pets[0].name == 'Default Pet' && pets[0].age == 0);
        
    test.done();
};

exports['distinct() test'] = function (test) {
    var ages = [ 21, 46, 46, 55, 17, 21, 55, 55 ];
    var distinctAges = from(ages).distinct().toArray();
    
    test.ok(
        distinctAges.length == 4 &&
        distinctAges[0] == 21 &&
        distinctAges[1] == 46 &&
        distinctAges[2] == 55 &&
        distinctAges[3] == 17);
        
    var products = [ { name: "apple", code: 9 }, 
                     { name: "orange", code: 4 }, 
                     { name: "apple", code: 9 }, 
                     { name: "lemon", code: 12 } ];

    var comparer = "#0 == #1 || (#0 && #1 && #0.name == #1.name && #0.code == #1.code)";

    var noduplicates =
        from(products).distinct(comparer).toArray();

    test.ok(
        noduplicates.length == 3 &&
        noduplicates[0].name == 'apple' && noduplicates[0].code == 9 &&
        noduplicates[1].name == 'orange' && noduplicates[1].code == 4 &&
        noduplicates[2].name == 'lemon' && noduplicates[2].code == 12);
        
    test.done();
};

exports['except() test'] = function (test) {
    var numbers1 = [ 2.0, 2.1, 2.2, 2.3, 2.4, 2.5 ];
    var numbers2 = [ 2.2 ];

    var onlyInFirstSet = from(numbers1).except(numbers2).toArray();
    
    test.ok(
        onlyInFirstSet.length == 5 &&
        onlyInFirstSet[0] == 2 &&
        onlyInFirstSet[1] == 2.1 &&
        onlyInFirstSet[2] == 2.3 &&
        onlyInFirstSet[3] == 2.4 &&
        onlyInFirstSet[4] == 2.5);
        
    var fruits1 = [ { name: "apple", code: 9 }, 
                    { name: "orange", code: 4 },
                    { name: "lemon", code: 12 } ];

    var fruits2 = [ { name: "apple", code: 9 } ];

    var comparer = "#0 == #1 || (#0 && #1 && #0.name == #1.name && #0.code == #1.code)";

    var except =
        from(fruits1).except(fruits2, comparer).toArray();

    test.ok(
        except.length == 2 &&
        except[0].name == 'orange' && except[0].code == 4 &&
        except[1].name == 'lemon' && except[1].code == 12);
        
    test.done();
};

exports['first() test'] = function (test) {
    var numbers = [ 9, 34, 65, 92, 87, 435, 3, 54, 83, 23, 87, 435, 67, 12, 19 ];
    var first = from(numbers).first();

    test.ok(first == 9);
    
    first = from(numbers).first("$ > 80");
    
    test.ok(first == 92);
    
    test.done();
};

exports['firstOrDefault() test'] = function (test) {
    var numbers = [ ];
    var first = from(numbers).firstOrDefault(0);
    
    test.ok(first == 0);
    
    var names = [ "Hartono, Tommy", "Adams, Terry", "Andersen, Henriette Thaulow", "Hedlund, Magnus", "Ito, Shu" ];
    var firstLongName = from(names).firstOrDefault("$length > 20", "");
    
    test.ok(firstLongName == 'Andersen, Henriette Thaulow');

    var firstVeryLongName = from(names).firstOrDefault("$length > 30", null);

    test.ok(firstVeryLongName == null);
    
    test.done();
};

exports['groupBy() test'] = function (test) {
    var pets = [
        { name: "Barley", age: 8 },
        { name: "Boots", age: 4 },
        { name: "Whiskers", age: 1 },
        { name: "Daisy", age: 4 } ];

    var query = from(pets).groupBy({value: "$name", key: "$age"});
    
    test.ok(query.count() == 3);
    
    query.each(function (v, k) {
        if (k == 8) {
            test.ok(v.singleOrDefault(null) == 'Barley');
        } else if (k == 4) {
            test.ok(v.count() == 2 && v.any('$ == "Boots"') && v.any('$ == "Daisy"'));
        } else if (k == 1) {
            test.ok(v.singleOrDefault(null) == 'Whiskers');
        }
    });
    
    //
    
    var petsList = [
        { name: "Barley", age: 8.3 },
        { name: "Boots", age: 4.9 },
        { name: "Whiskers", age: 1.5 },
        { name: "Daisy", age: 4.3 } ];

    var query = from(petsList).groupBy({
        value: '$age',
        key: "Math.floor($age)",
        result: function(ages, baseAge) {
            return {
                key: baseAge,
                count: ages.count(),
                min: ages.min(),
                max: ages.max()
            };
        }
    });
    
    test.ok(query.count() == 3);
    
    query.each(function(result) {
        if (result.key == 8) {
            test.ok(result.count == 1 &&
                result.min == 8.3 &&
                result.max == 8.3);
        } else if (result.key == 4) {
            test.ok(result.count == 2 &&
                result.min == 4.3 &&
                result.max == 4.9);
        } else if (result.key == 1) {
            test.ok(result.count == 1 &&
                result.min == 1.5 &&
                result.max == 1.5);
        }
    });    
    
    test.done();
};

exports['groupJoin() test'] = function (test) {
    var magnus = { name: "Hedlund, Magnus" };
    var terry = { name: "Adams, Terry" };
    var charlotte = { name: "Weiss, Charlotte" };

    var barley = { name: "Barley", owner:  terry };
    var boots = { name: "Boots", owner:  terry };
    var whiskers = { name: "Whiskers", owner:  charlotte };
    var daisy = { name: "Daisy", owner:  magnus };

    var people = [ magnus, terry, charlotte ];
    var pets =  [ barley, boots, whiskers, daisy ];

    var query =
        from(people).groupJoin(pets,
            "person => person",
            "pet => pet.owner",
            function(person, petCollection) {
                return {
                    ownerName: person.name,
                    pets: petCollection.select("$name")
                }
            }
        );
        
    test.ok(query.count() == 3 &&
        query.all('@indexOf($ownerName) >= 0', ['Hedlund, Magnus', 'Adams, Terry', 'Weiss, Charlotte']));

    query.each(function(obj) {
        if (obj.ownerName == 'Hedlund, Magnus') {
            test.ok(obj.pets.singleOrDefault(null) == 'Daisy');
        } else if (obj.ownerName == 'Adams, Terry') {
            test.ok(obj.pets.count() == 2 && obj.pets.all('@indexOf($) >= 0', ['Barley', 'Boots']));
        } else if (obj.ownerName == 'Weiss, Charlotte') {
            test.ok(obj.pets.singleOrDefault(null) == 'Whiskers');
        }
    });
    
    test.done();
};

exports['intersect() test'] = function (test) {
    // test 1
    
    var id1 = [ 44, 26, 92, 30, 71, 38 ];
    var id2 = [ 39, 59, 83, 47, 26, 4, 30 ];

    var both = from(id1).intersect(id2);
    
    test.ok(
        both.count() == 2 &&
        both.first() == 26 && both.last() == 30);

    // test 2
    
    var store1 = [ { name: "apple", code: 9 }, 
                   { name: "orange", code: 4 } ];

    var store2 = [ { name: "apple", code: 9 }, 
                   { name: "lemon", code: 12 } ];

    var comparer = "#0 == #1 || (#0 && #1 && #0.name == #1.name && #0.code == #1.code)";

    var duplicates = 
        from(store1).intersect(store2, comparer);

    var single = duplicates.singleOrDefault(null);
    
    test.ok(
        single && single.name == 'apple' && single.code == 9);
        
    test.done();
};

exports['join() test'] = function (test) {
    var magnus = { name: "Hedlund, Magnus" };
    var terry = { name: "Adams, Terry" };
    var charlotte = { name: "Weiss, Charlotte" };

    var barley = { name: "Barley", owner: terry };
    var boots = { name: "Boots", owner: terry };
    var whiskers = { name: "Whiskers", owner: charlotte };
    var daisy = { name: "Daisy", owner: magnus };

    var people = [ magnus, terry, charlotte ];
    var pets = [ barley, boots, whiskers, daisy ];

    var query =
        from(people).join(pets,
            "person => person",
            "pet => pet.owner",
            function (person, pet) {
                return { ownerName: person.name, pet: pet.name };
            }
        );

    var result = query.toArray();
  
    test.ok(
        result.length == 4 &&
        result[0].ownerName == 'Hedlund, Magnus' && result[0].pet == 'Daisy' &&
        result[1].ownerName == 'Adams, Terry' && result[1].pet == 'Barley' &&
        result[2].ownerName == 'Adams, Terry' && result[2].pet == 'Boots' &&
        result[3].ownerName == 'Weiss, Charlotte' && result[3].pet == 'Whiskers');
        
    test.done();
};

exports['last() test'] = function (test) {
    // test 1
    
    var numbers = [ 9, 34, 65, 92, 87, 435, 3, 54, 83, 23, 87, 67, 12, 19 ];
    var last = from(numbers).last();    
    
    test.ok(last == 19);
    
    // test 2

    var numbers = [ 9, 34, 65, 92, 87, 435, 3, 54, 83, 23, 87, 67, 12, 19 ];
    var last = from(numbers).last("$ > 80");    
    
    test.ok(last == 87);
    
    test.done();
};

exports['lastOrDefault() test'] = function (test) {
    // test 1
    
    var daysOfMonth = [];

    var lastDay1 = from(daysOfMonth).lastOrDefault(0);
    if (lastDay1 == 0)
    {
        lastDay1 = 1;
    }
    test.ok(lastDay1 == 1);

    var lastDay2 = from(daysOfMonth).defaultIfEmpty(1).last();
    test.ok(lastDay2 == 1);
    
    // test 2
    
    var numbers = [ 49.6, 52.3, 51.0, 49.4, 50.2, 48.3 ];

    var last50 = from(numbers).lastOrDefault("Math.round($) == 50.0", 0.0);
    test.ok(last50 == 50.2);

    var last40 = from(numbers).lastOrDefault("Math.round($) == 40.0", 0.0);
    test.ok(last40 == 0.0);
    
    test.done();
};

exports['max() test'] = function (test) {
    // test 1
    
    var longs = [ 4294967296, 466855135, 81125 ];
    var max = from(longs).max();
    
    test.ok(max == 4294967296);
    
    // test 2
    
    var pets = [ { name: "Barley", age: 8 },
                 { name: "Boots", age: 4 },
                 { name: "Whiskers", age: 1 } ];

    var maxPet = from(pets).max("$age + $name.length");
    
    test.ok(maxPet.name == 'Barley');
    
    test.done();
};

exports['min() test'] = function (test) {
    // test 1
    
    var longs = [ 4294967296, 466855135, 81125 ];
    var min = from(longs).min();
    
    test.ok(min == 81125);
    
    // test 2
    
    var pets = [ { name: "Barley", age: 8 },
                 { name: "Boots", age: 5 },
                 { name: "Whiskers", age: 1 } ];

    var minPet = from(pets).min("$age + $name.length");
    
    test.ok(minPet.name == 'Whiskers');
    
    test.done();
};

exports['orderBy() test'] = function (test) {
    var unsortedArray = [ "three", "six", "nine", "twelve", "fifteen", "eighteen" ];

    var sortedArray = from(unsortedArray).orderBy("$").toArray();

    test.ok(
        sortedArray.length == 6 &&
        sortedArray[0] == 'eighteen' &&
        sortedArray[1] == 'fifteen' &&
        sortedArray[2] == 'nine' &&
        sortedArray[3] == 'six' &&
        sortedArray[4] == 'three' &&
        sortedArray[5] == 'twelve');

    sortedArray = from(unsortedArray).orderBy("$length").toArray();

    test.ok(
        sortedArray.length == 6 &&
        sortedArray[0] == 'six' &&
        sortedArray[1] == 'nine' &&
        sortedArray[2] == 'three' &&
        sortedArray[3] == 'twelve' &&
        sortedArray[4] == 'fifteen' &&
        sortedArray[5] == 'eighteen');
        
    test.done();
};

exports['orderByDesc() test'] = function (test) {
    var decimals = [ 6.2, 8.3, 0.5, 1.3, 6.3, 9.7 ];

    function comparer(v1, v2) {
	    var f1 = v1 - Math.floor(v1);
	    var f2 = v2 - Math.floor(v2);
	
	    if (f1 == f2) {
		    return 0;
	    }
	    else if (f1 > f2) {
		    return 1;
	    }
	    else {
		    return -1;
	    }
    }

    var result = from(decimals).orderByDesc("$", comparer).toArray();
    
    test.ok(
        result.length == 6 &&
        result[0] == 9.7 &&
        result[1] == 0.5 &&
        result[2] == 8.3 &&
        result[3] == 1.3 &&
        result[4] == 6.3 &&
        result[5] == 6.2);
        
    test.done();
};

exports['reverse() test'] = function (test) {
    var apple = "apple";
    var reversed = from(apple).reverse().toString();
    
    test.ok(reversed == 'elppa');
    test.done();
};

exports['select() test'] = function (test) {
    var squares = from.range(1, 6).select("$ * $").toArray();

    test.ok(
        squares.length == 5 &&
        squares[0] == 1 &&
        squares[1] == 4 &&
        squares[2] == 9 &&
        squares[3] == 16 &&
        squares[4] == 25);
        
    test.done();
};

exports['selectMany() test'] = function (test) {
    var petOwners = [
        { name: "Higa, Sidney", 
          pets: [ "Scruffy", "Sam" ] },
        { name: "Ashkenazi, Ronen", 
          pets: [ "Walker", "Sugar" ] },
        { name: "Price, Vernette", 
          pets: [ "Scratches", "Diesel" ] } ];

    var result = from(petOwners).selectMany("$pets").toArray();
    
    test.ok(
        result.length == 6 &&
        result[0] == 'Scruffy' &&
        result[1] == 'Sam' &&
        result[2] == 'Walker' &&
        result[3] == 'Sugar' &&
        result[4] == 'Scratches' &&
        result[5] == 'Diesel');
        
    test.done();
};

exports['selectPair() test'] = function (test) {
    from.range(1, 11).selectPair("$ * $", "$").each(function (v, k) {
        test.ok(v == k * k);
    });
    
    test.done();
};

exports['sequenceEqual() test'] = function (test) {
    // test 1
    
    var pet1 = { name: "Turbo", age: 2 };
    var pet2 = { name: "Peanut", age: 8 };

    var pets1 = [ pet1, pet2 ];
    var pets2 = [ pet1, pet2 ];

    var equal = from(pets1).sequenceEqual(pets2);
    
    test.ok(equal);
    
    // test 2
    
    var storeA = [ { name: "apple", code: 9 }, 
                   { name: "orange", code: 4 } ];

    var storeB = [ { name: "apple", code: 9 }, 
                   { name: "orange", code: 4 } ];

    var comparer = "#0 == #1 || (#0 && #1 && #0.name == #1.name && #0.code == #1.code)";
    var equalAB = from(storeA).sequenceEqual(storeB, comparer);
    
    test.ok(equalAB);
    
    test.done();
};

exports['single() test'] = function (test) {
    // test 1
    
    var fruits2 = [ "orange", "apple" ];
    var fruit2 = from(fruits2).single();
    
    test.ok(fruit2 ? false : true);
    
    // test 2
    
    var fruits = [ "apple", "banana", "mango", "orange", "passionfruit", "grape" ];
    var fruit1 = from(fruits).single("$length > 10");
    
    test.ok(fruit1 == 'passionfruit');
    
    test.done();
};

exports['singleOrDefault() test'] = function (test) {
    // test 1
    
    var fruits1 = [ "orange" ];
    var fruit1 = from(fruits1).singleOrDefault(null);

    test.ok(fruit1 == 'orange');

    var fruits2 = [];
    var fruit2 = from(fruits2).singleOrDefault(null);

    test.ok(fruit2 == null);
    
    // test 2
    
    var fruits = [ "apple", "banana", "mango", "orange", "passionfruit", "grape" ];

    var fruit1 = from(fruits).singleOrDefault("$length > 10", "");
    test.ok(fruit1 == 'passionfruit');

    var fruit2 = from(fruits).singleOrDefault("$length > 15", null);
    test.ok(fruit2 ? false : true);
    
    test.done();
};

exports['skip() test'] = function (test) {
    var grades = [ 59, 82, 70, 56, 92, 98, 85 ];
    var lowerGrades = from(grades).orderByDesc("$").skip(3).toArray();
    
    test.ok(
        lowerGrades.length == 4 &&
        lowerGrades[0] == 82 &&
        lowerGrades[1] == 70 &&
        lowerGrades[2] == 59 &&
        lowerGrades[3] == 56);
        
    test.done();
};

exports['skip() test'] = function (test) {
    var grades = [ 59, 82, 70, 56, 92, 98, 85 ];
    var lowerGrades = from(grades).orderByDesc("$").skipWhile("$ >= 80").toArray();

    test.ok(
        lowerGrades.length == 3 &&
        lowerGrades[0] == 70 &&
        lowerGrades[1] == 59 &&
        lowerGrades[2] == 56);
        
    test.done();
};

exports['sum() test'] = function (test) {
    var numbers = [ 43.68, 1.25, 583.7, 6.5 ];
    var sum = from(numbers).sum();
    
    test.ok(sum == 635.13);
    test.done();
};

exports['take() test'] = function (test) {
    var grades = [ 59, 82, 70, 56, 92, 98, 85 ];
    var topThreeGrades = from(grades).orderByDesc("$").take(3).toArray();
    
    test.ok(
        topThreeGrades.length == 3 &&
        topThreeGrades[0] == 98 &&
        topThreeGrades[1] == 92 &&
        topThreeGrades[2] == 85);
    
    test.done();
};

exports['takeWhile() test'] = function (test) {
    var fruits = [ "apple", "passionfruit", "banana", "mango", "orange", "blueberry", "grape", "strawberry" ];
    var result = from(fruits).takeWhile("$length >= $$").toArray();
    
    test.ok(
        result.length == 6 &&
        result[0] == 'apple' &&
        result[1] == 'passionfruit' &&
        result[2] == 'banana' &&
        result[3] == 'mango' &&
        result[4] == 'orange' &&
        result[5] == 'blueberry');
        
    test.done();
};

exports['thenBy() test'] = function (test) {
    var fruits = [ "grape", "passionfruit", "banana", "mango", "orange", "raspberry", "apple", "blueberry" ];
    var result = from(fruits).orderBy("$length").thenBy("$").toArray();
    
    test.ok(
        result.length == 8 &&
        result[0] == 'apple' &&
        result[1] == 'grape' &&
        result[2] == 'mango' &&
        result[3] == 'banana' &&
        result[4] == 'orange' &&
        result[5] == 'blueberry' &&
        result[6] == 'raspberry' &&
        result[7] == 'passionfruit');
        
    test.done();
};

exports['thenByDesc() test'] = function (test) {
    var fruits = [ "apPLe", "baNanA", "apple", "APple", "orange", "BAnana", "ORANGE", "apPLE" ];

    var comparer = function(a, b) {
	    a = a.toLowerCase();
	    b = b.toLowerCase();
	
	    return (a > b ? 1 : (a < b ? -1 : 0));
    };

    var result = from(fruits).orderBy("$length").thenByDesc("$", comparer).toArray();
    
    test.ok(
        result.length == 8 &&
        result[0] == 'apPLe' &&
        result[1] == 'apple' &&
        result[2] == 'APple' &&
        result[3] == 'apPLE' &&
        result[4] == 'orange' &&
        result[5] == 'ORANGE' &&
        result[6] == 'baNanA' &&
        result[7] == 'BAnana');
        
    test.done();
};

exports['toURLEncoded() test'] = function (test) {
    var data = {
        a: 1,
        b: 2,
        c: [3, 4, 5],
        d: {
            e: 6,
            f: "foo",
            g: [7, 8]
        }
    };

    var urlEncoded = from(data).toURLEncoded();
    
    test.ok(urlEncoded == 'a=1&b=2&c[0]=3&c[1]=4&c[2]=5&d[e]=6&d[f]=foo&d[g][0]=7&d[g][1]=8');
    test.done();
};

exports['toString() test'] = function (test) {
    var data = ["a", "b", "c", "d"];
    var s = from(data).toString("; ");
    
    test.ok(s == 'a; b; c; d');
    test.done();
};

exports['toJSON() test'] = function (test) {
    var data = {
        a: 1,
        b: 2,
        c: [3, 4, 5],
        d: {
            e: 6,
            f: "foo",
            g: [7, 8]
        }
    };

    var s = from(data).toJSON();
    var re = eval('(' + s + ')');

    test.ok(
        re.a == 1 &&
        re.b == 2 &&
        re.c.length == 3 &&
        re.c[0] == 3 &&
        re.c[1] == 4 &&
        re.c[2] == 5 &&
        re.d.e == 6 &&
        re.d.f == 'foo' &&
        re.d.g.length == 2 &&
        re.d.g[0] == 7 &&
        re.d.g[1] == 8);    
    
    test.done();
};

exports['trim() test'] = function (test) {
    var trimChars = ['-', ' '];
    var s = from('--- Hello-world! ---')
                .trim(trimChars, trimChars)
                .toString();
    test.ok(s == 'Hello-world!');

    s = from('// // comment')
            .trim('($ == "/" || $ == " ") && $$ <= 2')
            .toString();
    test.ok(s == '// comment');

    test.done();
};

exports['union() test'] = function (test) {
    var ints1 = [ 5, 3, 9, 7, 5, 9, 3, 7 ];
    var ints2 = [ 8, 3, 6, 4, 4, 9, 1, 0 ];

    var result = from(ints1).union(ints2).toArray();
    
    test.ok(
        result.length == 9 &&
        result[0] == 5 &&
        result[1] == 3 &&
        result[2] == 9 &&
        result[3] == 7 &&
        result[4] == 8 &&
        result[5] == 6 &&
        result[6] == 4 &&
        result[7] == 1 &&
        result[8] == 0);
        
    test.done();
};

exports['where() test'] = function (test) {
    var fruits = [ "apple", "passionfruit", "banana", "mango", "orange", "blueberry", "grape", "strawberry" ];
    var result = from(fruits).where("$length < 6").toArray();
    
    test.ok(
        result.length == 3 &&
        result[0] == 'apple' &&
        result[1] == 'mango' &&
        result[2] == 'grape');
        
    test.done();
};

exports['zip() test'] = function (test) {
    var numbers = [ 1, 2, 3, 4 ];
    var words = [ "one", "two", "three" ];

    var numbersAndWords = from(numbers).zip(words, "#0 + ' ' + #1").toArray();
    
    test.ok(
        numbersAndWords.length == 3 &&
        numbersAndWords[0] == '1 one' &&
        numbersAndWords[1] == '2 two' &&
        numbersAndWords[2] == '3 three');

    var numbers2 = [ 5, 2, 1, 3, 6 ];
    var largerElements = from(numbers2).zip(numbers, "#0 > #1 ? #0 : #1").toArray();
    
    test.ok(
        largerElements.length == 4 &&
        largerElements[0] == 5 &&
        largerElements[1] == 2 &&
        largerElements[2] == 3 &&
        largerElements[3] == 4);

    var quarterlySales = [ 4023.52, 7701.65, 2435.20 ];
    var quarterlyRate = [ 0.25, 0.2, 0.3, 0.2 ];
    var totalCommission = from(quarterlySales).zip(quarterlyRate, "#0 * #1").sum();
    
    test.ok(totalCommission == 3276.77);
    
    test.done();
};
