/**
 * from.js v3.0.0
 *
 * Copyright 2012-2013 suckgamony@gmail.com
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {

// Beginning of code

function init(from, platform) {

var lambdaParse = from.lambda.parse;
var extend = from.utils.extend;
var isSync = from.utils.isIterable;

//
// Iterable
//

function Iterable(it) {
	this.each = it;
}

Iterable.prototype.where = function(pred, argOuter) {
    pred = lambdaParse(pred, 3);

	var self = this;
	function it(proc, callback, arg) {
        proc = lambdaParse(proc, 4);

        self.each(
            function (v, k, next) {
                if (pred(v, k, argOuter)) {
                    proc(v, k, next, arg);
                } else {
                    next();
                }
            },
            null,
            function (broken) {
                if (callback) callback(broken);
            });
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.aggregate = function(seed, proc, arg, callback) {
    proc = lambdaParse(proc, 5);

    if (seed === null) {
        var first = true;
        var c;

        this.each(
            function (v, k, n, a) {
                function next(result) {
                    c = result;
                    n();
                }

                if (first) {
                    first = false;
                    next(v);
                } else {
                    proc(c, v, k, next, arg);
                }
            },
            null,
            function (broken) {
                if (callback) callback(c);
            });
    } else {
        var c = seed;
        this.each(
            function (v, k, n, a) {
                function next(result) {
                    c = result;
                    n();
                }

                proc(c, v, k, next, arg);
            },
            null,
            function (broken) {
                if (callback) callback(c);
            });
    }

    return this;
};

Iterable.prototype.all = function(pred, arg, callback) {
    pred = lambdaParse(pred, 3);

    this.each(
        function (v, k, n) {
            n(pred(v, k, arg));
        },
        null,
        function (broken) {
            if (callback) callback(!broken);
        });
    return this;
};

Iterable.prototype.any = function(pred, arg, callback) {
    if (arguments.length == 1) {
        callback = pred;
        pred = function () { return true; };
    }

    pred = lambdaParse(pred, 3);

    this.each(
        function (v, k, n) {
            n(!pred(v, k, arg));
        },
        null,
        function (broken) {
            if (callback) callback(broken);
        });
    return this;
};

Iterable.prototype.at = function(index, callback) {
	this.skip(index).first(callback);
    return this;
};

Iterable.prototype.atOrDefault = function (index, defValue, callback) {
    this.at(index, function (v) {
        if (v === undefined) {
            callback(defValue);
        } else {
            callback(v);
        }
    });
    return this;
};

Iterable.prototype.average = function (callback) {
    var first = true;
    var sum, couunt;

    this.each(
        function (v, k, n) {
            if (first) {
                first = false;
                sum = v;
                count = 1;
            } else {
                sum += v;
                ++count;
            }
            n();
        },
        null,
        function () {
            if (callback) callback(sum / count);
        });

	return this;
};

Iterable.prototype.concat = function(second) {
	var self = this;
	function iterator(proc, arg, callback) {
        proc = lambdaParse(proc, 4);

        self.each(proc, arg, function (broken) {
            if (broken) {
                callback(true);
            } else {
                async(second).each(proc, arg, callback);
            }
        });
    	return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.contains = function(value, comparer, arg, callback) {
    if (arguments.length == 2) {
        callback = comparer;
        comparer = null;
    }

    if (comparer) {
        comparer = lambdaParse(comparer, 3);
    } else {
        comparer = function (a, b) { return a == b; };
    }

    this.each(
        function (v, k, n, a) {
            n(!comparer(value, v, arg));
        }, null,
        function (broken) {
            if (callback) callback(broken);
        });

	return this;
};

Iterable.prototype.count = function(pred, arg, callback) {
    if (arguments.length == 1) {
        callback = pred;
        pred = function () { return true; };
    }

    var count = 0;

    this.each(
           function (v, k, n, a) {
            if (pred(v, k, arg)) ++count;
            n();
        }, null,
        function () {
            if (callback) callback(count);
        });
    return this;
};

Iterable.prototype.defaultIfEmpty = function(defValue) {
	var self = this;
	var it = function(proc, arg, callback) {
        proc = lambdaParse(proc, 4);

        var any = false;
        self.each(
            function (v, k, n) {
                any = true;
                proc(v, k, n, arg);
            });

        if (!any) {
            proc(defValue, 0, function (result) {
                if (callback) callback(result === false);
            }, arg);
        }

        return this;
	};

	return new Iterable(it);
};

Iterable.prototype.distinct = function(comparer, arg) {
	var list = [];
    var fromList = from(list);

	var self = this;
	function it(proc, argInner, callback) {
        proc = lambdaParse(proc, 4);

        self.each(
            function (v, k, n) {
                if (!fromList.contains(v, comparer, arg)) {
                    list.push(v);
                    fromList = from(list);

                    proc(v, k, n, argInner);
                } else {
                    n();
                }
            }, null,
            function (broken) {
                if (callback) callback(broken);
            });
        return this;
	};

	return new Iterable(it);
};

Iterable.prototype.dump = function () {
    if (platform == 'nodejs') {
        this.each('console.log("key = " + $$ + ", value = " + $), @@()');
    } else {
        this.each('document.writeln("key = " + $$ + ", value = " + $ + "<br/>"), @@()');
    }
    
    return this;
};

Iterable.prototype.except = function(second, comparer, arg) {
    second = auto(second);

    var contains;
    if (isSync(second)) {
        contains = function (value, comparer, arg, callback) {
            callback(second.contains(value, comparer, arg));
        };
    } else {
        contains = function (value, comparer, arg, callback) {
            second.contains(value, comparer, arg, callback);
        };
    }
	
	var self = this;
	function it(proc, arg, callback) {
        proc = lambdaParse(proc, 4);

        self.each(
            function (v, k, n) {
                contains(v, comparer, arg, function (result) {
                    if (!result) {
                        proc(v, k, n, arg);
                    } else {
                        n();
                    }
                });
            }, null,
            function (broken) {
                if (callback) callback(broken);
            });
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.first = function(pred, arg, callback) {
    if (arguments.length == 1) {
        callback = pred;
        pred = function () { return true; };
    }

    var result;
    this.each(
        function (v, k, n) {
            if (pred(v, k, arg)) {
                result = v;
                n(false);
            } else {
                n();
            }
        }, null,
        function (broken) {
            if (callback) callback(result);
        });
    return this;
};

Iterable.prototype.firstOrDefault = function(pred, defValue, arg, callback) {
    if (arguments.length == 2) {
        callback = defValue;
        defValue = pred;
        pred = function () { return true; };
    }

    this.first(pred, arg, function (result) {
        if (!callback) return;
        if (result === undefined) {
            callback(defValue);
        } else {
            callback(result);
        }
    });
    return this;
};

Iterable.prototype.groupBy = function (selectors, comparer, arg) {
    var valueSelector;
    var keySelector;
    var resultSelector;

    if (selectors) {
        valueSelector = selectors.value;
        keySelector = selectors.key;
        resultSelector = selectors.result;
    }
    
    valueSelector = (valueSelector || '$');
    keySelector = (keySelector || '$$');
    
    if (resultSelector) {
	    var rs;
	    if (typeof(resultSelector) == "string") {
		    rs = lambdaReplace(resultSelector, "$", "$$", "@a");
	    }
	    else {
		    rs = "@rs($,$$,@a)";
	    }

	    return this._getGroupIterable(valueSelector, keySelector, comparer, arg).selectPair(rs, "$$", {rs: resultSelector, a: arg});
    } else {
	    return this._getGroupIterable(valueSelector, keySelector, comparer, arg);
    }
};

Iterable.prototype._getGroupIterable = function(valueSelector, keySelector, comparer, arg) {
	var groups = new Grouper(comparer, arg);
	var $groups = from(groups);

	var ks;
	if (typeof(keySelector) == "string") {
		ks = "(" + lambdaReplace(keySelector, "$", "$$", "@a") + ")";
	}
	else {
		ks = "@ks($,$$,@a)";
	}

	var vs;
	if (typeof(valueSelector) == "string") {
		vs = "(" + lambdaReplace(valueSelector, "$", "$$", "@a") + ")";
	}
	else {
		vs = "@vs($,$$,@a)";
	}

	this.each("(@k=" + ks + "),(@v=" + vs + "),@g.add(@k,@v),0", {ks: keySelector, vs: valueSelector, g: groups, a: arg});

	return $groups;
}

Iterable.prototype.groupJoin = function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, arg) {
	inner = from(inner);
	
	var oks;
	if (typeof(outerKeySelector) == "string") {
		oks = "(" + lambdaReplace(outerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		oks = "@oks($,$$,@a)";
	}

	var iks;
	if (typeof(innerKeySelector) == "string") {
		iks = "(" + lambdaReplace(innerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		iks = "@iks($,$$,@a)";
	}

	var compStr;
	if (!comparer) {
		compStr = "@ok==" + iks;
	}
	else if (typeof(comparer) == "string") {
		compStr = lambdaReplace(comparer, "@ok", iks);
	}
	else {
		compStr = "@c(@ok," + iks + ")";
	}
	compStr = quote(compStr);

	var w = "@i.where(" + compStr + ",{a:@a,ok:" + oks + ",c:@c})";

	var rs;
	if (typeof(resultSelector) == "string") {
	    var splited = [];
		var hint = lambdaGetUseCount(resultSelector, 3, splited);
		
		switch (hint[1]) {
		case 0:
		case 1: rs = lambdaJoin(splited, "$", w, "@a"); break;
		default: rs = "(@w=" + w + "),(" + lambdaJoin(splited, "$", "@w", "@a") + ")"; break;
		}
	}
	else {
		rs = "@rs($," + w + ",@a)";
	}

	return this.select(rs, {rs: resultSelector, i: inner, a: arg, c: comparer});
};

Iterable.prototype.indexOf = function(pred, arg) {
    return this.where(pred, arg).select('$$').firstOrDefault(-1);
};

Iterable.prototype.intersect = function(second, comparer, arg) {
	var compStr;
	if (!comparer) {
		compStr = "null";
	}
	else if (typeof(comparer) == "string") {
		compStr = quote(comparer);
	}
	else {
		compStr = "@c";
	}

	return this.where("@t.contains($," + compStr + ",@a)", {t: from(second), a: arg, c: comparer});
};

Iterable.prototype.join = function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, arg) {
	inner = from(inner);
	
	var oks;
	if (typeof(outerKeySelector) == "string") {
		oks = "(" + lambdaReplace(outerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		oks = "@oks($,$$,@a)";
	}

	var iks;
	if (typeof(innerKeySelector) == "string") {
		iks = "(" + lambdaReplace(innerKeySelector, "$", "$$", "@a") + ")";
	}
	else {
		iks = "@iks($,$$,@a)";
	}

	var compStr;
	if (!comparer) {
		compStr = "@ok==" + iks;
	}
	else if (typeof(comparer) == "string") {
		compStr = lambdaReplace(comparer, "@ok", iks);
	}
	else {
		compStr = "@c(@ok," + iks + ")";
	}
	compStr = quote(compStr);

	var rs;
	if (typeof(resultSelector) == "string") {
		rs = "(" + lambdaReplace(resultSelector, "@ov", "$", "@a") + ")";
	}
	else {
		rs = "@rs(@ov,$,@a)";
	}

	var self = this;
	function it(proc, arg0) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var list = [];
			var v, k;

			switch (hint[0]) {
			case 0:
			case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: k = "(@c++)"; break;
			default: list.push("(@cc=@c++)"); k = "@cc"; break;
			}
			
			list.push("(" + lambdaJoin(splited, v, k, "@a0") + ")");

			procStr = list.join(",");
		}
		else {
			procStr = "@p(" + rs + ",@c++,@a0)";
		}

		this.broken = self.each("(@ok=" + oks + "),(@ov=$),@i.where(" + compStr + ",@).each(" + quote(procStr) + ",@)", {i: inner, oks: outerKeySelector, iks: innerKeySelector, rs: resultSelector, p: proc, a: arg, a0: arg0, c: 0}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.last = function(pred, arg) {
	if (!pred) {
		var a = {};
		this.each("@r=$", a);
		return a.r;
	}
	else if (typeof(pred) == "string") {
		var a = {a: arg};
		this.each("(" + lambdaReplace(pred, "$", "$$", "@a") + ")?@r=$:0", a);
		return a.r;
	}
	else {
		var a = {a: arg, p: pred};
		this.each("@p($,$$,@a)?@r=$:0", a);
		return a.r;
	}
};

Iterable.prototype.lastOrDefault = function(pred, defValue, arg) {
	if (arguments.length <= 1) {
		var v = this.last();
		return (v === undefined ? pred : v);
	}
	else {
		var v = this.last(pred, arg);
		return (v === undefined ? defValue : v);
	}
};

Iterable.prototype.max = function(selector, arg) {
	if (!selector) {
		return this.aggregate(null, "#0>#1?#0:#1");
	}

	var s;
	if (typeof(selector) == "string") {
		s = "(" + lambdaReplace(selector, "$", "$$", "@a") + ")";
	}
	else {
		s = "@s($,$$,@a)";
	}	

	var a = {f: true, s: selector, a: arg};
	this.each("@f?((@f=false),(@r=$),(@m=" + s + "),0):((@v=" + s + "),(@v>@m?((@m=@v),(@r=$)):0),0)", a);

	return a.r;
};

Iterable.prototype.min = function(selector, arg) {
	if (!selector) {
		return this.aggregate(null, "#0<#1?#0:#1");
	}

	var s;
	if (typeof(selector) == "string") {
		s = "(" + lambdaReplace(selector, "$", "$$", "@a") + ")";
	}
	else {
		s = "@s($,$$,@a)";
	}	

	var a = {f: true, s: selector, a: arg};
	this.each("@f?((@f=false),(@r=$),(@m=" + s + "),0):((@v=" + s + "),(@v<@m?((@m=@v),(@r=$)):0),0)", a);

	return a.r;
};

Iterable.prototype.orderBy = function(keySelector, comparer, arg) {
	return new OrderedIterable(this).addCriteria(keySelector, comparer, 1, arg);
};

Iterable.prototype.orderByDesc = function(keySelector, comparer, arg) {
	return new OrderedIterable(this).addCriteria(keySelector, comparer, -1, arg);
};

Iterable.prototype.reverse = function() {
	var self = this;
	function _it(proc, _a) {
		var _l = [];
		self.each("@push($$),@push($),0", _l);

		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK;
			var v, k;

			switch (hint[0]) {
			case 0:
			case 1: defV = ""; v = "l[(i-1)*2+1]"; break;
			default: defV = "var v=l[(i-1)*2+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: defK = ""; k = "l[(i-1)*2]"; break;
			default: defK = "var k=l[(i-1)*2];"; k = "k"; break;
			}

			var f = new Function("l", "a", "for(var i=l.length/2;i>0;--i){" + defK + defV + "if((" + lambdaJoin(splited, v, k, "a") + ")===false){return true;}}return false;");
			this.broken = f(_l, _a);
		}
		else {
			this.broken = false;
			for (var i = _l.length / 2; i > 0; --i) {
				if (proc(_l[(i - 1) * 2 + 1], _l[(i - 1) * 2], _a) === false) {
					this.broken = true;
					break;
				}
			}
		}

		return this;
	}

	return new Iterable(_it);
};

Iterable.prototype.select = function(selector, arg0) {
	var self = this;
	var iterator;

	var s;
	if (typeof(selector) == "string") {
		s = cache.get("($_$$_a0)", selector);
		if (!s) {
			s = "(" + lambdaReplace(selector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", selector, s);
		}
	}
	else {
		s = "@s($,$$,@a0)";
	}
	
	iterator = function(proc, arg) {
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);

			var list = [];
			var v, k;

			switch (hint[0]) {
			case 0: v = ""; break;
			case 1: v = s; break;
			default: list.push("(@v=" + s + ")"); v = "@v"; break;
			}

			switch (hint[1]) {
			case 0: k = ""; break;
			case 1: k = "(@i++)"; break;
			default: list.push("(@j=@i++)"); k = "@j"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a"));

			this.broken = self.each(list.join(","), {s: selector, a0: arg0, a: arg, i: 0}).broken;
		}
		else {
			this.broken = self.each("@p(" + s + ",@i++,@a)", {s: selector, a0: arg0, a: arg, i: 0, p: proc}).broken;
		}

		return this;
	};

	return new Iterable(iterator);
};

Iterable.prototype.selectMany = function(selector, arg) {
	var s;
	if (typeof(selector) == "string") {
		s = lambdaReplace(selector, "$", "$$", "@a");
	}
	else {
		s = "@s($,$$,@a)";
	}
	
	var self = this;
	function it(proc, arg0) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			
			switch (hint[1]) {
			case 0:
			case 1: procStr = lambdaJoin(splited, "$", "(@i++)", "@a0"); break;
			default: procStr = "(@j=@i++),(" + lambdaJoin(splited, "$", "@j", "@a0") + ")";
			}
		}
		else {
			procStr = "@p($,@i++,@a0)";
		}
		
		this.broken = self.each("from(" + s + ").each(" + quote(procStr) + ",@)", {s: selector, a: arg, a0: arg0, i: 0, p: proc}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.selectPair = function(valueSelector, keySelector, arg0) {
	var self = this;
	var iterator;

	var vs, ks;

	if (typeof(valueSelector) == "string") {
		vs = cache.get("($_$$_a0)", valueSelector);
		if (!vs) {
			vs = "(" + lambdaReplace(valueSelector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", valueSelector, vs);
		}
	}
	else {
		vs = "@vs($,$$,@a0)";
	}

	if (typeof(keySelector) == "string") {
		ks = cache.get("($_$$_a0)", keySelector);
		if (!ks) {
			ks = "(" + lambdaReplace(keySelector, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", keySelector, ks);
		}
	}
	else {
		ks = "@ks($,$$,@a0)";
	}

	function it(proc, arg) {
		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k;
			var list = [];

			switch (hint[0]) {
			case 0:
			case 1: v = vs; break;
			default: list.push("(@VS=" + vs + ")"); v = "@VS"; break;
			}

			switch (hint[1]) {
			case 0:
			case 1: k = ks; break;
			default: list.push("(@KS=" + ks + ")"); k = "@KS"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a"));

			procStr = list.join(",");
		}
		else {
			procStr = "@p(" + vs + "," + ks + ",@a)";
		}

		this.broken = self.each(procStr, {a0: arg0, a: arg, p: proc, vs: valueSelector, ks: keySelector}).broken;
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.sequenceEqual = function(second, comparer, arg) {
	var comp;
	if (!comparer) {
		comp = "#0==#1";
	}
	else if (typeof(comparer) == "string") {
		comp = lambdaReplace(comparer, "#0", "#1", "@a");
	}
	else {
		comp = "@c(#0,#1,@a)";
	}
	
	return this.zip(second, comp, {a: arg, c: comparer}).all("$==true");
};

Iterable.prototype.single = function(pred, arg) {
	var q = (!pred ? this.take(2) : this.where(pred).take(2));
	if (q.count() == 1) {
		return q.first();
	}
};

Iterable.prototype.singleOrDefault = function(pred, defValue, arg) {
	var q;
	if (arguments.length <= 1) {
		q = this.take(2);
		defValue = pred;
	}
	else {
		q = this.where(pred).take(2);
	}

	var count = q.count();
	if (count == 0) {
		return defValue;
	}
	else if (count == 1) {
		return q.first();
	}
	else {
		throw new Error("The sequence has more than one element satisfying the condition.");
	}
};

Iterable.prototype.skip = function(count) {
    if (count == 0) {
        return this;
    } else if (count < 0) {
        return this.reverse().skip(-count).reverse();
    }

	var self = this;
	function iterator(proc, arg) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a") + ")";
				cache.set("($_$$_a)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a)";
		}

		this.broken = self.each("@c==0?" + p + ":--@c", {p: proc, a: arg, c: count}).broken;
		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.skipWhile = function(pred, arg) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")"
			cache.set("($_$$_a)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a0)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a0") + ")";
				cache.set("($_$$_a0)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a0)";
		}

		this.broken = self.each("@f||(@f=!" + pr + ")?" + p + ":0", {pr: pred, f: false, a: arg, a0: arg0}).broken;
		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.sum = function() {
	return this.aggregate(null, "#0+#1");
};

Iterable.prototype.take = function(count) {
    if (count == 0) {
        return from();
    } else if (count < 0) {
        return this.reverse().take(-count).reverse();
    }

	var self = this;
	function iterator(proc, arg) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a") + ")";
				cache.set("($_$$_a)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a)";
		}

		var _ = {i: 0, p: proc, a: arg, b: false};
		var broken = self.each("(@i++<" + count + ")?" + p + ":(@b=true,false)", _).broken;
		this.broken = broken && !_.b;

		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.takeWhile = function(pred, arg) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")"
			cache.set("($_$$_a)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
			p = cache.get("($_$$_a0)", proc);
			if (!p) {
				p = "(" + lambdaReplace(proc, "$", "$$", "@a0") + ")";
				cache.set("($_$$_a0)", proc, p);
			}
		}
		else {
			p = "@p($,$$,@a0)";
		}

		var _ = {p: proc, pr: pred, a: arg, a0: arg0, b: false};
		var broken = self.each(pr + "?" + p + ":(@b=true,false)", _).broken;
		this.broken = broken && !_.b;

		return this;
	}

	return new Iterable(iterator);
};

Iterable.prototype.toArray = function() {
	var result = [];
	this.each("@push($)", result);
	return result;
};

Iterable.prototype.toDictionary = function() {
	var result = {};
	this.each("@[$$]=$", result);
	return result;
};

Iterable.prototype.toJSON = function(track) {
	if (!track) track = [];
	var $track = from(track);

	function toJSON(obj) {
		var type = typeof(obj);
		if (type == "string") {
			return quote(obj);
		}
		else if (type == "number" || type == "boolean") {
			return obj.toString();
		}
		else if (type == "function") {
			return toJSON(obj());
		}
		else {
			if ($track.contains(obj) ||
				((obj instanceof ArrayIterable || obj instanceof ObjectIterable) && $track.contains(obj.data))) {
				
				return "null";
			}

			return from(obj).toJSON(track);
		}
	}

	var firstKey = this.select("$$").first();
	var isArray = (typeof(firstKey) == "number");

	track.push(this);
	var json;

	if (isArray) {
		var result = [];
		this.each(function(v) {
			result.push(toJSON(v));
		});

		json = "[" + result.join(", ") + "]";
	}
	else {
		var result = [];
		this.each(function(v, k) {
			result.push(quote(k.toString()) + ": " + toJSON(v));
		});

		json = "{" + result.join(", ") + "}";
	}

	track.pop(this);
	return json;
};

Iterable.prototype.toString = function(separator) {
    return this.toArray().join(separator || '');
};

Iterable.prototype.toURLEncoded = function() {
	return toURLEncoded(null, this);
};

Iterable.prototype.trim = function(left, right, arg) {
    var args = getTrimmingArgument(left, right, arg);

    return this.skipWhile(args.left, args.leftArg).reverse().skipWhile(args.right, args.rightArg).reverse();
};

Iterable.prototype.union = function(second, comparer, arg) {
	var buffer = [];

	var self = this;
	function it(proc, arg0) {
		var p;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			
			switch (hint[1]) {
			case 0:
			case 1: p = lambdaJoin(splited, "$", "(@b.length-1)", "@a0"); break;
			default: p = "(@bb=@b.length-1),(" + lambdaJoin(splited, "$", "@bb", "@a0") + ")"; break;
			}
		}
		else {
			p = "@p($,@b.length-1,@a0)";
		}

		var lambda = "from(@b).contains($,@c,@a)?0:(@b.push($)," + p + ",0)";

		var a = {c: comparer, b: buffer, p: proc, a0: arg0, a: arg};
		if (self.each(lambda, a).broken) {
			this.broken = true;
			return this;
		}
		if (from(second).each(lambda, a).broken)  {
			this.broken = true;
			return this;
		}

		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.zip = function(second, resultSelector, arg) {
	var rs;
	if (typeof(resultSelector) == "string") {
	    var splited = [];
		var hint = lambdaGetUseCount(resultSelector, 5, splited);
		var v, k, list = [];

		switch (hint[0]) {
		case 0: case 1: v = "@d[@i*2+1]"; break;
		default: list.push("(@V=@d[@i*2+1])"); v = "@V"; break;
		}

		switch (hint[2]) {
		case 0: case 1: k = "@d[@i*2]"; break;
		default: list.push("(@K=@d[@i*2])"); k = "@K"; break;
		}

		list.push(lambdaJoin(splited, v, "$", k, "$$", "@a"));

		rs = "(" + list.join(",") + ")";
	}
	else {
		rs = "@rs(@d[@i*2+1],$,@d[@i*2],$$,@a)";
	}

	var self = this;
	function iterator(proc, arg0) {
		var data = [];
		self.each("@push($$),@push($),0", data);

		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k, list = [];

			switch (hint[0]) {
			case 0: case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0: case 1: k = "(@k++)"; break;
			default: list.push("(@kk=@k++)"); k = "@kk"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a0"));

			procStr = "(" + list.join(",") + ")";
		}
		else {
			procStr = "@p(" + rs + ",@k++,@a0)";
		}

		this.broken = from(second).each("@i>=" + (data.length / 2) + "?false:@r=" + procStr + ",++@i,@r", {a: arg, a0: arg0, k: 0, i: 0, d: data, p: proc, rs: resultSelector}).broken;
		return this;
	}

	return new Iterable(iterator);
};

//
// AsyncIterable
//

function AsyncIterable(initializer, looper, progressor) {
    this.initializer = initializer;
    this.looper = looper;
    this.progressor = progressor;
}
extend(Iterable, AsyncIterable);

AsyncIterable.prototype.each = function(proc, _a, callback) {
    var initializer = this.initializer;
    var data = {};

    if (initializer && !initializer(data, callback)) {
        return this;
    }

    var looper = this.looper;
    var progressor = this.progressor;

    var inLoop;
    var callNext;

    proc = lambdaParse(proc, 3);

    function loop() {
        inLoop = true;

        do {
            callNext = false;
            looper(data, proc, _a, next, callback);
        } while (callNext);

        inLoop = false;
    }

    function next(broken) {
        if (broken === false) {
            if (callback) callback(true);
        } else {
            if (progressor) progressor(data);
            if (inLoop) {
                callNext = true;
            } else {
                loop();
            }
        }
    }

    loop();

	return this;
};

//
// RandomAccessIterable
//

function RandomAccessIterable(data) {
	this.data = data;
    this.rev = false;

    var self = this;

    function initializer(d, callback) {
        var region = self.measureRegion();
        var s = region.start;
        var e = region.end;
        
        if (s >= e) {
            if (callback) callback(false);
            return false;
        }
        
        d.take = lambdaParse(region.take, 3);
        d.takeArg = region.takeArg;
        d.s = s;
        d.e = e;

        return true;
    }

    function looper(d, proc, arg, next, callback) {
        var s = d.s;
        var e = d.e;

        if (s < e) {
            var key = (!self.rev ? s : e - 1);
            var value = self.getItem(self.data, key);
            
            if (d.take && !d.take(value, key, d.takeArg)) {
                if (callback) callback(false);
            } else {
                proc(value, key, next, arg);
            }
        } else {
            if (callback) callback(false);
        }
    }

    function progressor(d) {
        if (!self.rev) ++d.s; else --d.e;
    }

    AsyncIterable.call(this, initializer, looper, progressor);
}
extend(AsyncIterable, RandomAccessIterable);

RandomAccessIterable.prototype.initRegion = function () {
    var r = this.region;
    if (!r) {
        this.region = r = {
            queries: null,
            measured: false,
            start: null,
            end: null,
            take: null,
            takeArg: null
        };
    }

    return r;
};

RandomAccessIterable.prototype.addRegionQuery = function (type, proc, arg) {
    var r = this.initRegion();
    var q = r.queries;

    if (!q) {
        r.queries = q = [];
    }

    q.push(type);
    q.push(proc);
    q.push(arg);

    r.start = r.end = null;
    r.measured = false;

    return this;
};

RandomAccessIterable.prototype.clone = function () {
    var result = new this.constructor(this.data);

    var r = this.region;
    if (r) {
        var rr = result.region = {
            measured: r.measured,
            start: r.start,
            end: r.end,
            take: r.take,
            takeArg: r.takeArg
        };

        var q = r.queries;
        if (q) {
            var qq = rr.queries = [];
            for (var i = 0, c = q.length; i < c; ++i) {
                qq.push(q[i]);
            }
        }
    }
    
    result.rev = this.rev;

    return result;
};

RandomAccessIterable.prototype.reverseRegion = function () {
    var r = this.initRegion();

    if (r) {
        if (r.take) {
            r.measured = false;
        }
        r.take = r.takeArg = null;
    }

    this.rev = !this.rev;
    
    return this;
};

RandomAccessIterable.prototype.measureRegion = function () {
    var region = this.initRegion();

    if (!region.measured) {
        var data = this.data;
        var start = region.start;
        var end = region.end;

        if (start == null) start = 0;
        if (end === null) end = data.length;

        region.take = region.takeArg = null;

        var queries = region.queries;

        if (!queries) {
            region.start = start;
            region.end = end;
        } else {
            var codes = [];

            for (var i = 0, c = queries.length; i < c; i += 3) {
                var type = queries[i];
                var proc = queries[i + 1];
                var arg = queries[i + 2];

                if (type == 'skipLeft') {
                    if (typeof proc == 'number') {
                        start = Math.min(end, start + proc);
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetUseCount(proc, 3, splited);

                        var vars = prepareVariables(hints,
                            'v', this.lambdaGetItem('d', 's'),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(;s<e;++s){', vars.decl,
                            'if(!(', lambdaJoin(splited, vars.v, 's', vars.a), ')){break;}}');
                    } else {
                        codes.push('for(;s<e&&q[', i + 1, '](', this.lambdaGetItem('d', 's'), ',s,q[', i + 2, ']);++s);');
                    }
                } else if (type == 'skipRight') {
                    if (typeof proc == 'number') {
                        end = Math.max(start, end - proc);
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetUseCount(proc, 3, splited);

                        var i1, i2;
                        
                        if (hints[1] == 0) {
                            i1 = ''; i2 = 'e-1';
                        } else {
                            i1 = 'var _i=e-1;'; i2 = '_i';
                        }

                        var vars = prepareVariables(hints,
                            'v', this.lambdaGetItem('d', i2),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(;s<e;--e){', i1, vars.decl,
                            'if(!(', lambdaJoin(splited, vars.v, i2, vars.a), ')){break;}}');
                    } else {
                        codes.push('for(;s<e;--e){var _i=e-1;',
                            'if(!q[', i + 1, '](', this.lambdaGetItem('d', '_i'), ',_i,q[', i + 2, '])){break;}}');
                    }
                } else if (type == 'takeLeft') {
                    if (typeof proc == 'number') {
                        end = Math.min(end, start + proc);
                    } else {
                        if (i == c - 3 && !this.rev) {
                            region.take = proc;
                            region.takeArg = arg;
                        } else if (typeof proc == 'string') {
                            var splited = [];
                            var hints = lambdaGetUseCount(proc, 3, splited);

                            var vars = prepareVariables(hints,
                                '_v', this.lambdaGetItem('d', 'e'),
                                null, null,
                                '_a', 'q[' + (i + 2) + ']');

                            codes.push('for(var _e2=e,e=s;e<_e2;++e){', vars.decl,
                                'if(!(', lambdaJoin(splited, vars._v, 'e', vars._a), ')){break;}}');
                        } else {
                            codes.push('for(var _e2=e,e=s;e<_e2;++e){',
                                'if(!q[', i + 1, '](', this.lambdaGetItem('d', 'e'), ',e,q[', i + 2, '])){break;}}');
                        }
                    }
                } else if (type == 'takeRight') {
                    if (typeof proc == 'number') {
                        start = Math.max(start, end - proc);
                    } else {
                        if (i == c - 3 && this.rev) {
                            region.take = proc;
                            region.takeArg = arg;
                        } else if (typeof proc == 'string') {
                            var splited = [];
                            var hints = lambdaGetUseCount(proc, 3, splited);

                            var i1, i2;
                            
                            if (hints[1] == 0) {
                                i1 = ''; i2 = 's-1';
                            } else {
                                i1 = 'var _i=s-1;'; i2 = '_i';
                            }

                            var vars = prepareVariables(hints,
                                '_v', this.lambdaGetItem('d', i2),
                                null, null,
                                '_a', 'q[' + (i + 2) + ']');

                            codes.push('for(var _s2=s,s=e;s>_s2;--s){', i1, vars.decl,
                                'if(!(', lambdaJoin(splited, vars._v, i2, vars._a), ')){break;}}');
                        } else {
                            codes.push('for(var _s2=s,s=e;s>_s2;--s){var _i=s-1;',
                                'if(!q[', i + 1, '](', this.lambdaGetItem('d', '_i'), ',_i,q[', i + 2, '])){break;}}');
                        }
                    }
                }
            }

            if (codes.length > 0) {
                codes.push('r.start=s;r.end=e;');
                var f = new Function(alias, 'd', 'r', 'q', 's', 'e', codes.join(''));
                f(from, data, region, queries, start, end);
            } else {
                region.start = start;
                region.end = end;
            }
        }

        region.measured = true;
    }

    return region;
};

/*RandomAccessIterable.prototype.each = function(proc, _a, callback) {
    var region = this.measureRegion();
    var s = region.start;
    var e = region.end;
    
    if (s >= e) {
        if (callback) callback(false);
        return this;
    }
    
	var data = this.data;
    var take = lambdaParse(region.take, 3);
    var takeArg = region.takeArg;
    var getItem = this.getItem;

    var rev = this.rev;
    var broken = false;

    var s = region.start;
    var e = region.end;

    var inLoop;
    var callNext;

    proc = lambdaParse(proc, 3);

    function loop() {
        inLoop = true;

        do {
            callNext = false;
            if (s < e) {
                var key = (!rev ? s : e - 1);
                var value = getItem(data, key);
                
                if (take && !take(value, key, takeArg)) {
                    if (callback) callback(false);
                } else {
                    proc(value, key, next, _a);
                }
            } else {
                if (callback) callback(false);
            }
        } while (callNext);

        inLoop = false;
    }

    function next(broken) {
        if (broken === false) {
            if (callback) callback(true);
        } else {
            if (!rev) ++s; else --e;
            if (inLoop) {
                callNext = true;
            } else {
                loop();
            }
        }
    }

    loop();

	return this;
};*/

