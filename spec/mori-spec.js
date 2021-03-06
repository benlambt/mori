var mori = require("../withAsync"),
    extra = mori,
    async = mori.async;
describe("Map", function () {
    it("demonstrates mapping a function over a vector", function () {
        var inc = function (n) { return n + 1; },
            outArr = mori.intoArray(mori.map(inc, mori.vector(1,2,3,4,5)));
        expect(outArr).toEqual([2,3,4,5,6]);
    });

});

describe("Non-destructive update", function () {
    it("demonstrates a non-destructive collection update", function () {
        var v1 = mori.vector(1,2,3),
            v2 = mori.conj(v1, 4);
        expect(JSON.stringify(mori.intoArray(v1))).toEqual("[1,2,3]");
        expect(JSON.stringify(mori.intoArray(v2))).toEqual("[1,2,3,4]");
    });
});

describe("Reduce", function () {
    it("demonstrates functional reduction on a vector", function () {
        var sum = function(a, b) {
            return a + b;
        };
        var reduced = mori.reduce(sum, mori.vector(1, 2, 3, 4));
        expect(reduced).toEqual(10);
    });
});

describe("Lazy sequences", function () {
    it("demonstrates interposition on a lazy sequence", function () {
        var _ = mori;
        var interposed = _.intoArray(_.interpose("foo", _.vector(1, 2, 3, 4)));
        expect(interposed).toEqual([1, "foo", 2, "foo", 3, "foo", 4]);
    });
});

describe('memoize', function() {
    it("can memoize function return value", function() {
        var memoizedFn = mori.memoize(function(){return mori.rand()})
        expect(memoizedFn()).toBe(memoizedFn())
    })
})

describe('trampoline', function() {
    it("keep calling the function for as long as it returns a function", function() {
        
        expect(mori.trampoline(function fn(n){
            if(n >= 10000)
                return n
            else
                return function(){
                    return fn(n+1)
                }
        }, 0)).toBe(10000)
    })
})

describe("Mori Extra", function() {

    describe("Pipelines", function () {
        it("demonstrates function pipelining", function () {
            var pipeRes = extra.pipeline(
                mori.vector(1,2,3),
                function(v) { return mori.conj(v,4); },
                function(v) { return mori.drop(2, v); }
            );
            expect(mori.intoArray(pipeRes)).toEqual([3,4]);
        });
    });

    describe("Currying", function () {
        it("demonstrates function currying", function () {
            var curRes = extra.pipeline(
                mori.vector(1,2,3),
                extra.curry(mori.conj, 4),
                extra.curry(mori.conj, 5)
            );
            expect(mori.intoArray(curRes)).toEqual([1,2,3,4,5]);
        });
    });

    describe("Partial application", function () {
        it("demonstrates partial function application", function () {
            var parRes = extra.pipeline(
                mori.vector(1,2,3),
                extra.curry(mori.conj, 4),
                mori.partial(mori.drop, 2)
            );
            expect(mori.intoArray(parRes)).toEqual([3, 4]);
        });
    });


    describe("Function composition", function () {
        it("demonstrates function composition", function () {
            var second = mori.comp(mori.first, mori.rest);
            var secRes = second(mori.vector(1,2,3));
            expect(secRes).toEqual(2);
        });
    });

    describe("Juxtaposition", function () {
        it("demonstrates function juxtaposition", function () {
            var posAndNeg = mori.juxt(mori.identity, function (v) { return -v; });
            var pnRes = posAndNeg(1);
            expect(mori.intoArray(pnRes)).toEqual([1,-1]);
            var knitRes = extra.knit(mori.inc, mori.dec)(posAndNeg(1));
            expect(mori.intoArray(knitRes)).toEqual([2,-2]);
        });
    });

    describe("Conversion utilities", function () {
        it("demonstrates conversion from clojurescript values to javascript objects, and vice versa", function () {
            var jsObj  = { a: 1, b: "two" },
                jsArr  = [1, 2, 3],
                cljMap = mori.hashMap("a", 1, "b", "two"),
                cljMapKeywordized = mori.hashMap(mori.keyword("a"), 1, mori.keyword("b"), "two"),
                cljVec = mori.vector(1, 2, 3);
            expect(mori.equals(extra.toClj(jsObj), cljMap)).toBe(true);
            expect(mori.equals(extra.toClj(jsObj,true), cljMapKeywordized)).toBe(true);
            expect(mori.equals(extra.toClj(jsArr), cljVec)).toBe(true);
            expect(mori.toJs(cljMap)).toEqual(jsObj);
            expect(mori.toJs(cljVec)).toEqual(jsArr);
            expect(mori.isVector(extra.toClj(jsArr))).toBe(true);
        });
    });

    describe("Distinct", function() {
        it("demonstrates function `distinct`", function() {
            var vec = mori.vector(1,1,1,1,2,2,3,4,5,6,6);
            var distinctVector = mori.distinct(vec);
            expect(mori.toJs(distinctVector)).toEqual([1,2,3,4,5,6]);
        });
    });

    describe("configure", function() {
        it("can tune *print-length*", function() {
            extra.configure("print-length", 5);
            expect(mori.range(10).toString()).toEqual("(0 1 2 3 4 ...)");
            extra.configure("print-length", 3);
            expect(mori.range(5).toString()).toEqual("(0 1 2 ...)");
            extra.configure("print-length", null);
            expect(mori.range(5).toString()).toEqual("(0 1 2 3 4)");
        });
        it("can tune *print-level*", function() {
            extra.configure("print-level", 3);
            var m = mori;
            expect(m.vector(1, m.vector(2, m.vector(3, m.vector(4, m.vector(5))))).toString()).toEqual("[1 [2 [3 #]]]");
            extra.configure("print-level", 1);
            expect(m.hashMap(1, m.hashMap(2, 3)).toString()).toEqual("{1 #}");
            extra.configure("print-level", null);
            expect(m.vector(1, m.vector(2, m.vector(3, m.vector(4)))).toString()).toEqual("[1 [2 [3 [4]]]]");
        });
    });

    describe("Queue", function() {
        it("can be initialized empty", function() {
            var q = extra.queue();
            expect(mori.isEmpty(q)).toBeTruthy();
        });

        it("can be initialized with values", function() {
            var q = extra.queue('a', 'b');
            expect(mori.isEmpty(q)).toBeFalsy();
            expect(mori.peek(q)).toEqual('a');
        });
    });

    describe("lazy-seq", function() {
        it("can be used build non-stack-blowing seq functions", function() {
            var m = mori;
            var fib = function(a, b) {
                return m.cons(a, extra.lazySeq(function() {
                    return fib(b, b + a);
                }));
            };

            var fibs = m.take(10, fib(1, 1));

            expect(m.toJs(fibs)).toEqual([1, 1, 2, 3, 5, 8, 13, 21, 34, 55]);

            // Numbers can only be so big
            var bigFib = m.last(m.take(2000, fib(1, 1)));
            expect(bigFib).toEqual(Infinity);
        });
    });
})

