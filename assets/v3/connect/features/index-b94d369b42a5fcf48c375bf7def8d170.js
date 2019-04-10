/*es6*/


"use strict";
/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript */

var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(){var e=/\blang(?:uage)?-(\w+)\b/i,t=0,n=_self.Prism={util:{encode:function(e){return e instanceof a?new a(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function(e){var t=n.util.type(e);switch(t){case"Object":var a={};for(var r in e)e.hasOwnProperty(r)&&(a[r]=n.util.clone(e[r]));return a;case"Array":return e.map&&e.map(function(e){return n.util.clone(e)})}return e}},languages:{extend:function(e,t){var a=n.util.clone(n.languages[e]);for(var r in t)a[r]=t[r];return a},insertBefore:function(e,t,a,r){r=r||n.languages;var i=r[e];if(2==arguments.length){a=arguments[1];for(var l in a)a.hasOwnProperty(l)&&(i[l]=a[l]);return i}var o={};for(var s in i)if(i.hasOwnProperty(s)){if(s==t)for(var l in a)a.hasOwnProperty(l)&&(o[l]=a[l]);o[s]=i[s]}return n.languages.DFS(n.languages,function(t,n){n===r[e]&&t!=e&&(this[t]=o)}),r[e]=o},DFS:function(e,t,a,r){r=r||{};for(var i in e)e.hasOwnProperty(i)&&(t.call(e,i,e[i],a||i),"Object"!==n.util.type(e[i])||r[n.util.objId(e[i])]?"Array"!==n.util.type(e[i])||r[n.util.objId(e[i])]||(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,i,r)):(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,null,r)))}},plugins:{},highlightAll:function(e,t){var a={callback:t,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};n.hooks.run("before-highlightall",a);for(var r,i=a.elements||document.querySelectorAll(a.selector),l=0;r=i[l++];)n.highlightElement(r,e===!0,a.callback)},highlightElement:function(t,a,r){for(var i,l,o=t;o&&!e.test(o.className);)o=o.parentNode;o&&(i=(o.className.match(e)||[,""])[1].toLowerCase(),l=n.languages[i]),t.className=t.className.replace(e,"").replace(/\s+/g," ")+" language-"+i,o=t.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+i);var s=t.textContent,u={element:t,language:i,grammar:l,code:s};if(n.hooks.run("before-sanity-check",u),!u.code||!u.grammar)return n.hooks.run("complete",u),void 0;if(n.hooks.run("before-highlight",u),a&&_self.Worker){var c=new Worker(n.filename);c.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(u.element),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},c.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(t),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},highlight:function(e,t,r){var i=n.tokenize(e,t);return a.stringify(n.util.encode(i),r)},tokenize:function(e,t){var a=n.Token,r=[e],i=t.rest;if(i){for(var l in i)t[l]=i[l];delete t.rest}e:for(var l in t)if(t.hasOwnProperty(l)&&t[l]){var o=t[l];o="Array"===n.util.type(o)?o:[o];for(var s=0;s<o.length;++s){var u=o[s],c=u.inside,g=!!u.lookbehind,h=!!u.greedy,f=0,d=u.alias;if(h&&!u.pattern.global){var p=u.pattern.toString().match(/[imuy]*$/)[0];u.pattern=RegExp(u.pattern.source,p+"g")}u=u.pattern||u;for(var m=0,y=0;m<r.length;y+=(r[m].matchedStr||r[m]).length,++m){var v=r[m];if(r.length>e.length)break e;if(!(v instanceof a)){u.lastIndex=0;var b=u.exec(v),k=1;if(!b&&h&&m!=r.length-1){if(u.lastIndex=y,b=u.exec(e),!b)break;for(var w=b.index+(g?b[1].length:0),_=b.index+b[0].length,A=m,S=y,P=r.length;P>A&&_>S;++A)S+=(r[A].matchedStr||r[A]).length,w>=S&&(++m,y=S);if(r[m]instanceof a||r[A-1].greedy)continue;k=A-m,v=e.slice(y,S),b.index-=y}if(b){g&&(f=b[1].length);var w=b.index+f,b=b[0].slice(f),_=w+b.length,x=v.slice(0,w),O=v.slice(_),j=[m,k];x&&j.push(x);var N=new a(l,c?n.tokenize(b,c):b,d,b,h);j.push(N),O&&j.push(O),Array.prototype.splice.apply(r,j)}}}}}return r},hooks:{all:{},add:function(e,t){var a=n.hooks.all;a[e]=a[e]||[],a[e].push(t)},run:function(e,t){var a=n.hooks.all[e];if(a&&a.length)for(var r,i=0;r=a[i++];)r(t)}}},a=n.Token=function(e,t,n,a,r){this.type=e,this.content=t,this.alias=n,this.matchedStr=a||null,this.greedy=!!r};if(a.stringify=function(e,t,r){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(n){return a.stringify(n,t,e)}).join("");var i={type:e.type,content:a.stringify(e.content,t,r),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:r};if("comment"==i.type&&(i.attributes.spellcheck="true"),e.alias){var l="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(i.classes,l)}n.hooks.run("wrap",i);var o="";for(var s in i.attributes)o+=(o?" ":"")+s+'="'+(i.attributes[s]||"")+'"';return"<"+i.tag+' class="'+i.classes.join(" ")+'"'+(o?" "+o:"")+">"+i.content+"</"+i.tag+">"},!_self.document)return _self.addEventListener?(_self.addEventListener("message",function(e){var t=JSON.parse(e.data),a=t.language,r=t.code,i=t.immediateClose;_self.postMessage(n.highlight(r,n.languages[a],a)),i&&_self.close()},!1),_self.Prism):_self.Prism;var r=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return r&&(n.filename=r.src,document.addEventListener&&!r.hasAttribute("data-manual")&&("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n.highlightAll):window.setTimeout(n.highlightAll,16):document.addEventListener("DOMContentLoaded",n.highlightAll))),_self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);
Prism.languages.markup={comment:/<!--[\w\W]*?-->/,prolog:/<\?[\w\W]+?\?>/,doctype:/<!DOCTYPE[\w\W]+?>/i,cdata:/<!\[CDATA\[[\w\W]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,inside:{punctuation:/[=>"']/}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},Prism.hooks.add("wrap",function(a){"entity"===a.type&&(a.attributes.title=a.content.replace(/&amp;/,"&"))}),Prism.languages.xml=Prism.languages.markup,Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup;
Prism.languages.css={comment:/\/\*[\w\W]*?\*\//,atrule:{pattern:/@[\w-]+?.*?(;|(?=\s*\{))/i,inside:{rule:/@[\w-]+/}},url:/url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,selector:/[^\{\}\s][^\{\};]*?(?=\s*\{)/,string:{pattern:/("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,greedy:!0},property:/(\b|\B)[\w-]+(?=\s*:)/i,important:/\B!important\b/i,"function":/[-a-z0-9]+(?=\()/i,punctuation:/[(){};:]/},Prism.languages.css.atrule.inside.rest=Prism.util.clone(Prism.languages.css),Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,lookbehind:!0,inside:Prism.languages.css,alias:"language-css"}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|').*?\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\w\W]*?\*\//,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0}],string:{pattern:/(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,lookbehind:!0,inside:{punctuation:/(\.|\\)/}},keyword:/\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,"boolean":/\b(true|false)\b/,"function":/[a-z0-9_]+(?=\()/i,number:/\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/};
Prism.languages.javascript=Prism.languages.extend("clike",{keyword:/\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,number:/\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,"function":/[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*\*?|\/|~|\^|%|\.{3}/}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/(^|[^\/])\/(?!\/)(\[.+?]|\\.|[^\/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,lookbehind:!0,greedy:!0}}),Prism.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\\\|\\?[^\\])*?`/,greedy:!0,inside:{interpolation:{pattern:/\$\{[^}]+\}/,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,lookbehind:!0,inside:Prism.languages.javascript,alias:"language-javascript"}}),Prism.languages.js=Prism.languages.javascript;
/*es6*/


if (!Object.values)
  Object.values = object => Object.keys(object).map(key => object[key]);

if (!Object.entries)
  Object.entries = object => Object.keys(object).map(key => [key, object[key]]);

const reduceMotion = matchMedia("(prefers-reduced-motion)").matches;

const observeScroll = (element, callback) => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < 1) return;
    callback();
    observer.disconnect();
  },{
    threshold: 1
  });
  observer.observe(element);
};

const randomInterval = (callback, min, max) => {
  const time = {
    start: performance.now(),
    total: Strut.random(min, max)
  };
  const tick = now => {
    if (time.total <= now - time.start) {
      time.start = now;
      time.total = Strut.random(min, max);
      callback();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
/*es6*/


{
  const diameter = 48;
  const radius = diameter / 2;
  const frustrum = radius * 1.1;
  const velocity = .0004;

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-frustrum, frustrum, frustrum, -frustrum, 0, 100);
  camera.position.y = diameter * 0.2;
  camera.position.z = diameter;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(diameter, diameter);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById("globe-icon").appendChild(renderer.domElement);

  new THREE.TextureLoader().load(
    "/img/v3/connect/features/key-benefits/world-map.png",
    texture => {
      texture.anisotropy = renderer.getMaxAnisotropy();
      texture.minFilter = THREE.NearestMipMapLinearFilter;

      const vertexShader = `
varying vec2 vUv;

void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
      `;

      const fragmentShader = `
varying vec2 vUv;

uniform sampler2D texture;
uniform vec3 shadowColor;
uniform vec3 lightColor;

float sharpen(float value, float intensity) {
  return clamp(value * intensity - (intensity / 2.0) + 0.5, 0.0, 1.0);
}

void main() {
  float texel = sharpen(texture2D(texture, vUv)[1], 2.0);
  gl_FragColor = vec4(mix(shadowColor, lightColor, texel), 1.0);
}
      `;

      const geometry = new THREE.SphereGeometry(radius, 32, 32);

      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          texture: { type: 't', value: texture },
          shadowColor: { type: 'c', value: new THREE.Color(0x68d4f8) },
          lightColor: { type: 'c', value: new THREE.Color(0xFFFFFF) },
        },
      });

      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      const tick = t => {
        sphere.rotation.y = t * velocity;
        renderer.render(scene, camera);
        if (reduceMotion) return;
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }
  );
}
/*es6*/

// ===============
// flame animation
// ===============

{
  const flame = document.querySelector("#rocket-icon .flame");

  const from = {x: 1, y: 1};
  const to = {};
  const delta = {};
  const keys = Object.keys(from);

  const next = timestamp => {
    Object.assign(from, to);
    keys.forEach(axis => {
      to[axis] = Strut.random(.8, 1);
      delta[axis] = from[axis] - to[axis];
    });
    time.start = timestamp;
  };

  const time = {
    total: 40
  };

  const tick = timestamp => {
    if (time.elapsed > time.total || !to.x) next(timestamp);

    time.elapsed = timestamp - time.start;
    const progress = time.elapsed / time.total;
    const [x, y] = keys.map(axis => from[axis] - progress * delta[axis]);
    flame.style.transform = `scale(${x}, ${y})`;

    requestAnimationFrame(tick);
  };

  if (!reduceMotion)
    requestAnimationFrame(tick);
}


// ============
// moving stars
// ============

{
  const rocket = document.getElementById("rocket-icon");
  const [size] = /[1-9]\d*/.exec(rocket.getAttribute("viewBox"));

  const createStar = (min, max) => {
    const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    star.setAttribute("r", min);
    star.setAttribute("cx", max);
    star.setAttribute("cy", Strut.random(min, max));
    star.setAttribute("fill", "#AAB7C4");
    star.setAttribute("fill-opacity", 0);
    return star;
  };

  const fly = () => {
    const min = Strut.random(.2, 1.2);
    const max = size - min;
    const delta = max - min;
    const star = createStar(min, max);

    const time = {
      start: performance.now(),
      total: Strut.random(2000, 2200)
    };

    const tick = timestamp => {
      time.elapsed = timestamp - time.start;
      const progress = Math.min(time.elapsed / time.total, 1);
      const opacity = progress * 2;

      star.setAttribute("cx", max - progress * delta);
      star.setAttribute("fill-opacity", progress < .5 ? opacity : 2 - opacity);

      time.elapsed < time.total
        ? requestAnimationFrame(tick)
        : rocket.removeChild(star);
    };

    requestAnimationFrame(tick);
    rocket.insertBefore(star, rocket.firstChild);
  };

  if (!reduceMotion)
    randomInterval(fly, 80, 200);
}
{
  const link = document.querySelector("#international-support .content a");
  const overlay = document.getElementById("features-list");
  const hash = `#${overlay.id}`;


  const isActive = () => overlay.classList.contains("active");

  const toggle = () => {
    document.body.classList.toggle("no-scroll");
    overlay.classList.toggle("active");
  };

  const open = e => {
    overlay.style.display = "block";
    requestAnimationFrame(toggle);
    if (e) {
      e.preventDefault();
      history.replaceState({}, document.title, hash);
    }
  };

  const close = () => {
    toggle();
    history.replaceState({}, document.title, document.location.pathname);
  };


  link.addEventListener("click", open);

  window.addEventListener("load", () => {
    if (document.location.hash == hash)
      setTimeout(open, 800);
  });

  overlay.addEventListener("transitionend", ({target}) => {
    if (target == overlay && !isActive())
      overlay.removeAttribute("style");
  });

  overlay.addEventListener("click", ({target}) => {
    if (target == overlay)
      close();
  });

  window.addEventListener("keydown", ({key}) => {
    if (key == "Escape" && isActive())
      close();
  });
}
/*es6*/


{
  const lazyLoaded = ["connect/features/index-lazy"];

  if (!Element.prototype.animate)
    lazyLoaded.unshift("external/web-animations-polyfill");

  if (!("IntersectionObserver" in window))
    lazyLoaded.unshift("external/intersection-observer-polyfill");

  lazyLoaded.forEach(name => Strut.load.js(`v3/${name}.js`));
}
{
  const section = document.getElementById("code-examples");
  const nav = section.querySelector("nav");
  const selection = nav.querySelector(".selection");
  const buttons = Strut.queryArray("button", nav);
  const examples = Strut.queryArray("pre", section);

  const createLineNumbers = function(text) {
    const count = function(n, total, lines) {
      if (!n) {
        n = 1;
        total = text.split("\n").length;
        lines = "";
      }
      return total == n ? lines + n : count(n + 1, total, lines + n + "\n");
    };
    return count();
  };

  const triggerChange = function(index = 0) {
    const [active] = examples.filter(el => el.classList.contains("active"));
    active.classList.remove("active");
    examples[index].classList.add("active");
    selectButton(index);
  };

  const selectButton = function(index) {
    selection.style.transform = "translateY(" + 100 * index + "%)";
  };

  nav.addEventListener("click", function({target}) {
    if (target.nodeName.toLowerCase() != "button") return;
    triggerChange(buttons.indexOf(target));
  });

  // prismify all examples
  examples.forEach(el => {
    const text = el.textContent;
    const code = document.createElement("code");
    code.className = "language-javascript";
    code.textContent = text;

    el.innerHTML = `<span class=custom-line-numbers>${createLineNumbers(text)}</span>`;
    el.appendChild(code);

    Prism.highlightElement(code);
  });
}
/*es6*/


{
  // =======
  // helpers
  // =======

  const setState = (state, speed) =>
    directions.forEach(axis => {
      state[axis] += speed[axis];
      if (Math.abs(state[axis]) < 360) return;
      const max = Math.max(state[axis], 360);
      const min = max == 360 ? Math.abs(state[axis]) : 360;
      state[axis] = max - min;
    });

  const cubeIsHidden = left => left > parentWidth + 30;


  // =================
  // shared references
  // =================

  let headerIsHidden = false;

  const template = document.getElementById("cube-template");

  const parent = document.getElementById("header-hero");
  const getParentWidth = () => parent.getBoundingClientRect().width;
  let parentWidth = getParentWidth();
  window.addEventListener("resize", () => parentWidth = getParentWidth());

  const directions = ["x", "y"];

  const palette = {
    white: {
      color: [255, 255, 255],
      shading: [160, 190, 218]
    },
    orange: {
      color: [255, 250, 230],
      shading: [255, 120, 50]
    },
    green: {
      color: [205, 255, 204],
      shading: [0, 211, 136]
    }
  };


  // ==============
  // cube instances
  // ==============

  const setCubeStyles = ({cube, size, left, top}) => {
    Object.assign(cube.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}px`,
      top: `${top}px`
    });

    Object.assign(cube.querySelector(".shadow").style, {
      filter: `blur(${Math.round(size * .6)}px)`,
      opacity: Math.min(size / 120, .4)
    });
  };

  const createCube = size => {
    const fragment = document.importNode(template.content, true);
    const cube = fragment.querySelector(".cube");

    const state = {
      x: 0,
      y: 0
    };

    const speed = directions.reduce((object, axis) => {
      const max = size > sizes.m ? .3 : .6;
      object[axis] = Strut.random(-max, max);
      return object;
    }, {});

    const sides = Strut.queryArray(".sides div", cube).reduce((object, side) => {
      object[side.className] = {
        side,
        hidden: false,
        rotate: {
          x: 0,
          y: 0
        }
      };
      return object;
    }, {});

    sides.top.rotate.x = 90;
    sides.bottom.rotate.x = -90;
    sides.left.rotate.y = -90;
    sides.right.rotate.y = 90;
    sides.back.rotate.y = -180

    return {fragment, cube, state, speed, sides: Object.values(sides)};
  };

  const sizes = {
    xs: 15,
    s: 25,
    m: 40,
    l: 100,
    xl: 120
  };

  const cubes = [
    {
      tint: palette.green,
      size: sizes.xs,
      left: 35,
      top: 465
    },{
      tint: palette.white,
      size: sizes.s,
      left: 55,
      top: 415
    },{
      tint: palette.white,
      size: sizes.xl,
      left: 140,
      top: 400
    },{
      tint: palette.white,
      size: sizes.m,
      left: 420,
      top: 155
    },{
      tint: palette.green,
      size: sizes.xs,
      left: 440,
      top: 280
    },{
      tint: palette.orange,
      size: sizes.s,
      left: 480,
      top: 228
    },{
      tint: palette.white,
      size: sizes.l,
      left: 580,
      top: 255
    },{
      tint: palette.green,
      size: sizes.s,
      left: 780,
      top: 320
    },{
      tint: palette.white,
      size: sizes.xl,
      left: 780,
      top: 120
    },{
      tint: palette.orange,
      size: sizes.l,
      left: 900,
      top: 310
    },{
      tint: palette.green,
      size: sizes.m,
      left: 1030,
      top: 200
    }
  ].map(object => Object.assign(createCube(object.size), object));

  cubes.forEach(setCubeStyles);


  // =======================
  // cube rotating animation
  // =======================

  const getDistance = (state, rotate) =>
    directions.reduce((object, axis) => {
      object[axis] = Math.abs(state[axis] + rotate[axis]);
      return object;
    }, {});

  const getRotation = (state, size, rotate) => {
    const axis = rotate.x ? "Z" : "Y";
    const direction = rotate.x > 0 ? -1 : 1;

    return `
      rotateX(${state.x + rotate.x}deg)
      rotate${axis}(${direction * (state.y + rotate.y)}deg)
      translateZ(${size / 2}px)
    `;
  };

  const getShading = (tint, rotate, distance) => {
    const darken = directions.reduce((object, axis) => {
      const delta = distance[axis];
      const ratio = delta / 180;
      object[axis] = delta > 180 ? Math.abs(2 - ratio) : ratio;
      return object;
    }, {});

    if (rotate.x)
      darken.y = 0;
    else {
      const {x} = distance;
      if (x > 90 && x < 270)
        directions.forEach(axis => darken[axis] = 1 - darken[axis]);
    }

    const alpha = (darken.x + darken.y) / 2;
    const blend = (value, index) => Math.round(Strut.interpolate(value, tint.shading[index], alpha));
    const [r, g, b] = tint.color.map(blend);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const shouldHide = (rotateX, x, y) => {
    if (rotateX)
      return x > 90 && x < 270;
    if (x < 90)
      return y > 90 && y < 270;
    if (x < 270)
      return y < 90;
    return y > 90 && y < 270;
  };

  const updateSides = ({state, speed, size, tint, sides, left}) => {
    if (headerIsHidden || cubeIsHidden(left)) return;

    const animate = object => {
      const {side, rotate, hidden} = object;
      const distance = getDistance(state, rotate);

      // don't animate hidden sides
      if (shouldHide(rotate.x, distance.x, distance.y)) {
        if (!hidden) {
          side.hidden = true;
          object.hidden = true;
        }
        return;
      }

      if (hidden) {
        side.hidden = false;
        object.hidden = false;
      }

      side.style.transform = getRotation(state, size, rotate);
      side.style.backgroundColor = getShading(tint, rotate, distance);
    };

    setState(state, speed);
    sides.forEach(animate);
  };

  const tick = () => {
    cubes.forEach(updateSides);
    if (reduceMotion) return;
    requestAnimationFrame(tick);
  };


  // ===============
  // parallax scroll
  // ===============

  // give it some extra space to account for the parallax and the shadows of the cubes
  const parallaxLimit = document.querySelector("main > header").getBoundingClientRect().height + 80;

  window.addEventListener("scroll", () => {
    const scroll = window.scrollY;
    if (scroll < parallaxLimit) {
      headerIsHidden = false;
      cubes.forEach(({cube, speed}) =>
        cube.style.transform = `translateY(${Math.abs(speed.x * .5) * scroll}px)`);
      return;
    }
    headerIsHidden = true;
  });


  // ==========
  // initialize
  // ==========

  const container = document.createElement("div");
  container.className = "cubes";
  cubes.forEach(({fragment}) => container.appendChild(fragment));

  const start = () => {
    tick();
    parent.appendChild(container);
  };

  "requestIdleCallback" in window
    ? requestIdleCallback(start)
    : start();
}
/*es6*/