RandomAccessIterable.prototype.at = function(index) {
    var r = this.measureRegion();
    if (!this.rev) {
	    return this.getItem(this.data, r.start + index);
    } else {
	    return this.getItem(this.data, r.end - index);
    }
};

RandomAccessIterable.prototype.first = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s < e) {
                if (!this.rev) {
			        return this.getItem(this.data, s);
                } else {
                    return this.getItem(this.data, e - 1);
                }
            } else {
                return;
            }
        }
	}

    return Iterable.prototype.first.call(this, pred, arg);
};

RandomAccessIterable.prototype.last = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s < e) {
                if (!this.rev) {
                    return this.getItem(this.data, e - 1);
                } else {
                    return this.getItem(this.data, s);
                }
            } else {
                return;
            }
        }
	}
    
    return Iterable.prototype.last.call(this, pred, arg);
};

RandomAccessIterable.prototype.orderBy = function(keySelector, comparer, arg) {
	return new OrderedRandomAccessIterable(this).addCriteria(keySelector, comparer, 1, arg);
};

RandomAccessIterable.prototype.orderByDesc = function(keySelector, comparer, arg) {
	return new OrderedRandomAccessIterable(this).addCriteria(keySelector, comparer, -1, arg);
};

RandomAccessIterable.prototype.reverse = function () {
    return this.clone().reverseRegion();
};

