/**
 * from.js for node v2.0.1
 * Copyright 2012-2013 suckgamony@gmail.com
 */

(function() {



// Beginning of code

var alias = 'from';
var defaultTrimmingTarget = [0, ' ', '\n', '\t'];
var defaultTrimmingPredicateArray = '@t.indexOf($)>=0';
var defaultTrimmingPredicateIterable = '@t.contains($)';

function isNumber(str) {
	return /^[0-9]+$/.exec(str) ? true : false;
}

function expandAbbreviated(s, prefixLen, to) {
	if (s.length == prefixLen) {
		return to;
	}
	else {
		var prop = s.substr(prefixLen);
		if (isNumber(prop)) {
			return to + "[" + prop + "]";
		}
		else {
			return to + "." + prop;
		}
	}
}

var rxLambdaWithOneArg = /^\s*(\w+)\s*=>(.+)$/;
var rxLambdaWithManyArgs = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/;
var rxIds = /"(?:[^"]|\\")*"|'(?:[^']|\\')*'|[\$@\w_#]+/g;

function lambdaGetHint(str, argCount, splited) {
	var hint;
	var names;
	
	var m = rxLambdaWithOneArg.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
		hint = new Array(1);
	}
	else if (m = rxLambdaWithManyArgs.exec(str)) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
		hint = new Array(names.length);
	}
	else {
		hint = new Array(argCount);
	}

	for (var i = 0, c = hint.length; i < c; ++i) {
		hint[i] = 0;
	}
	
	var prevIndex = 0;
	var prefixToAdd = '';
	
	if (names) {
	    while (m = rxIds.exec(str)) {
			var s = m[0];
			for (var j = 0, l = names.length; j < l; ++j) {
				if (s == names[j]) {
					++hint[j];
					
					if (splited) {
					    splited.push(str.substring(prevIndex, m.index));
					    splited.push(j);
					    
					    prevIndex = m.index + s.length;
					}
					
					break;
				}
			}
	    }
	}
	else {
    	var nextPrefixToAdd = '';
	    while (m = rxIds.exec(str)) {
			var s = m[0];
			var ch = s.charAt(0);

			var arg = null;
			
			if (ch == "$") {
				var l = s.length;
				if (l >= 2 && s[1] == "$") {
					++hint[1];
					
					if (splited) {
					    arg = 1;
					    nextPrefixToAdd = expandAbbreviated(s, 2, '');
					}
				}
				else if (l == 1 || !(s in global)) {
					++hint[0];
					
					if (splited) {
					    arg = 0;
					    nextPrefixToAdd = expandAbbreviated(s, 1, '');
					}
				}
			}
			else if (ch == "@") {
			    var index = hint.length - 1;
				++hint[index];
				
				if (splited) {
				    arg = index;
				    nextPrefixToAdd = expandAbbreviated(s, 1, '');
				}
			}
			else if (ch == "#") {
				var index = parseInt(s.substr(1));
				++hint[index];
				
				if (splited) {
				    arg = index;
				    nextPrefixToAdd = '';
				}
			}
			
			if (splited && arg !== null) {
			    splited.push(prefixToAdd + str.substring(prevIndex, m.index));
			    splited.push(arg);
			    
			    prevIndex = m.index + s.length;
			    prefixToAdd = nextPrefixToAdd;
			    nextPrefixToAdd = '';
			}
		}
	}

    if (splited) {
        splited.push(prefixToAdd + str.substring(prevIndex, str.length));
    }

	return hint;
}

function lambdaReplace(str, v, k) {
	var names;
	
	var m = rxLambdaWithOneArg.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
	}
	else if (m = rxLambdaWithManyArgs.exec(str)) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
	}

	var args = arguments;
	var a = (args.length > 0 ? args[args.length - 1] : "");

	if (names) {
		return str.replace(rxIds, function(s) {
			for (var i = 0, l = names.length; i < l; ++i) {
				if (s == names[i]) {
					return args[i + 1];
				}
			}
			return s;
		});
	}
	else {
		return str.replace(rxIds, function(s) {
			var ch = s.charAt(0);
			if (ch == "$") {
				var l = s.length;
				if (l >= 2 && s[1] == "$") {
					return expandAbbreviated(s, 2, k);
				} else if (l == 1 || !(s in global)) {
					return expandAbbreviated(s, 1, v);
				}
			}
			else if (ch == "@") {
				return expandAbbreviated(s, 1, a);
			}
			else if (ch == "#") {
				return args[parseInt(s.substr(1)) + 1];
			}

			return s;
		});
	}
}

