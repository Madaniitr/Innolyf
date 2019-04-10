var Bezier = function() {
    "use strict";
    var e = 400,
        t = function(e) {
            return 1 / (200 * e)
        },
        n = function(n, r, i, s) {
            var o = 3 * n,
                u = 3 * (i - n) - o,
                a = 1 - o - u,
                f = 3 * r,
                l = 3 * (s - r) - f,
                c = 1 - f - l,
                h = function(e) {
                    return ((a * e + u) * e + o) * e
                },
                p = function(e) {
                    return ((c * e + l) * e + f) * e
                },
                d = function(e) {
                    return (3 * a * e + 2 * u) * e + o
                },
                v = function(e, t) {
                    var n, r, i, s, o, u;
                    for (i = e, u = 0; u < 8; u++) {
                        s = h(i) - e;
                        if (Math.abs(s) < t) return i;
                        o = d(i);
                        if (Math.abs(o) < 1e-6) break;
                        i -= s / o
                    }
                    n = 0, r = 1, i = e;
                    if (i < n) return n;
                    if (i > r) return r;
                    while (n < r) {
                        s = h(i);
                        if (Math.abs(s - e) < t) return i;
                        e > s ? n = i : r = i, i = (r - n) * .5 + n
                    }
                    return i
                },
                m = function(e, t) {
                    return p(v(e, t))
                };
            return function(n, r) {
                return m(n, t(+r || e))
            }
        };
    return n
}();