RandomAccessIterable.prototype.skip = function (count) {
    if (count < 0) {
        return this.clone().addRegionQuery(!this.rev ? 'skipRight' : 'skipLeft', -count, null);
    } else if (count > 0) {
        return this.clone().addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', count, null);
    } else {
        return this;
    }
};

RandomAccessIterable.prototype.skipWhile = function (pred, arg) {
    return this.clone().addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', pred, arg);
};

RandomAccessIterable.prototype.take = function (count) {
    if (count < 0) {
        return this.clone().addRegionQuery(!this.rev ? 'takeRight' : 'takeLeft', -count, null);
    } else if (count > 0) {
        return this.clone().addRegionQuery(!this.rev ? 'takeLeft' : 'takeRight', count, null);
    } else {
        return from();
    }
};

RandomAccessIterable.prototype.takeWhile = function (pred, arg) {
    return this.clone().addRegionQuery(!this.rev ? 'takeLeft' : 'takeRight', pred, arg);
};

RandomAccessIterable.prototype.toArray = function () {
    var r = this.measureRegion();
    if (!r.take) {
        var get = this.getItem;
        var data = this.data;
        var s = r.start;
        var e = r.end;

        var result = new Array(e - s);
        if (!this.rev) {
            for (var i = s; i < e; ++i) {
                result[i - s] = get(data, i);
            }
        } else {
            for (var i = e; i > s; --i) {
                result[e - i] = get(data, i - 1);
            }
        }

        return result;
    }

    return Iterable.prototype.toArray.call(this);
};