function lambdaJoin(splited, v, k) {
    for (var i = 1, c = splited.length; i < c; i += 2) {
        var s = splited[i];
        if (typeof s == 'number') {
            splited[i] = arguments[s + 1];
        }
    }
    
    return splited.join('');
}

function lambdaParse(str, argCount) {
	if (!str) return null;
	if (typeof(str) == "function") return str;

	var names;
	
	var m = /^\s*(\w+)\s*=>(.+)$/.exec(str);
	if (m) {
		names = [m[1]];
		str = m[2];
	}
	else if (m = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/.exec(str)) {
		names = m[1].split(/\s*,\s*/);
		str = m[2];
	}

	if (names) {
		names.push("return " + str + ";");
		return Function.apply(global, names);
	}
	else {
		names = [];
		for (var i = 0; i < argCount; ++i) {
			names.push("$" + i);
		}

		var params = [str].concat(names);
		str = lambdaReplace.apply(null, params);

		names.push("return " + str + ";");
		return Function.apply(global, names);
	}
}

function quote(s) {
	var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
	var meta = {    // table of character substitutions
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"' : '\\"',
		'\\': '\\\\'
	};

	return escapable.test(s) ? '"' + s.replace(escapable, function (a) {
		var c = meta[a];
		return c
			? c
			: '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
	}) + '"' : '"' + s + '"';
}

function extend(from, to) {
	var emptyCtor = function() {};
	emptyCtor.prototype = from.prototype;
	to.prototype = new emptyCtor();
}

function toURLEncoded(prefix, obj) {
	var prefixEqual = (prefix ? prefix + "=" : "");

	if (typeof(obj) == "boolean") {
		return prefixEqual + (obj ? "1" : "0");
	}
	else if (typeof(obj) == "string") {
		return prefixEqual + encodeURIComponent(obj);
	}
	else if (typeof(obj) == "number") {
		return prefixEqual + obj.toString();
	}
	else if (typeof(obj) == "object") {
		var array = [];
		$from(obj).each(function(v, k) {
			k = encodeURIComponent(k);

			var key;
			if (prefix) {
				key = prefix + "[" + k + "]";
			}
			else {
				key = k;
			}

			array.push(toURLEncoded(key, v));
		});

		return array.join("&");
	}

	return "";
}

function getTrimmingArgument(left, right, arg) {
    var leftTarget;
    var rightTarget;
    
    if (!left || left instanceof Array) {
        leftTarget = defaultTrimmingTarget;
        left = defaultTrimmingPredicateArray;
    } else if (left instanceof Iterable) {
        leftTarget = defaultTrimmingTarget;
        left = defaultTrimmingPredicateIterable;
    } else {
        left = lambdaReplace(left, '$', '$$', '@.a');
    }

    if (!right || right instanceof Array) {
        rightTarget = defaultTrimmingTarget;
        right = defaultTrimmingPredicateArray;
    } else if (right instanceof Iterable) {
        rightTarget = defaultTrimmingTarget;
        right = defaultTrimmingPredicateIterable;
    } else {
        right = lambdaReplace(right, '$', '$$', '@.a');
    }

    var leftArg = {t: leftTarget, a: arg};
    var rightArg = {t: rightTarget, a: arg};

    return {left: left, leftArg: leftArg, right: right, rightArg: rightArg};
}

function prepareVariables(hints, varName, value, ___) {
    var result = {};
    var decl = [];

    for (var i = 0, c = hints.length; i < c; ++i) {
        var argIndex = i * 2 + 1;
        
        var varName = arguments[argIndex];
        if (!varName) continue;

        var value = arguments[argIndex + 1];

        if (hints <= 1) {
            result[varName] = value;
        } else {
            decl.push('var ' + varName + '=' + value + ';');
            result[varName] = varName;
        }
    }

    result.decl = decl.join('');
    return result;
}

//
// Grouper
//

function Grouper(comparer, arg) {
	this.$o = $from(this.o = []);
	this.c = comparer;
	this.a = arg;
}

Grouper.prototype._getPrimitiveList = function(name, key) {
	var bucket = this[name];
	if (!bucket) this[name] = bucket = {};
	
	key = key.toString();
	
	var list = bucket[key];
	if (!list) {
		bucket[key] = list = [];
		this.o.push({k: key, l: list});
	}
	return list;
};

