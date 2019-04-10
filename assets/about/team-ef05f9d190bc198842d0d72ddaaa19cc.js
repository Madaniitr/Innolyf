var createTeam = function(e, t, n) {
    n = n || {}, e.innerHTML = '<div class="team" style="display:none;">     <div class="people current"></div>     <div class="people next"></div>     <div class="inter">' + (n.inter || "") + '</div>   </div>   <div class="search" style="display:none;">     <input type="text" placeholder="Search">   </div>';
    var r = e,
        i = e.querySelector(".team-scroll"),
        s = e.querySelector(".search"),
        o = e.querySelector(".search input"),
        u = e.querySelector(".team"),
        a = e.querySelector(".team .people.current"),
        f = e.querySelector(".team .people.next"),
        l = e.querySelector(".team .inter"),
        c = function(e, t) {
            e.style.webkitTransform = t, e.style.mozTransform = t, e.style.msTransform = t, e.style.transform = t
        },
        h = 110,
        p = [],
        d = 1;
    if (r.clientWidth < 450 || r.clientHeight < 450) d = Math.min(r.clientWidth, r.clientHeight) / 450;
    var v = 450 * d,
        m = {
            enabled: !1,
            v: 0
        };
    r.style.height = v + "px";
    var g = 20 * d,
        y = function() {
            this.scale = 0, this.delay = 0, this.active = !0, this.loaded = !1
        };
    y.ease = Bezier(.11, 1.24, .61, 1), y.prototype.tick = function(e) {
        if (!this.active || !this.loaded || !e || e < this.delay) return;
        var t = (e - this.delay) / 1200;
        t >= 1 ? (this.scale = 1, this.active = !1) : this.scale = y.ease(t)
    }, y.prototype.setLoaded = function() {
        this.delay += dt, this.loaded = !0
    };
    var b = 1,
        w = function(e) {
            this.id = b++, this.size = e, this.translate = [0, 0], this.startTranslate = [0, 0], this.toTranslate = [0, 0], this.startT = 0, this.duration = 1
        };
    w.ease = Bezier(.6, 0, .4, 1), w.prototype.tick = function(e) {
        if (e - this.startT > this.duration) {
            var t = Math.random() * 2 * 3.14;
            this.startTranslate = [this.translate[0], this.translate[1]], this.startT = e, this.toTranslate = [Math.cos(t) * this.size / 20, Math.sin(t) * this.size / 20], this.duration = Math.random() * 5e3 + 3e3
        }
        var n = (e - this.startT) / this.duration,
            r = w.ease(n);
        this.translate[0] = r * (this.toTranslate[0] - this.startTranslate[0]) + this.startTranslate[0], this.translate[1] = r * (this.toTranslate[1] - this.startTranslate[1]) + this.startTranslate[1]
    };
    var E = function(e, t) {
            var n = document.createElement("div");
            n.className = "employee";
            var r = document.createElement("a");
            r.className = "circle", n.appendChild(r);
            var i = new y,
                s = {
                    pos: e,
                    size: t,
                    el: n,
                    scale: 1,
                    translate: [0, 0],
                    offset: 0,
                    random: Math.random(),
                    startupAnimation: i,
                    floatingAnimation: new w(t),
                    circleEl: r,
                    loaded: function() {
                        i.setLoaded()
                    }
                };
            return s.distanceFromCenter = function() {
                return Math.abs(ft(s))
            }, s
        },
        S = function(e, t) {
            var n = Math.pow(10, t);
            return Math.round(e * n) / n
        },
        x = function(e) {
            c(e.el, "translate3d(" + S(e.translate[0], 2) + "px," + S(e.translate[1], 2) + "px,0px)       scale(" + S(e.scale * e.startupAnimation.scale, 6) + ")")
        },
        T = function(e, t) {
            var n = k(e.pos, t.pos) < (e.size + t.size) / 2 + g;
            return isNaN(n) ? 0 : n
        },
        N = function(e) {
            for (var t = 0; t < p.length; t++) {
                var n = p[t];
                if (T(e, n)) return !0
            }
            return !1
        },
        C = function(e) {
            return e.pos[1] > e.size && e.pos[1] < v - e.size ? N({
                pos: e.pos,
                size: e.fakeSize || e.size
            }) ? !1 : !0 : !1
        },
        k = function(e, t) {
            return Math.sqrt(Math.pow(e[0] - t[0], 2) + Math.pow(e[1] - t[1], 2))
        },
        L = 0;
    for (var A = 0; A < t / 8; A++) {
        var O = Math.round(v / 2 + (Math.random() * 130 - 65) * d);
        p.push(E([L, O], Math.round((85 + Math.random() * 15) * d))), L += Math.round((150 + Math.random() * 100) * d)
    }
    for (var M = 0; M < 2; M++) {
        var _ = p.slice();
        for (var A = 0; A < _.length; A++) {
            if (p.length >= t) break;
            var D = _[A],
                P = 2 - M;
            for (var H = 0; H < P; H++) {
                var B = !1,
                    j = 0;
                while (!B && j < 5) {
                    var F = Math.round((55 + Math.random() * 15) * d),
                        I = D.size / 2 + (20 * d + Math.random() * 5 * d + F / 2),
                        q = Math.min(2, Math.max(-2, (D.pos[1] - v / 2) / (v / 2) * 1.5)),
                        R = 3.14 * (1 - Math.abs(q)) + 3.14,
                        U = (3.14 - R) / 2 * (q > 0 ? 1 : -1),
                        z = U + R * (q > 0 ? 1 : -1),
                        W = Math.random() * (z - U) + U,
                        L = Math.round(D.pos[0] + Math.cos(W) * I),
                        O = Math.round(D.pos[1] - Math.sin(W) * I),
                        X = {
                            pos: [L, O],
                            size: F
                        };
                    C(X) && (p.push(E([L, O], F)), B = !0), j++
                }
            }
        }
    }
    var M = 0;
    while (p.length < t) {
        var _ = p.slice();
        for (var A = 0; A < _.length; A++) {
            if (p.length >= t) break;
            var D = _[A];
            for (var W = 0; W < 6.28; W += .628) {
                if (p.length >= t) break;
                var F = Math.round((35 + Math.random() * 10) * d),
                    I = D.size / 2 + (20 * d + Math.random() * 5 * d + F / 2);
                I += 30 * d;
                var O = Math.round(D.pos[1] + Math.sin(W) * I),
                    V = Math.abs(O - v / 2) / 10,
                    $ = Math.random() * V + V,
                    J = F + $,
                    q = Math.min(2, Math.max(-2, (D.pos[1] - v / 2) / (v / 2) * 1.5)),
                    K = !1;
                q > -0.5 && q < .5 && (J += 20, F += 20, K = !0);
                var I = I - F / 2 + J / 2,
                    L = Math.round(D.pos[0] + Math.cos(W) * I),
                    O = Math.round(D.pos[1] + Math.sin(W) * I),
                    X = {
                        pos: [L, O],
                        size: F,
                        fakeSize: J
                    };
                if (C(X)) p.push(E([L, O], F));
                else if (K) {
                    J -= 20, F -= 20;
                    var X = {
                        pos: [L, O],
                        size: F,
                        fakeSize: J
                    };
                    C(X) && p.push(E([L, O], F))
                }
            }
        }
        M++;
        if (M > 4) break
    }
    var Q = 0,
        G = 1e3;
    for (var A = 0; A < p.length; A++) {
        var D = p[A],
            L = D.pos[0];
        L > Q && (Q = L), L < G && (G = L)
    }
    var Y = Q - G + 2 * h;
    a.style.left = "0px", a.setAttribute("data-left", 0), a.style.width = Y + "px", f.style.width = Y + "px";
    for (var A = 0; A < p.length; A++) {
        var D = p[A];
        D.pos[0] += h - G;
        var Z = D.el;
        Z.style.width = D.size + "px", Z.style.height = D.size + "px", Z.style.left = D.pos[0] - D.size / 2 + "px", Z.style.top = D.pos[1] - D.size / 2 + "px", a.appendChild(Z)
    }
    var et = Y / 2,
        tt = et,
        nt = et,
        rt = null,
        it = function() {
            return rt == null && (rt = r.clientWidth), rt
        };
    window.addEventListener("resize", function() {
        rt = null
    });
    var st = Bezier(0, .8, .4, 1),
        ot = function(e) {
            var t = Math.abs(ft(e));
            if (t > it() / 2) return 0;
            var n = Math.min(1, Math.max(0, 1 - t / (it() / 2)));
            return st(S(n, 5))
        },
        ut = function(e) {
            return ft(e) > 0 ? 1 : -1
        },
        at = function(e) {
            return parseInt(e.getAttribute("data-left")) - et
        },
        ft = function(e, t) {
            t || (t = e.el.parentNode);
            var n = at(t);
            return e.pos[0] + e.translate[0] + e.floatingAnimation.translate[0] + n - it() / 2
        },
        lt = function(e) {
            var t = [a, f],
                n = {
                    pos: null,
                    el: null
                };
            for (var r = 0; r < t.length; r++) {
                var i = t[r],
                    s = Math.abs(ft(e, i));
                if (n.pos == null || s < n.pos) n.pos = s, n.el = i
            }
            n.el != null && n.el != e.el.parentNode && n.el.appendChild(e.el)
        },
        ct = function() {
            var e = at(a) + Y / 2 - it() / 2,
                t = at(f) + Y / 2 - +it() / 2;
            if (Math.abs(e) > Math.abs(t)) {
                var n = a;
                a = f, a.className = "people current", f = n, f.className = "people next"
            }
            var r = parseInt(a.getAttribute("data-left")),
                e = at(a) + Y / 2 - it() / 2;
            if (e > 100) {
                a.appendChild(l);
                var i = r - Y
            } else if (e < -100) {
                f.appendChild(l);
                var i = r + Y
            }
            i != null && i != f.getAttribute("data-left") && (f.style.left = i + "px", f.setAttribute("data-left", i)), c(a, "translateX(" + -et + "px)"), c(f, "translateX(" + -et + "px)")
        };
    u.addEventListener("wheel", function(e) {
        if (e.deltaY == 0 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) tt += e.deltaX, pt.setToRight(tt > et), e.preventDefault()
    });
    var ht = [0, 0],
        pt = function() {
            var e = .2,
                t = .2,
                n = !0,
                r = !0,
                i = function() {
                    r ? n ? t = .2 : t = -0.2 : t = 0
                };
            return {
                get: function() {
                    return e
                },
                setToRight: function(e) {
                    n = e, i()
                },
                setEnabled: function(e) {
                    r = e, i()
                },
                tick: function() {
                    e = (t - e) * .1 + e
                }
            }
        }(),
        dt = 0,
        vt = function(e) {
            dt = e, pt.tick(), nt = et, et = (tt - et) * .1 + et, Math.abs(et - nt) > 2 && yt(null), tt += pt.get(), ct();
            for (var t = 0; t < p.length; t++) {
                var n = p[t];
                n.scale > 0 && (n.startupAnimation.tick(e), n.floatingAnimation.tick(e)), lt(n);
                var r = ft(n) / (it() / 2),
                    i = (100 * d - Math.min(100 * d, n.size)) / 2;
                n.scale = ot(n), n.translate[0] = -r * i + n.floatingAnimation.translate[0], n.translate[1] = 5 * Math.sin((r * 2 - 1) * 1.57 + 6.28 * n.random) * d + n.floatingAnimation.translate[1], n.scale != 1 && (n.translate[0] += -ut(n) * (1 - n.scale) * n.size / 2 * d);
                if (n.scale <= 0) n.el.style.display = "none";
                else {
                    if (m.v != 0) {
                        var s = ft(n) / (it() / 2);
                        s = Math.abs(s);
                        var o = Math.abs((n.pos[1] / v - .5) * 2),
                            u = (Math.cos(s * Math.PI) + 1) / 2 * 100 * (1 - o) * m.v;
                        n.pos[1] > v / 2 ? n.translate[1] += u : n.translate[1] -= u, n.scale *= 1 - Math.abs((Math.cos(s * Math.PI) + 1) / 2) / 4 * m.v
                    }
                    x(n), n.el.style.display = "block"
                }
            }
            requestAnimationFrame(vt)
        };
    vt(null),
        function() {
            var e = 0,
                t = p.sort(function(e, t) {
                    return e.distanceFromCenter() > t.distanceFromCenter() ? 1 : -1
                });
            for (var n = 0; n < t.length; n++) {
                var r = t[n];
                r.startupAnimation.delay = e, r.scale > 0 && (e += 15)
            }
        }(), u.style.display = "block";
    var mt = null,
        gt = function(e) {
            yt(xt(e))
        },
        yt = function(e) {
            if (mt == e) return;
            if (mt && mt.highlightEl) {
                mt.publicEmployee.onMouseOut();
                var t = mt.highlightEl;
                t.className = "highlight";
                var n = mt.el;
                setTimeout(function() {
                    n.removeChild(t)
                }, 1e3), mt.highlightEl = null
            }
            mt = e;
            if (!mt) return;
            mt.publicEmployee.onMouseOver();
            var t = mt.highlightEl;
            t || (t = document.createElement("div"), t.className = "highlight", mt.highlightEl = t, mt.el.appendChild(t)), t.offsetHeight, t.className = "highlight visible"
        },
        bt = [];
    for (var A = 0; A < p.length; A++) {
        var wt = {
            loaded: p[A].loaded,
            size: p[A].size,
            el: p[A].circleEl,
            onMouseOver: function() {},
            onMouseOut: function() {},
            distanceFromCenter: p[A].distanceFromCenter
        };
        p[A].publicEmployee = wt,
            function(e, t) {
                e.el.addEventListener("mouseenter", function(t) {
                    if (Math.abs(nt - et) > 2) return;
                    pt.setEnabled(!1), yt(e)
                }), e.el.addEventListener("mouseleave", function(e) {
                    pt.setEnabled(!0), yt(null)
                })
            }(p[A], wt), bt.push(wt)
    }
    var Et = null,
        St = null,
        xt = function(e) {
            for (var t = 0; t < p.length; t++)
                if (p[t].publicEmployee == e) return p[t];
            return null
        },
        Tt = function(e, t) {
            Nt(xt(e), t)
        },
        Nt = function(e, t) {
            var n = e.pos[0] - it() / 2;
            t === !1 && (et = n), tt = n
        };
    o.addEventListener("keyup", function() {
        if (m.enabled && Et) {
            var e = Et(o.value);
            e.length > 0 && Tt(e[0])
        }
    });
    var Ct = function() {
            m.enabled = !0, s.style.display = "block", o.focus(), dynamics.css(s, {
                opacity: 0
            }), dynamics.animate(l, {
                opacity: 0
            }, {
                duration: 250
            }), dynamics.animate(s, {
                opacity: 1
            }, {
                duration: 250
            }), dynamics.animate(m, {
                v: 1
            }, {
                type: dynamics.spring,
                friction: 340,
                duration: 600
            })
        },
        kt = function() {
            St && St(), m.enabled = !1, dynamics.animate(l, {
                opacity: 1
            }, {
                duration: 250
            }), dynamics.animate(s, {
                opacity: 0
            }, {
                duration: 150,
                complete: function() {
                    s.style.display = "none"
                }
            }), dynamics.animate(m, {
                v: 0
            }, {
                type: dynamics.spring,
                friction: 500,
                duration: 900
            })
        };
    return window.addEventListener("keydown", function(e) {
        if (m.enabled) e.which == 27 && kt();
        else {
            var t = String.fromCharCode(e.which);
            /\w/.test(t) && (Ct(), o.value = "")
        }
    }), {
        elements: bt,
        autoScroll: pt,
        scroll: function() {
            return {
                current: et,
                to: tt
            }
        },
        onSearch: function(e) {
            Et = e
        },
        onClearSearch: function(e) {
            St = e
        },
        scrollToEmployee: Tt,
        setHighlightedEmployee: gt
    }
};