RandomAccessIterable.prototype.trim = function(left, right, arg) {
    var args = getTrimmingArgument(left, right, arg);

    var clone = this.clone();
    clone.addRegionQuery(!this.rev ? 'skipLeft' : 'skipRight', args.left, args.leftArg);
    clone.addRegionQuery(!this.rev ? 'skipRight' : 'skipLeft', args.right, args.rightArg);

    return clone;
};

RandomAccessIterable.prototype.zip = function(second, resultSelector, arg) {
    var rs;
    var index = (!this.rev ? '@.s++' : '--@.e');

    if (typeof(resultSelector) == "string") {
	    rs = "(" + lambdaReplace(resultSelector, '@.v', "$", '@.i', "$$", "@a") + ")";
    } else {
	    rs = '@rs(@.v,$,@.i,$$,@a)';
    }

	var self = this;
	function iterator(proc, arg0) {
		var data = self.data;

        var region = self.measureRegion();
        var s = region.start;
        var e = region.end;

        if (s >= e) {
            this.broken = false;
            return this;
        }
        
        var take = region.take;
        var takeArg = region.takeArg;

		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var v, k, list = [];

			switch (hint[0]) {
			case 0: case 1: v = rs; break;
			default: list.push("(@RS=" + rs + ")"); v = "@RS"; break;
			}

			switch (hint[1]) {
			case 0: case 1: k = "(@k++)"; break;
			default: list.push("(@kk=@k++)"); k = "@kk"; break;
			}

			list.push(lambdaJoin(splited, v, k, "@a0"));

			procStr = "(" + list.join(",") + ")";
		}
		else {
			procStr = "@p(" + rs + ",@k++,@a0)";
		}

        var _p = ["@.s>=@.e?@.b=false:((@.i=", index, '),(@.v=', self.lambdaGetItem('@.d', '@.i'), '),'];

        if (take) {
            if (typeof take == 'string') {
                _p.push('!(', lambdaReplace(take, '@.v', '@.i', '@.ta'), ')');
            } else {
                _p.push('!@t(@.v,@.i,@.ta)');
            }
            _p.push('?@.b=false:(', procStr, "))");
        } else {
            _p.push(procStr, ')');
        }

        var a = {a: arg, a0: arg0, k: 0, d: data, s: s, e: e, p: proc, rs: resultSelector, b: true, t: take, ta: takeArg};
		this.broken = from(second).each(_p.join(''), a).broken && a.b;
		return this;
	}

	return new Iterable(iterator);
};