Grouper.prototype._getList = function(key) {
	var c = this.c;
	var pred;

	if (!c) {
		var type = typeof(key);
		switch (type) {
		case "string": return this._getPrimitiveList("s", key);
		case "number": return this._getPrimitiveList("n", key);
		case "boolean": return this._getPrimitiveList("b", key);
		}

		pred = "$k==@k";
	}
	else if (typeof(c) == "string") {
		pred = lambdaReplace(c, "$k", "@k", "@a");
	}
	else {
		pred = "@c($k,@k,@a)";
	}

	var obj = this.$o.first(pred, {k: key, c: c, a: this.a});
	if (obj) {
		return obj.l;
	}
	else {
		var result = [];
		this.o.push({k: key, l: result});
		return result;
	}
};

Grouper.prototype.add = function(key, value) {
	var list = this._getList(key);
	list.push(value);
};

Grouper.prototype.$each = function(proc, arg) {
	this.broken = !this.$o.selectPair("from($l)", "$k").each(proc, arg).broken;
	return this;
};

//
// Cache
//

function Cache() {
}

Cache.prototype.getBucket = function(name) {
	var cache = this.cache;
	if (!cache) {
		this.cache = cache = {};

		var self = this;
		setTimeout(function() { self.cache = null; }, 0);
	}

	var bucket = cache[name];
	if (!bucket) {
		cache[name] = bucket = {};
	}
	return bucket;
};

Cache.prototype.get = function(name, str) {
	return this.getBucket(name)[str];
};

Cache.prototype.set = function(name, str, it) {
	this.getBucket(name)[str] = it;
};

var cache = new Cache();

//
// Iterable
//

function Iterable(it) {
	this.each = it;
}

Iterable.prototype.broken = false;