describe('Idiomatic JS method names', function() {
    var m = mori;
    describe('Map', function() {
        var map = m.hashMap(1,2,3,4)
        it('expose methods',function() {
            expect(map.get(1)).toBe(2);
            expect(map.conj(m.hashMap(5, 6)).toString()).toBe('{1 2, 3 4, 5 6}')
            expect(map.empty().toString()).toBe('{}')
            expect(map.equiv(m.hashMap(1,2,3,4))).toBe(true)
            expect(map.count()).toBe(2)
            expect(map.assoc(5, 6).toString()).toBe('{1 2, 3 4, 5 6}')
            expect(map.dissoc(1).toString()).toBe('{3 4}')
            expect(map.reduce(function(acc,x){return acc+x},'heheda')).toBe('heheda[1 2][3 4]')
            expect(map.kvReduce(function(acc, k, v){return acc+k+v},0)).toBe(10)
            map.asTransient()
            expect(map.has(1)).toBe(true)
            var sum=0;
            map.forEach(function(x){sum+=x})
            expect(sum).toBe(6)
        })
    })

    describe('Vector', function() {
        var vec = m.vector(1,2,3,4)
        it('expose methods',function() {
            expect(vec.get(1)).toBe(2);
            expect(vec.conj(5,6).toString()).toBe('[1 2 3 4 5 6]')
            expect(vec.empty().toString()).toBe('[]')
            expect(vec.equiv(m.vector(1,2,3,4))).toBe(true)
            expect(vec.count()).toBe(4)
            expect(vec.assoc(3, 6).toString()).toBe('[1 2 3 6]')
            expect(vec.reduce(function(acc,x){return acc+x},0)).toBe(10)
            expect(vec.kvReduce(function(acc, k, v){return acc+k+v},0)).toBe(16)
            vec.asTransient()
        })
    })

    describe('Set', function() {
        var set = m.set([1, 2, 3, 4, 3])
        it('expose methods',function() {
            expect(set.get(1)).toBe(1);
            expect(set.conj(5, 6).toString()).toBe('#{1 2 3 4 5 6}')
            expect(set.empty().toString()).toBe('#{}')
            expect(set.equiv(m.set([1, 2, 3, 4]))).toBe(true)
            expect(set.count()).toBe(4)
            expect(set.disjoin(1).toString()).toBe('#{2 3 4}')
            expect(set.has(1)).toBe(true)
        })
    })

})