//
// StringIterable
//

function StringIterable(str) {
    RandomAccessIterable.call(this, str);
}
extend(RandomAccessIterable, StringIterable);

StringIterable.prototype.dataType = 'string';

StringIterable.prototype.lambdaGetItem = function (target, index) {
    return target + '.charAt(' + index + ')';
};

StringIterable.prototype.getItem = function (target, index) {
    return target.charAt(index);
};

StringIterable.prototype.toString = function (separator) {
    if (!separator && !this.rev) {
        var data = this.data;
        
        var r = this.measureRegion();
        if (!r.take) {
            var s = r.start;
            var e = r.end;

            if (s == 0 && e == data.length) {
                return data;
            } else {
                return data.substring(s, e);
            }
        }
    }

    return Iterable.prototype.toString.call(this, separator);
};

StringIterable.prototype.toJSON = function() {
	return quote(this.data);
};

//
// ArrayIterable
//

function ArrayIterable(array) {
    RandomAccessIterable.call(this, array);
}
extend(RandomAccessIterable, ArrayIterable);

ArrayIterable.prototype.dataType = 'array';

ArrayIterable.prototype.lambdaGetItem = function (target, index) {
    return target + '[' + index + ']';
};

ArrayIterable.prototype.getItem = function (target, index) {
    return target[index];
};