Iterable.prototype.where = function(pred, arg0) {
	var pr;
	if (typeof(pred) == "string") {
		pr = cache.get("($_$$_a0)", pred);
		if (!pr) {
			pr = "(" + lambdaReplace(pred, "$", "$$", "@a0") + ")";
			cache.set("($_$$_a0)", pred, pr);
		}
	}
	else {
		pr = "@pr($,$$,@a0)";
	}

	var self = this;
	function it(proc, arg) {
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

		this.broken = self.each(pr + "?" + p + ":0", {p: proc, pr: pred, a0: arg0, a: arg}).broken;
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.aggregate = function(seed, proc, arg) {
    var procStr;
    if (typeof(proc) == "string") {
	    procStr = cache.get("(c_$_$$_a)", proc);
	    if (!procStr) {
		    procStr = "(" + lambdaReplace(proc, "@c", "$", "$$", "@a") + ")";
		    cache.set("(c_$_$$_a)", proc, procStr);
	    }
    }
    else {
	    procStr = "@p(@c,$,$$,@a)";
    }

    if (seed === null) {
	    var a = {p: proc, f: true, a: arg};
	    this.each("@f?(@f=false,@c=$,0):(@c=" + procStr + ",0)", a);
	    return a.c;
	} else {
	    var a = {c: seed, a: arg, p: proc};
	    this.each("(@c=" + procStr + "),0", a);
	    return a.c;
    }
};

Iterable.prototype.all = function(pred, arg) {
	var p;
	if (typeof(pred) == "string") {
		p = cache.get("($_$$_a)", pred);
		if (!p) {
			p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			cache.set("($_$$_a)", pred, p);
		}
	}
	else {
		p = "@p($,$$,@a)";
	}

	return !this.each("!" + p + "?false:0", {a: arg, p: pred}).broken;
};

Iterable.prototype.any = function(pred, arg) {
	var p;
	if (!pred) {
		p = "true";
	}
	else if (typeof(pred) == "string") {
		p = cache.get("($_$$_a)", pred);
		if (!p) {
			p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			cache.set("($_$$_a)", pred, p);
		}
	}
	else {
		p = "@p($,$$,@a)";
	}

	return this.each(p + "?false:0", {a: arg, p: pred}).broken;
};

Iterable.prototype.at = function(index) {
	return this.skip(index).first();
};

Iterable.prototype.atOrDefault = function(index, defValue) {
	var v = this.at(index);
	return (v === undefined ? defValue : v);
};

Iterable.prototype.average = function() {
	var a = {f: true};
	this.each("@f?(@f=false,@s=$,@c=1,0):(@s+=$,++@c)", a);

	return a.s / a.c;
};

Iterable.prototype.concat = function(second) {
	var self = this;
	function iterator(proc, arg) {
		this.broken = false;
		if (self.each(proc, arg).broken) {
			this.broken = true;
			return this;
		}
		if (second.each(proc, arg).broken) {
			this.broken = true;
			return this;
		}			
	}

	return new Iterable(iterator);
};

Iterable.prototype.contains = function(value, comparer, arg) {
	var c;
	if (!comparer) {
		c = "$==@v";
	}
	else if (typeof(comparer) == "string") {
		c = cache.get("(v_$_a)", comparer);
		if (!c) {
			c = "(" + lambdaReplace(comparer, "@v", "$", "@a") + ")";
			cache.set("(v_$_a)", comparer, c);
		}
	}
	else {
		c = "@c(@v,$,@a)";
	}

	var a = {v: value, a: arg, c: comparer, r: false};
	this.each(c + "?((@r=true),false):0", a);

	return a.r;
};

Iterable.prototype.count = function(pred, arg) {
	var p;
	if (!pred) {
		p = "true";
	}
	else if (typeof(pred) == "string") {
		p = cache.get("($_$$_a)", pred);
		if (!p) {
			p = "(" + lambdaReplace(pred, "$", "$$", "@a") + ")";
			cache.set("($_$$_a)", pred, p);
		}
	}
	else {
		p = "@p($,$$,@a)";
	}

	var a = {a: arg, p: pred, c: 0};
	this.each(p + "?++@c:0", a);
	return a.c;
};

Iterable.prototype.defaultIfEmpty = function(defValue) {
	var self = this;
	var it = function(proc, arg) {
		if (!self.each("false").broken) {
			if (typeof(proc) == "string") {
				proc = lambdaParse(proc, 3);
			}
			this.broken = (proc(defValue, 0, arg) === false);
		}
		else {
			this.broken = self.each(proc, arg).broken;
		}
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.distinct = function(comparer, arg) {
	var c = (comparer ? ",@c,@a" : "");

	var l = [];

	var self = this;
	function it(proc, arg0) {
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

		this.broken = self.each("!from(@l).contains($" + c + ")?(@l.push($)," + p + "):0", {c: comparer, l: l, p: proc, a0: arg0}).broken;
		return this;
	};

	return new Iterable(it);
};

Iterable.prototype.except = function(second, comparer, arg0) {
	var compStr;
	if (comparer) {
		compStr = ",@c,@a0";
	}
	else {
		compStr = "";
	}
	
	var self = this;
	function it(proc, arg) {
		if (typeof(proc) == "string") {
			this.broken = self.each("@s.contains($" + compStr + ")?0:(" + lambdaReplace(proc, "$", "$$", "@a") + ")", {c: comparer, a0: arg0, s: $from(second), a: arg}).broken;
		}
		else {
			this.broken = self.each("@s.contains($" + compStr + ")?0:@p($,$$,@a)", {c: comparer, a0: arg0, p: proc, s: $from(second), a: arg}).broken;
		}
		return this;
	}

	return new Iterable(it);
};

Iterable.prototype.first = function(pred, arg) {
	if (!pred) {
		var a = {};
		this.each("(@r=$),false", a);
		return a.r;
	}
	else if (typeof(pred) == "string") {
		var a = {a: arg};
		this.each("(" + lambdaReplace(pred, "$", "$$", "@a") + ")?(@r=$,false):0", a);
		return a.r;
	}
	else {
		var a = {a: arg, p: pred};
		this.each("@p($,$$,@a)?(@r=$,false):0", a);
		return a.r;
	}	
};

Iterable.prototype.firstOrDefault = function(pred, defValue, arg) {
	if (arguments.length <= 1) {
		var v = this.first();
		return (v === undefined ? pred : v);
	}
	else {
		var v = this.first(pred, arg);
		return (v === undefined ? defValue : v);
	}
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
	var $groups = $from(groups);

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
	inner = $from(inner);
	
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
		var hint = lambdaGetHint(resultSelector, 3, splited);
		
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

	return this.where("@t.contains($," + compStr + ",@a)", {t: $from(second), a: arg, c: comparer});
};

Iterable.prototype.join = function(inner, outerKeySelector, innerKeySelector, resultSelector, comparer, arg) {
	inner = $from(inner);
	
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
			var hint = lambdaGetHint(proc, 3, splited);
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
	var Iterable = new OrderedIterable(this);
	Iterable._addContext(keySelector || "$", comparer, false, arg);
	return Iterable;
};

Iterable.prototype.orderByDesc = function(keySelector, comparer, arg) {
	var Iterable = new OrderedIterable(this);
	Iterable._addContext(keySelector || "$", comparer, true, arg);
	return Iterable;
};

Iterable.prototype.reverse = function() {
	var self = this;
	function _it(proc, _a) {
		var _l = [];
		self.each("@push($$),@push($),0", _l);

		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetHint(proc, 3, splited);
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
			var hint = lambdaGetHint(proc, 3, splited);

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
			var hint = lambdaGetHint(proc, 3, splited);
			
			switch (hint[1]) {
			case 0:
			case 1: procStr = lambdaJoin(splited, "$", "(@i++)", "@a0"); break;
			default: procStr = "(@j=@i++),(" + lambdaJoin(splited, "$", "@j", "@a0") + ")";
			}
		}
		else {
			procStr = "@p($,@i++,@a0)";
		}
		
		this.broken = self.each("from(" + s + ").each(" + quote(procStr) + ",@)", {s: selector, a: arg, a0: arg0, i: 0, p: proc});
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
			var hint = lambdaGetHint(proc, 3, splited);
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
    if (count <= 0) return this;

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
        return $from();
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
	var $track = $from(track);

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

			return $from(obj).toJSON(track);
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
			var hint = lambdaGetHint(proc, 3, splited);
			
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
		if ($from(second).each(lambda, a).broken)  {
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
		var hint = lambdaGetHint(resultSelector, 5, splited);
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
			var hint = lambdaGetHint(proc, 3, splited);
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

		this.broken = $from(second).each("@i>=" + (data.length / 2) + "?false:@r=" + procStr + ",++@i,@r", {a: arg, a0: arg0, k: 0, i: 0, d: data, p: proc, rs: resultSelector}).broken;
		return this;
	}

	return new Iterable(iterator);
};

//
// RandomAccessIterable
//

function RandomAccessIterable(data) {
	this.data = data;
    this.region = {
        queries: null,
        measured: false,
        start: null,
        end: null
    };
}
extend(Iterable, RandomAccessIterable);

RandomAccessIterable.prototype.addRegionQuery = function (type, proc, arg) {
    var r = this.region;
    var q = r.queries;

    if (!q) {
        r.queries = q = [];
    }

    q.push(type);
    q.push(proc);
    q.push(arg);

    r.measured = false;
};

RandomAccessIterable.prototype.reverseFrom = function (iterable) {
    var data = this.data;
    var r = this.region;
    var rr = iterable.region;

    var q = rr.queries;

    if (q) {
        var ql = q.length;
        var newQueries = new Array(ql);

        for (var i = 0; i < ql; ++i) {
            if (i % 3 == 0) {
                var v = q[i];
                if (v == 'skipLeft') {
                    newQueries[i] = 'skipRight';
                } else if (v == 'skipRight') {
                    newQueries[i] = 'skipLeft';
                } else if (v == 'takeLeft') {
                    newQueries[i] = 'takeRight';
                } else if (v == 'takeRight') {
                    newQueries[i] = 'takeLeft';
                }
            } else {
                newQueries[i] = q[i];
            }
        }

        r.queries = newQueries;
    }

    if (rr.start !== null) {
        r.start = data.length - rr.end;
    }
    if (rr.end !== null) {
        r.end = data.length - rr.start;
    }
    
    return this;
};

RandomAccessIterable.prototype.measureRegion = function () {
    var region = this.region;

    if (!region.measured) {
        var data = this.data;
        var start = region.start;
        var end = region.end;

        if (start == null) start = 0;
        if (end === null) end = data.length;

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
                        codes.push('s=Math.min(e,s+' + proc + ');'); 
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetHint(proc, 3, splited);

                        var vars = prepareVariables(hints,
                            'v', this.lambda.At('d', 's', 'dl'),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(var k=0;s<e;++s,++k){' +
                            vars.decl +
                            'if(!(' + lambdaJoin(splited, vars.v, 'k', vars.a) + ')){break;}}');
                    } else {
                        codes.push('for(var k=0;s<e&&q[' + (i + 1) + '](' + this.lambdaAt('d', 's', 'dl') + ',k,q[' + (i + 2) + ']);++s,++k);');
                    }
                } else if (type == 'skipRight') {
                    if (typeof proc == 'number') {
                        codes.push('e=Math.max(s,e-' + proc + ');'); 
                    } else if (typeof proc == 'string') {
                        var splited = [];
                        var hints = lambdaGetHint(proc, 3, splited);

                        var vars = prepareVariables(hints,
                            'v', this.lambda.At('d', 'i', 'dl'),
                            null, null,
                            'a', 'q[' + (i + 2) + ']');

                        codes.push('for(var k=0;s<e;--e,++k){' +
                            'var i=e-1;' + vars.decl +
                            'if(!(' + lambdaJoin(splited, vars.v, 'k', vars.a) + ')){break;}}');
                    } else {
                        codes.push('for(var k=0;s<e&&(q[' + (i + 1) + '](' + this.lambdaAt('d', 'e-1', 'dl') + ',k,q[' + (i + 2) + ']);--e,++k);');
                    }
                }
            }

            codes.push('r.start=s;r.end=e;');

            var f = new Function('d', 'dl', 'r', 'q', 's', 'e', codes.join(''));
            f(data, data.length, region, queries, start, end);

            region.queries = null;
        }

        region.measured = true;
    }

    return region;
};

RandomAccessIterable.prototype.each = function(proc, _a) {
	var s = this.data;
	
	if (typeof(proc) == "function") {
		this.broken = false;
		for (var i = 0, c = this.count(); i < c; ++i) {
			if (proc(this.at(i), i, _a) === false) {
				this.broken = true;
				break;
			}
		}
	} else {
	    var dt = this._dataType;
		var f = cache.get("each_" + dt, proc);

		if (!f) {
		    var splited = [];
			var hint = lambdaGetHint(proc, 3, splited);
			var defV, v;
			
			switch (hint[0]) {
			case 0: case 1: defV = ""; v = this.lambdaAt('s', '_s', '_l'); break;
			default: defV = "var _v=" + this.lambdaAt('s', '_s', '_l') + ";"; v = "_v"; break;
			}

			f = new Function(alias, "s", "_l", "_s", "_e", "a",
                "for(var _i=0;_s<_e;++_s,++_i){" + defV + "if((" + lambdaJoin(splited, v, "_i", "a") + ")===false){return true;}}return false;");
			cache.set("each_" + dt, proc, f);
		}

        var region = this.measureRegion();
		this.broken = f($from, s, s.length, region.start, region.end, _a);
	}

	return this;
};

RandomAccessIterable.prototype.count = function(pred, arg) {
	if (!pred) {
        var r = this.measureRegion();
		return r.end - r.start;
	}
	else {
		return Iterable.prototype.count.call(this, pred, arg);
	}
};

RandomAccessIterable.prototype.any = function (pred, arg) {
    if (!pred) {
        return this.count() > 0;
    } else {
		return Iterable.prototype.any.call(this, pred, arg);
    }
};

RandomAccessIterable.prototype.first = function(pred, arg) {
	if (!pred) {
		if (this.count() > 0) {
			return this.at(0);
		}
	}
	else {
		return Iterable.prototype.first.call(this, pred, arg);
	}
};

RandomAccessIterable.prototype.last = function(pred, arg) {
	if (!pred) {
		var l = this.count();
		if (l > 0) {
			return this.at(l - 1);
		}
	}
	else {
		return this.reverse().first(pred, arg);
	}
};

RandomAccessIterable.prototype.skip = function (count) {
    this.addRegionQuery('skipLeft', count, null);
    return this;
};

RandomAccessIterable.prototype.skipWhile = function (pred, arg) {
    this.addRegionQuery('skipLeft', pred, arg);
    return this;
};

RandomAccessIterable.prototype.toArray = function () {
    var l = this.count();

    var result = new Array(l);
    for (var i = 0; i < l; ++i) {
        result[i] = this.at(i);
    }

    return result;
};

RandomAccessIterable.prototype.trim = function(left, right, arg) {
    var args = getTrimmingArgument(left, right, arg);

    this.addRegionQuery('skipLeft', args.left, args.leftArg);
    this.addRegionQuery('skipRight', args.right, args.rightArg);
    return this;
};

RandomAccessIterable.prototype.zip = function(second, resultSelector, arg) {
    var rs;
    if (typeof(resultSelector) == "string") {
        var splited = [];
	    var hint = lambdaGetHint(resultSelector, 5, splited);
	    var v, list = [];

	    switch (hint[0]) {
	    case 0: case 1: v = this.lambdaAt('@d', '@i', '@l'); break;
	    default: list.push("(@V=" + this.lambdaAt('@d', '@i', '@l') + ")"); v = "@V"; break;
	    }

	    list.push("(" + lambdaJoin(splited, v, "$", "@i", "$$", "@a") + ")");

	    rs = "(" + list.join(",") + ")";
    }
    else {
	    rs = "@rs(" + this.lambdaAt('@d', '@i', '@l') + ",$,@i,$$,@a)";
    }

	var self = this;
	function iterator(proc, arg0) {
		var s = self.data;
		var l = s.length;

		var procStr;
		if (typeof(proc) == "string") {
		    var splited = [];
			var hint = lambdaGetHint(proc, 3, splited);
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

		this.broken = $from(second).each("@i>=@l?false:@r=" + procStr + ",++@i,@r", {a: arg, a0: arg0, k: 0, i: 0, d: s, l: l, p: proc, rs: resultSelector}).broken;
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

StringIterable.prototype._dataType = 'string';

StringIterable.prototype.lambdaAt = function (target, index) {
    return target + '.charAt(' + index + ')';
};

StringIterable.prototype.at = function(index) {
    var r = this.measureRegion();
	return this.data.charAt(r.start + index);
};

StringIterable.prototype.reverse = function() {
	return new StringReversedIterable(this.data).reverseFrom(this);
};

StringIterable.prototype.toString = function (separator) {
    if (!separator) {
        var data = this.data;
        
        var r = this.measureRegion();
        if (r.start == 0 && r.end == data.length) {
            return data;
        }
    }

    return Iterable.prototype.toString.call(this, separator);
};

StringIterable.prototype.toJSON = function() {
	return quote(this.data);
};

//
// StringReversedIterable
//

function StringReversedIterable(str) {
    RandomAccessIterable.call(this, str);
}
extend(RandomAccessIterable, StringReversedIterable);

StringReversedIterable.prototype._dataType = 'string_reversed';

StringReversedIterable.prototype.lambdaAt = function (target, index, length) {
    return target + '.charAt(' + length + '-' + index + '-1)';
};

StringReversedIterable.prototype.at = function(index) {
    var r = this.measureRegion();
	return this.data.charAt(r.end - index - 1);
};

StringReversedIterable.prototype.reverse = function() {
	return new StringIterable(this.data).reverseFrom(this);
};

StringReversedIterable.prototype.toJSON = function() {
	return quote(this.toString());
};

//
// ArrayIterable
//

function ArrayIterable(array) {
    RandomAccessIterable.call(this, array);
}
extend(RandomAccessIterable, ArrayIterable);

ArrayIterable.prototype._dataType = 'array';

ArrayIterable.prototype.lambdaAt = function (target, index) {
    return target + '[' + index + ']';
};

ArrayIterable.prototype.at = function(index) {
    var r = this.measureRegion();
	return this.data[r.start + index];
};

ArrayIterable.prototype.reverse = function() {
	return new ArrayReversedIterable(this.data).reverseFrom(this);
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

//
// ArrayReversedIterable
//

function ArrayReversedIterable(array) {
    RandomAccessIterable.call(this, array);
}
extend(RandomAccessIterable, ArrayReversedIterable);

ArrayReversedIterable.prototype._dataType = 'array_reversed';

ArrayReversedIterable.prototype.lambdaAt = function (target, index, length) {
    return target + '[' + length + '-' + index + '-1]';
};

ArrayReversedIterable.prototype.at = function(index) {
    var r = this.measureRegion();
	return this.data[r.end - index - 1];
};

ArrayReversedIterable.prototype.at = function(index) {
	var d = this.data;
	return d[d.length - index - 1];
};

ArrayReversedIterable.prototype.reverse = function() {
	return new ArrayIterable(this.data).reverseFrom(this);
}

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
			var hint = lambdaGetHint(proc, 3, splited);
			var defV, v;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "d[k]"; break;
			default: defV = "var v=d[k];"; v = "v"; break;
			}

			f = new Function(alias, "d", "a", "for(var k in d){" + defV + "if((" + lambdaJoin(splited, v, "k", "a") + ")===false){return true;}}return false;");
			cache.set("each_o", proc, f);
		}

		this.broken = f($from, _d, _a);
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
			var hint = lambdaGetHint(proc, 3, splited);
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

		this.broken = f($from, row, _a);
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

function OrderedIterable(Iterable) {
	this.Iterable = Iterable;
	this.context = [];
}
extend(ObjectIterable, OrderedIterable);

OrderedIterable.prototype._addContext = function(keySelector, comparer, desc, arg) {
	this.context.push({
		keySelector: lambdaParse(keySelector, 3),
		comparer: lambdaParse(comparer, 3),
		desc: desc,
		arg: arg
	});
}

OrderedIterable.prototype.each = function(proc, arg) {
	var row = [];
	this.Iterable.each("@push($$),@push($),0", row);

	var indices = $from.range(row.length / 2).toArray();

	var contexts = this.context;

	function f(a, b) {
		for (var i = 0, l = contexts.length; i < l; ++i) {
			var ctx = contexts[i];

			var aSelected = ctx.keySelector(row[a * 2 + 1], row[a * 2], ctx.arg);
			var bSelected = ctx.keySelector(row[b * 2 + 1], row[b * 2], ctx.arg);

			var compared;
			if (!ctx.comparer) {
				compared = (aSelected == bSelected ? 0 : (aSelected < bSelected ? -1 : 1));
			}
			else {
				compared = ctx.comparer(aSelected, bSelected, ctx.arg);
			}

			if (compared != 0) return (ctx.desc ? -1 : 1) * compared;
		}

		return 0;
	}

	indices.sort(f);

	if (typeof(proc) == "string") {
		var f = cache.get("each_ord", proc);
		if (!f) {
		    var splited = [];
			var hint = lambdaGetHint(proc, 3, splited);
			var defV, defK, v, k;

			switch (hint[0]) {
			case 0: case 1: defV = ""; v = "r[n+1]"; break;
			default: defV = "var v=r[n+1];"; v = "v"; break;
			}

			switch (hint[1]) {
			case 0: case 1: defK = ""; k = "r[n]"; break;
			default: defK = "var k=r[n];"; k = "k"; break;
			}

			f = new Function(alias, "l", "r", "a",
			    "for(var i=0,c=l.length;i<c;++i){var n=l[i]*2;" + defV + defK + "if((" + lambdaJoin(splited, v, k, "a") + ")===false)return true;}return false;");
			cache.set("each_ord", proc, f);
		}
		this.broken = f($from, indices, row, arg);
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

	return this;
};

OrderedIterable.prototype.thenBy = function(keySelector, comparer, arg) {
	this._addContext(keySelector, comparer, false, arg);
	return this;
};

OrderedIterable.prototype.thenByDesc = function(keySelector, comparer, arg) {
	this._addContext(keySelector, comparer, true, arg);
	return this;
};

function $from(obj) {
    if (!obj) {
	    return new Iterable(function() { return this; });
    } else if (obj instanceof Iterable) {
		return obj;
	} else if (obj.$each) {
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

$from.range = function(start, end, step) {
	switch (arguments.length) {
	case 1:
		end = start;
		start = 0;
		step = 1;
		break;
		
	case 2:
		step = (end > start ? 1 : -1);
		break;
	}

	function iterator(proc, arg) {
		if (typeof(proc) == "string") {
			var cacheName = (step > 0 ? "each_ru" : "each_rd");
			var f = cache.get(cacheName, proc);
			if (!f) {
				f = new Function("s", "e", "st", "a", "for(var i=s;i" + (step > 0 ? "<" : ">") + "e;i+=st){if((" + lambdaReplace(proc, "i", "i", "a") + ")===false)return true;}return false;");
				cache.set(cacheName, proc, f);
			}

			this.broken = f(start, end, step, arg);
		}
		else {
			this.broken = false;
			if (step > 0) {
				for (var i = start; i < end; i += step) {
					if (proc(i, i, arg) === false) {
						this.broken = true;
						break;
					}
				}
			}
			else {
				for (var i = start; i > end; i += step) {
					if (proc(i, i, arg) === false) {
						this.broken = true;
						break;
					}
				}
			}
		}

		return this;
	};
	
	return new Iterable(iterator);
};

$from.repeat = function(elem, count) {
	function iterator(proc, arg) {
		if (typeof(proc) == "string") {
			var f = cache.get("each_rpt", proc);
			if (!f) {
				f = new Function("c", "e", "a", "for(var i=0;i<c;++i){if((" + lambdaReplace(proc, "e", "i", "a") + ")===false)return true;}return false;");
				cache.set("each_rpt", proc, f);
			}

			this.broken = f(count, elem, arg);
		}
		else {
			this.broken = false;
			for (var i = 0; i < count; ++i) {
				if (proc(elem, i, arg) === false) {
					this.broken = true;
					break;
				}
			}
		}
		return this;
	};
	
	return new Iterable(iterator);
};

$from.setAlias = function (newAlias) {
    alias = newAlias;
};

$from.lambda = {
	replace: lambdaReplace,
	parse: lambdaParse,
	getHint: lambdaGetHint,
	join: lambdaJoin
};

module.exports = $from;

// End of code



})();
