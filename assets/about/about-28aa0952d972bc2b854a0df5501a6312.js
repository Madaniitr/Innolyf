$(function() {
    var e = document.querySelector(".employees"),
        t = createTeam(e, stripeTeam.length, {
            inter: "<div class='bookend'></div>"
        }),
        n = t.elements,
        r = window.location.hash,
        i = null;
    if (r && r.length > 0) {
        r = r.replace("#", "");
        for (var s = 0; s < n.length; s++)(function(e, n) {
            n[0] == r && (t.scrollToEmployee(e, !1), i = [e, n[1]])
        })(n[s], stripeTeam[s])
    }
    var o = function(e, t) {
            var n = document.createElement("div");
            return n.className = "popover", n.innerHTML = "<h1>" + e + "</h1><p>" + t + "</p><div class='arrow'></div>", document.body.appendChild(n), {
                show: function(e, t) {
                    var r = n.getBoundingClientRect(),
                        i = r.height / .4,
                        s = e[0],
                        o = Math.round(e[1] - i - 9 - 10 - t[1] / 2),
                        u = null;
                    o < document.body.scrollTop + 10 && (s = e[0] - 125 - t[0] / 2, o = e[1] - i / 2, u = "left"), s < 125 ? (s = e[0] + 125 + t[0] / 2, o = e[1] - i / 2, u = "right") : s > window.innerWidth - 125 && (s = e[0] - 125 - t[0] / 2, o = e[1] - i / 2, u = "left"), n.style.left = s + "px", n.style.top = o + "px", $(n).addClass("visible"), u && $(n).addClass(u)
                },
                hide: function() {
                    $(n).removeClass("visible"), setTimeout(function() {
                        document.body.removeChild(n)
                    }, 1e3)
                }
            }
        },
        u = [],
        a = function(e, t) {
            u.push({
                employee: e,
                nick: t,
                priority: e.distanceFromCenter()
            })
        },
        f = window.devicePixelRatio,
        l = function(e, t, n) {
            var r = new Image,
                i = "";
            e.size * f > 100 && (i = "@2x");
            var s = "/img/about/team/" + t + i + ".jpeg";
            r.src = s, r.addEventListener("load", function() {
                e.el.style.backgroundImage = "url(" + s + ")", e.loaded(), n(!0)
            }), r.addEventListener("error", function() {
                n(!1)
            })
        },
        c = function() {
            u.sort(function(e, t) {
                return e.priority < t.priority ? 1 : -1
            });
            var e = function() {
                if (u.length == 0) return;
                var t = u.pop();
                l(t.employee, t.nick, function(t) {
                    e()
                })
            };
            e(), e()
        },
        h = function(e, n) {
            if (e.popover) return;
            e.popover = o(n.name, n.description);
            var r = e.el.getBoundingClientRect(),
                i = t.autoScroll.get(),
                s = 0;
            while (Math.abs(i) > .01) s -= i, i = -i * .1 + i;
            s -= t.scroll().to - t.scroll().current, e.popover.show([Math.round(r.left + r.width / 2 + s), Math.round(r.top + r.height / 2 + document.body.scrollTop)], [r.width, r.height])
        },
        p = function(e) {
            e.popover && e.popover.hide(), e.popover = null
        };
    for (var s = 0; s < n.length; s++)(function(e, t) {
        var n = t[0],
            r = t[1];
        a(e, n);
        var i = null;
        r.url ? i = r.url : r.twitter ? i = "https://twitter.com/" + r.twitter : r.github && (i = "https://github.com/" + r.github), i && (e.el.setAttribute("href", i), e.el.setAttribute("target", "_blank")), e.onMouseOver = h.bind(this, e, r), e.onMouseOut = p.bind(this, e)
    })(n[s], stripeTeam[s]);
    var d = function() {
        for (var e = 0; e < n.length; e++) dynamics.animate(n[e].el, {
            opacity: 1
        }, {
            duration: 250
        })
    };
    t.onClearSearch(function() {
        d()
    }), t.onSearch(function(e) {
        if (e == "") return d(), [];
        e = e.replace(/ /g, " ?");
        var t = [],
            r = new RegExp(e, "i");
        for (var i = 0; i < n.length; i++)(function(e, n) {
            var i = n[1],
                s = [n[0], i.twitter, i.github, i.name],
                o = !1;
            for (var u = 0; u < s.length; u++)
                if (s[u] && s[u].match(r)) {
                    o = !0;
                    break
                }
            var a = .2;
            o && (a = 1, t.push(e)), dynamics.animate(e.el, {
                opacity: a
            }, {
                duration: 250
            })
        })(n[i], stripeTeam[i]);
        return t
    }), window.addEventListener("load", function() {
        setTimeout(function() {
            c(), i && (t.autoScroll.setEnabled(!1), setTimeout(function() {
                h.apply(this, i), t.setHighlightedEmployee(i[0])
            }, 1e3))
        }, 10)
    });
    var v = function(e, t, n) {
            var r = document.querySelectorAll(t),
                e = e.split(" ");
            for (var i = 0; i < e.length; i++) document.body.addEventListener(e[i], function(e) {
                for (var t = 0; t < r.length; t++)
                    if (r[t].contains(e.target) || r[t] == e.target) e.stopPropagation(), n(e, r[t])
            })
        },
        m = function() {
            return {
                left: window.pageXOffset || document.documentElement.scrollLeft,
                top: window.pageYOffset || document.documentElement.scrollTop
            }
        },
        g = function(e, t, n, r) {
            var i = function(e, t, n, r) {
                    return Math.sqrt(Math.pow(n - e, 2) + Math.pow(r - t, 2))
                },
                s = e < n / 2 ? n : 0,
                o = t < r / 2 ? r : 0;
            return i(e, t, s, o)
        };
    v("ontouchstart" in window ? "touchstart" : "mousedown", "*[interaction-fill]", function(e, t) {
        var n = t.getBoundingClientRect(),
            r = e.pageX - n.left - m().left,
            i = e.pageY - n.top - m().top,
            s = t.querySelector(".interactionFill");
        s && s.parentNode.removeChild(s), s = document.createElement("div"), s.classList.add("interactionFill"), s.style.backgroundColor = t.getAttribute("interaction-fill");
        var o = g(r, i, n.width, n.height) * 2;
        s.style.width = o + "px", s.style.height = o + "px", s.style.left = r - o / 2 + "px", s.style.top = e.pageY - n.top - m().top - o / 2 + "px", t.insertBefore(s, t.firstChild), setTimeout(function() {
            s.classList.add("show")
        }, 10)
    }), v("ontouchstart" in window ? "touchend" : "mouseup mouseout", "*[interaction-fill]", function(e, t) {
        var n = t.querySelector(".interactionFill");
        n && (n.addEventListener("transitionend", function() {
            n && n.parentNode && n.parentNode.removeChild(n)
        }), n.classList.add("hide"))
    })
});