ArrayIterable.prototype.toJSON = function(track) {
	if (track) {
		track.push(this.data);
	}
	else {
		track = [this.data];
	}
	
	var json = Iterable.prototype.toJSON.call(this, track);
	track.pop();

	return json;
};

ArrayIterable.prototype.toArray = function () {
    if (this.mutable) {
        if (this.rev) {
        } else {
            var r = this.measureRegion();
            if (!r.take) {
                return this.data.slice(r.start, r.end);
            }
        }
    } else {
        if (this.rev) {
            return RandomAccessIterable.prototype.toArray.call(this);
        }
        
        var r = this.measureRegion();
        if (!r.take) {
            return this.data.slice(r.start, r.end);
        }
    }

    return Iterable.prototype.toArray.call(this);
};

//
// ObjectIterable
//

function ObjectIterable(data) {
	this.data = data;
}
extend(Iterable, ObjectIterable);

ObjectIterable.prototype.each = function(proc, _a) {
	var _d = this.data;
	
	if  (typeof(proc) == "function") {
		this.broken = false;
		for (var key in _d) {
			if (proc(_d[key], key, _a) === false) {
				this.broken = true;
				break;
			}
		}
	}
	else {
		var f = cache.get("each_o", proc);
		if (!f) {   
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, v;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "d[k]"; break;
			default: defV = "var v=d[k];"; v = "v"; break;
			}

			f = new Function(alias, "d", "a", "for(var k in d){" + defV + "if((" + lambdaJoin(splited, v, "k", "a") + ")===false){return true;}}return false;");
			cache.set("each_o", proc, f);
		}

		this.broken = f(from, _d, _a);
	}

	return this;
};

ObjectIterable.prototype.at = function(index) {
	return this.skip(index).first();
};

ObjectIterable.prototype.reverse = function() {
	return new ObjectReversedIterable(this.data);
};

ObjectIterable.prototype.toJSON = ArrayIterable.prototype.toJSON;

//
// ObjectReversedIterable
//

function ObjectReversedIterable(data) {
	this.data = data;
}
extend(ObjectIterable, ObjectReversedIterable);

ObjectReversedIterable.prototype.each = function(proc, _a) {
	var _d = this.data;

	var row = [];
	for (var key in _d) {
		row.push(key);
		row.push(_d[key]);
	}

	if  (typeof(proc) == "string") {
		var f = cache.get("each_or", proc);
		if (!f) {
		    var splited = [];
			var hint = lambdaGetUseCount(proc, 3, splited);
			var defV, defK, v, k;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "r[ii+1]"; break;
			default: defV = "var v=r[ii+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0: case 1: defK = ""; k = "r[ii]"; break;
			default: defK = "var k=r[ii];"; k = "k"; break;
			}

			f = new Function(alias, "r", "a", "for(var i=r.length/2;i>0;--i){var ii=(i-1)*2;" + defV + defK + "if((" + lambdaJoin(splited, v, k, "a") + ")===false){return true;}}return false;");
			cache.set("each_or", proc, f);
		}

		this.broken = f(from, row, _a);
	}
	else {
		this.broken = false;
		for (var i = row.length / 2; i > 0; --i) {
			var ii = (i - 1) * 2;
			if (proc(row[ii + 1], row[ii], _a) === false) {
				this.broken = true;
				break;
			}
		}
	}

	return this;
};

ObjectReversedIterable.prototype.reverse = function() {
	return new ObjectIterable(this.data);
}

//
// OrderedIterable
//

function OrderedIterable(it) {
	this.it = it;
    this.keyRequired = false;
}
extend(ObjectIterable, OrderedIterable);

OrderedIterable.prototype.clone = function () {
    var o = new this.constructor(this.it);
    var crt = this.criteria;

    if (crt) {
        o.criteria = crt.slice();
    }

    return o;
};

OrderedIterable.prototype.addCriteria = function(keySelector, comparer, asc, arg) {
    var crt = this.criteria;
    if (!crt) {
        this.criteria = crt = [];
    }

	crt.push({
		keySelector: lambdaParse(keySelector || '$', 3),
		comparer: lambdaParse(comparer, 3),
		asc: asc,
		arg: arg
	});

    if (keySelector && !this.keyRequired) {
        if (typeof keySelector == 'string') {
            var uses = lambdaGetUseCount(keySelector, 3);
            this.keyRequired = (uses[1] > 0);
        } else {
            this.keyRequired = (getFunctionArgumentCount(keySelector) > 1);
        }
    }

    if (comparer && !this.keyRequired) {
        if (typeof comparer == 'string') {
            var uses = lambdaGetUseCount(comparer, 3);
            this.keyRequired = (uses[1] > 0);
        } else {
            this.keyRequired = (getFunctionArgumentCount(comparer) > 1);
        }
    }

    return this;
}

OrderedIterable.prototype.each = function(proc, arg) {
    var uses, splited;
    var keyRequired = this.keyRequired;
    if (!keyRequired) {
        if (typeof proc == 'string') {
            splited = [];
            uses = lambdaGetUseCount(proc, 3, splited);
            keyRequired = (uses[1] > 0);
        } else {
            keyRequired = (getFunctionArgumentCount(proc) > 1);
        }
    }

    if (keyRequired) {
        var row = [];
        this.it.each("@push($$),@push($),0", row);

        var indices = from.range(row.length / 2).toArray();
        var crts = this.criteria;

        function sortfunction(a, b) {
            if (crts) {
                for (var i = 0, l = crts.length; i < l; ++i) {
                    var crt = crts[i];

                    var aSelected = crt.keySelector(row[a * 2 + 1], row[a * 2], crt.arg);
                    var bSelected = crt.keySelector(row[b * 2 + 1], row[b * 2], crt.arg);

                    var compared;
                    if (!crt.comparer) {
                        compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -crt.asc : crt.asc));
                    } else {
                        compared = crt.asc * crt.comparer(aSelected, bSelected, crt.arg);
                    }

                    if (compared != 0) return compared;
                }
            }

            return (a == b ? 0 : (a < b ? -1 : 1));
        }

        indices.sort(sortfunction);

        if (typeof(proc) == "string") {
            var f = cache.get("each_ordered_with_key", proc);
            if (!f) {
                if (!uses) {
                    splited = [];
                    uses = lambdaGetUseCount(proc, 3, splited);
                }

                var defV, defK, v, k;

                switch (uses[0]) {
                case 0: case 1: defV = ""; v = "r[n+1]"; break;
                default: defV = "var v=r[n+1];"; v = "v"; break;
                }

                switch (uses[1]) {
                case 0: case 1: defK = ""; k = "r[n]"; break;
                default: defK = "var k=r[n];"; k = "k"; break;
                }

                f = new Function(alias, "l", "r", "a",
                    "for(var i=0,c=l.length;i<c;++i){var n=l[i]*2;" + defV + defK + "if((" + lambdaJoin(splited, v, k, "a") + ")===false)return true;}return false;");
                cache.set("each_ordered_with_key", proc, f);
            }
            this.broken = f(from, indices, row, arg);
        }
        else {
            this.broken = false;
            for (var i = 0, l = indices.length; i < l; ++i) {
                var index = indices[i] * 2;
                if (proc(row[index + 1], row[index], arg) === false) {
                    this.broken = true;
                    break;
                }
            }
        }
    } else {
        this.iterateSortedWithoutKey(uses, splited, proc, arg);
    }

	return this;
};

OrderedIterable.prototype.iterateSortedWithoutKey = function(uses, splited, proc, arg) {
    var row = this.it.toArray();
    var crts = this.criteria;

    function sortfunction(a, b) {
        if (crts) {
            for (var i = 0, l = crts.length; i < l; ++i) {
                var crt = crts[i];

                var aSelected = crt.keySelector(a);
                var bSelected = crt.keySelector(b);

                var compared;
                if (!crt.comparer) {
                    compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -crt.asc : crt.asc));
                }
                else {
                    compared = crt.asc * crt.comparer(aSelected, bSelected, crt.arg);
                }

                if (compared != 0) return compared;
            }
        }

        return (a == b ? 0 : (a < b ? -1 : 1));
    }

    row.sort(sortfunction);

    if (typeof(proc) == "string") {
        var f = cache.get("each_ordered_without_key", proc);
        if (!f) {
            if (!uses) {
                splited = [];
                uses = lambdaGetUseCount(proc, 3, splited);
            }

            var defV, v;

            switch (uses[0]) {
            case 0: case 1: defV = ""; v = "r[i]"; break;
            default: defV = "var v=r[i];"; v = "v"; break;
            }

            f = new Function(alias, "r", 'a',
                "for(var i=0,c=r.length;i<c;++i){" + defV + "if((" + lambdaJoin(splited, v, 'null', 'a') + ")===false)return true;}return false;");
            cache.set("each_ordered_without_key", proc, f);
        }
        this.broken = f(from, row, arg);
    }
    else {
        this.broken = false;
        for (var i = 0, l = row.length; i < l; ++i) {
            if (proc(row[i], null, arg) === false) {
                this.broken = true;
                break;
            }
        }
    }
};

OrderedIterable.prototype.thenBy = function(keySelector, comparer, arg) {
	return this.clone().addCriteria(keySelector, comparer, 1, arg);
};

OrderedIterable.prototype.thenByDesc = function(keySelector, comparer, arg) {
	return this.clone().addCriteria(keySelector, comparer, -1, arg);
};

//
// OrderedRandomAccessIterable
//

function OrderedRandomAccessIterable(it) {
    OrderedIterable.call(this, it);
}
extend(OrderedIterable, OrderedRandomAccessIterable);

OrderedRandomAccessIterable.prototype.each = function(proc, arg) {
    var uses, splited;
    var keyRequired = this.keyRequired;
    if (!keyRequired) {
        if (typeof proc == 'string') {
            splited = [];
            uses = lambdaGetUseCount(proc, 3, splited);
            keyRequired = (uses[1] > 0);
        } else {
            keyRequired = (getFunctionArgumentCount(proc) > 1);
        }
    }

    var it = this.it;
    var data = it.data;
	var crts = this.criteria;

    if (keyRequired) {
        var indices = this.it.select('$$').toArray();

        function sortfunction(a, b) {
            if (crts) {
                for (var i = 0, l = crts.length; i < l; ++i) {
                    var crt = crts[i];

                    var aSelected = crt.keySelector(it.getItem(data, a), a, crt.arg);
                    var bSelected = crt.keySelector(it.getItem(data, b), b, crt.arg);

                    var compared;
                    if (!crt.comparer) {
                        compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -crt.asc : crt.asc));
                    }
                    else {
                        compared = crt.asc * crt.comparer(aSelected, bSelected, crt.arg);
                    }

                    if (compared != 0) return compared;
                }
            }

            return (a == b ? 0 : (a < b ? -1 : 1));
        }

        indices.sort(sortfunction);

        if (typeof(proc) == "string") {
            var f = cache.get("each_ordered_random_access_with_key", proc);
            if (!f) {
                if (!uses) {
                    splited = [];
                    uses = lambdaGetUseCount(proc, 3, splited);
                }

                var defV, defK, v, k;

                switch (uses[1]) {
                case 0: defK = ""; k = "l[i]"; break;
                default: defK = "var k=l[i];"; k = "k"; break;
                }

                switch (uses[0]) {
                case 0: case 1: defV = ""; v = it.lambdaGetItem('r', k); break;
                default: defV = "var v=" + it.lambdaGetItem('r', k) + ";"; v = "v"; break;
                }

                f = new Function(alias, "l", "r", "a",
                    "for(var i=0,c=l.length;i<c;++i){" + defK + defV + "if((" + lambdaJoin(splited, v, k, "a") + ")===false)return true;}return false;");
                cache.set("each_ordered_random_access_with_key", proc, f);
            }
            this.broken = f(from, indices, data, arg);
        }
        else {
            this.broken = false;
            for (var i = 0, l = indices.length; i < l; ++i) {
                var index = indices[i];
                if (proc(it.getItem(data, index), index, arg) === false) {
                    this.broken = true;
                    break;
                }
            }
        }
    } else {
        this.iterateSortedWithoutKey(uses, splited, proc, arg);
    }

	return this;
};

//
// RegExpIterable
//

function RegExpIterable(r, str) {
    this._r = r;
    this._str = str;
}
extend(Iterable, RegExpIterable);

RegExpIterable.prototype.each = function (proc, arg) {
    var r = this._r;
    r.lastIndex = 0;

    if (r.global) {
	    var s = this.data;
        var p;
	
	    if (typeof(proc) == "function") {
            p = proc;
            proc = '_p($,$$,@)';
	    }

        var f = cache.get("each_regexp", proc);

        if (!f) {
            var splited = [];
            var hints = lambdaGetUseCount(proc, 3, splited);
            var i1, i2;
            
            if (hints[1] == 0) {
                i1 = '';
                i2 = '';
            } else {
                i1 = 'var _i=0';
                i2 = '++_i';
            }

            f = new Function(alias, "_r", "_s", '_a', "_p",
                ["var _m;for(", i1, ';_m=_r.exec(_s);', i2, "){if((", lambdaJoin(splited, '_m', '_i', "_a"), ")===false){return true;}}return false;"].join(''));
            cache.set("each_regexp", proc, f);
        }

        this.broken = f(from, this._r, this._str, arg, p);
	} else {
	    if (typeof proc == 'string') {
	        proc = lambdaParse(proc, 3);
	    }

        var m = r.exec(this._str);
        this.broken = (m ? proc(m, 0, arg) === false : false);
	}

    return this;
};

RegExpIterable.prototype.any = function (pred, arg) {
    if (!pred) {
        var r = this._r;
        r.lastIndex = 0;

        return r.test(this._str);
    } else {
        return Iterable.prototype.any.call(this, pred, arg);
    }
};

RegExpIterable.prototype.first = function (pred, arg) {
    if (!pred) {
        var r = this._r;
        r.lastIndex = 0;

        return r.exec(this._str);
    } else {
        return Iterable.prototype.first.call(this, pred, arg);
    }
};

function async(obj, target) {
    if (!obj) {
	    return new Iterable(function(proc, arg, callback) { callback(false); return this; });
    } else if (obj instanceof Iterable) {
		return obj;
    } else if (obj instanceof RegExp) {
        if (target) {
            return new RegExpIterable(obj, target);
        } else {
            return {
                match: function(str) {
                    return new RegExpIterable(obj, str);
                }
            };
        }
    } else if (obj.$iterableAsync) {
        return async(obj.$iterable());
    } else if (obj.$eachAsync) {
		var f = function(proc, arg) { this.broken = (obj.$each(proc, arg) === false); return this; };
		return new Iterable(f);
	} else if (typeof(obj) == "string") {
		return new StringIterable(obj);
	} else if (obj instanceof Array) {
		return new ArrayIterable(obj);
	} else {
		return new ObjectIterable(obj);
	}
};

function auto(obj) {
    if (!obj || typeof obj == 'string' || obj instanceof Array) {
	    return from(obj);
    } else if (obj instanceof Iterable || isSync(obj)) {
        return obj;
    } else if (obj.$iterableAsync || obj.$eachAsync) {
        return async(obj);
    } else {
        return from(obj);
    }
}

return async;

}

if (typeof window !== 'undefined' && window.from) {
    window.from.async = init(window.from, 'web');
} else if (typeof exports !== 'undefined') {
    exports.init = init;
}

// End of code

})();
