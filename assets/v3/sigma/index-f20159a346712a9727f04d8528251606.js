(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.BezierEasing = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
   var currentSlope = getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

module.exports = function bezier (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  // Precompute samples table
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (var i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;

    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    if (mX1 === mY1 && mX2 === mY2) {
      return x; // linear
    }
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};

},{}]},{},[1])(1)
});
// Adapted for 1D noise from p5.js
// https://github.com/processing/p5.js/blob/master/src/math/noise.js

//////////////////////////////////////////////////////////////

// http://mrl.nyu.edu/~perlin/noise/
// Adapting from PApplet.java
// which was adapted from toxi
// which was adapted from the german demo group farbrausch
// as used in their demo "art": http://www.farb-rausch.de/fr010src.zip

// someday we might consider using "improved noise"
// http://mrl.nyu.edu/~perlin/paper445.pdf
// See: https://github.com/shiffman/The-Nature-of-Code-Examples-p5.js/
//      blob/master/introduction/Noise1D/noise.js

'use strict';

var PERLIN_ZWRAPB = 8;
var PERLIN_ZWRAP = 1<<PERLIN_ZWRAPB;
var PERLIN_SIZE = 4095;

var perlin_octaves = 4; // default to medium smooth
var perlin_amp_falloff = 0.5; // 50% reduction/octave

var scaled_cosine = function(i) {
  return 0.5*(1.0-Math.cos(i*Math.PI));
};

var perlin; // will be initialized lazily by noise() or noiseSeed()

var noise = function(x) {
  if (perlin == null) {
    perlin = new Array(PERLIN_SIZE + 1);
    for (var i = 0; i < PERLIN_SIZE + 1; i++) {
      perlin[i] = Math.random();
    }
  }

  if (x<0) { x=-x; }

  var xi=Math.floor(x);
  var xf = x - xi;
  var rxf;

  var r=0;
  var ampl=0.5;

  var n1;

  for (var o=0; o<perlin_octaves; o++) {
    rxf = scaled_cosine(xf);

    n1  = perlin[xi&PERLIN_SIZE];
    n1 += rxf*(perlin[(xi+1)&PERLIN_SIZE]-n1);

    r += n1*ampl;
    ampl *= perlin_amp_falloff;
    xi<<=1;
    xf*=2;

    if (xf>=1.0) { xi++; xf--; }
  }
  return r;
};
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StackBlur = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
    StackBlur - a fast almost Gaussian Blur For Canvas

    Version:     0.5
    Author:        Mario Klingemann
    Contact:     mario@quasimondo.com
    Website:    http://www.quasimondo.com/StackBlurForCanvas
    Twitter:    @quasimondo

    In case you find this class useful - especially in commercial projects -
    I am not totally unhappy for a small donation to my PayPal account
    mario@quasimondo.de

    Or support me on flattr:
    https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

    Copyright (c) 2010 Mario Klingemann

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
    */


var mul_table = [
    512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
    454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
    482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
    437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
    497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
    320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
    446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
    329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
    505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
    399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
    324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
    268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
    451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
    385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
    332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
    289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];


var shg_table = [
    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];


function processImage(img, canvas, radius, blurAlphaChannel)
{
    if (typeof(img) == 'string') {
        var img = document.getElementById(img);
    }
    else if (typeof HTMLImageElement !== 'undefined' && !img instanceof HTMLImageElement) {
        return;
    }
    var w = img.naturalWidth;
    var h = img.naturalHeight;

    if (typeof(canvas) == 'string') {
        var canvas = document.getElementById(canvas);
    }
    else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement) {
        return;
    }

    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    context.clearRect(0, 0, w, h);
    context.drawImage(img, 0, 0);

    if (isNaN(radius) || radius < 1) return;

    if (blurAlphaChannel)
        processCanvasRGBA(canvas, 0, 0, w, h, radius);
    else
        processCanvasRGB(canvas, 0, 0, w, h, radius);
}

function getImageDataFromCanvas(canvas, top_x, top_y, width, height)
{
    if (typeof(canvas) == 'string')
        var canvas  = document.getElementById(canvas);
    else if (typeof HTMLCanvasElement !== 'undefined' && !canvas instanceof HTMLCanvasElement)
        return;

    var context = canvas.getContext('2d');
    var imageData;

    try {
        try {
            imageData = context.getImageData(top_x, top_y, width, height);
        } catch(e) {
            throw new Error("unable to access local image data: " + e);
            return;
        }
    } catch(e) {
        throw new Error("unable to access image data: " + e);
    }

    return imageData;
}

function processCanvasRGBA(canvas, top_x, top_y, width, height, radius)
{
    if (isNaN(radius) || radius < 1) return;
    radius |= 0;

    var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);

    imageData = processImageDataRGBA(imageData, top_x, top_y, width, height, radius);

    canvas.getContext('2d').putImageData(imageData, top_x, top_y);
}

function processImageDataRGBA(imageData, top_x, top_y, width, height, radius)
{
    var pixels = imageData.data;

    var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
        r_out_sum, g_out_sum, b_out_sum, a_out_sum,
        r_in_sum, g_in_sum, b_in_sum, a_in_sum,
        pr, pg, pb, pa, rbs;

    var div = radius + radius + 1;
    var w4 = width << 2;
    var widthMinus1  = width - 1;
    var heightMinus1 = height - 1;
    var radiusPlus1  = radius + 1;
    var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    var stackStart = new BlurStack();
    var stack = stackStart;
    for (i = 1; i < div; i++)
    {
        stack = stack.next = new BlurStack();
        if (i == radiusPlus1) var stackEnd = stack;
    }
    stack.next = stackStart;
    var stackIn = null;
    var stackOut = null;

    yw = yi = 0;

    var mul_sum = mul_table[radius];
    var shg_sum = shg_table[radius];

    for (y = 0; y < height; y++)
    {
        r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++)
        {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p+2])) * rbs;
            a_sum += (stack.a = (pa = pixels[p+3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;
        }


        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++)
        {
            pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa != 0)
            {
                pa = 255 / pa;
                pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
            }

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p+1]);
            b_in_sum += (stackIn.b = pixels[p+2]);
            a_in_sum += (stackIn.a = pixels[p+3]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;
            a_sum += a_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }


    for (x = 0; x < width; x++)
    {
        g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
        a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;
        a_sum += sumFactor * pa;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack.a = pa;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++)
        {
            yi = (yp + x) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;
            a_sum += (stack.a = (pa = pixels[yi+3])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;
            a_in_sum += pa;

            stack = stack.next;

            if(i < heightMinus1)
            {
                yp += width;
            }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++)
        {
            p = yi << 2;
            pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
            if (pa > 0)
            {
                pa = 255 / pa;
                pixels[p]   = ((r_sum * mul_sum) >> shg_sum) * pa;
                pixels[p+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                pixels[p+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
            } else {
                pixels[p] = pixels[p+1] = pixels[p+2] = 0;
            }

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;
            a_sum -= a_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;
            a_out_sum -= stackIn.a;

            p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_sum += (r_in_sum += (stackIn.r = pixels[p]));
            g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
            b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));
            a_sum += (a_in_sum += (stackIn.a = pixels[p+3]));

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);
            a_out_sum += (pa = stackOut.a);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;
            a_in_sum -= pa;

            stackOut = stackOut.next;

            yi += width;
        }
    }
    return imageData;
}

function processCanvasRGB(canvas, top_x, top_y, width, height, radius)
{
    if (isNaN(radius) || radius < 1) return;
    radius |= 0;

    var imageData = getImageDataFromCanvas(canvas, top_x, top_y, width, height);
    imageData = processImageDataRGB(imageData, top_x, top_y, width, height, radius);

    canvas.getContext('2d').putImageData(imageData, top_x, top_y);
}

function processImageDataRGB(imageData, top_x, top_y, width, height, radius)
{
    var pixels = imageData.data;

    var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
        r_out_sum, g_out_sum, b_out_sum,
        r_in_sum, g_in_sum, b_in_sum,
        pr, pg, pb, rbs;

    var div = radius + radius + 1;
    var w4 = width << 2;
    var widthMinus1  = width - 1;
    var heightMinus1 = height - 1;
    var radiusPlus1  = radius + 1;
    var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    var stackStart = new BlurStack();
    var stack = stackStart;
    for (i = 1; i < div; i++)
    {
        stack = stack.next = new BlurStack();
        if (i == radiusPlus1) var stackEnd = stack;
    }
    stack.next = stackStart;
    var stackIn = null;
    var stackOut = null;

    yw = yi = 0;

    var mul_sum = mul_table[radius];
    var shg_sum = shg_table[radius];

    for (y = 0; y < height; y++)
    {
        r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++)
        {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p+2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;
        }


        stackIn = stackStart;
        stackOut = stackEnd;
        for (x = 0; x < width; x++)
        {
            pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
            pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
            pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p+1]);
            b_in_sum += (stackIn.b = pixels[p+2]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }


    for (x = 0; x < width; x++)
    {
        g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++)
        {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++)
        {
            yi = (yp + x) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;

            if(i < heightMinus1)
            {
                yp += width;
            }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;
        for (y = 0; y < height; y++)
        {
            p = yi << 2;
            pixels[p]   = (r_sum * mul_sum) >> shg_sum;
            pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
            pixels[p+2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_sum += (r_in_sum += (stackIn.r = pixels[p]));
            g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
            b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += width;
        }
    }

    return imageData;
}

function BlurStack()
{
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
}

module.exports = {
    image: processImage,
    canvasRGBA: processCanvasRGBA,
    canvasRGB: processCanvasRGB,
    imageDataRGBA: processImageDataRGBA,
    imageDataRGB: processImageDataRGB
};

},{}]},{},[1])(1)
});
Strut.ready(function(){"use strict";var t=function(){if("scrollingElement"in document)return document.scrollingElement;var t=document.documentElement,n=t.scrollTop;t.scrollTop=n+1;var e=t.scrollTop;return t.scrollTop=n,e>n?t:document.body}(),n=function(t,n,e,r){return Math.round(r*(-Math.pow(2,-10*n/t)+1)+e)},e=function(n){var e=t.scrollTop,r=function(){if(n.length<2)return-e;var r=document.querySelector(n);if(r){var o=r.getBoundingClientRect().top,l=t.scrollHeight-window.innerHeight;return e+o<l?o:l-e}}();if(r)return{start:e,delta:r}},r=function(r){var l=r.getAttribute("href"),u=e(l);if(u){var i=function(e){c.elapsed=e-a,t.scrollTop=n(c.duration,c.elapsed,u.start,u.delta),c.elapsed<c.duration?requestAnimationFrame(i):o(l,u)},c={duration:800},a=performance.now();requestAnimationFrame(i)}},o=function(n,e){history.pushState(null,null,n),t.scrollTop=e.start+e.delta},l=function(t){return t.length-1},u=function(t,n){void 0===n&&(n=l(t));var e=t.item(n);if(e.addEventListener("click",function(t){t.preventDefault(),r(e)}),n)return u(t,n-1)};u(document.querySelectorAll("a.scroll"))});
/* http://prismjs.com/download.html?themes=prism&languages=sql */

var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(){var e=/\blang(?:uage)?-(\w+)\b/i,t=0,n=_self.Prism={manual:_self.Prism&&_self.Prism.manual,util:{encode:function(e){return e instanceof a?new a(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function(e){var t=n.util.type(e);switch(t){case"Object":var a={};for(var r in e)e.hasOwnProperty(r)&&(a[r]=n.util.clone(e[r]));return a;case"Array":return e.map&&e.map(function(e){return n.util.clone(e)})}return e}},languages:{extend:function(e,t){var a=n.util.clone(n.languages[e]);for(var r in t)a[r]=t[r];return a},insertBefore:function(e,t,a,r){r=r||n.languages;var i=r[e];if(2==arguments.length){a=arguments[1];for(var l in a)a.hasOwnProperty(l)&&(i[l]=a[l]);return i}var o={};for(var s in i)if(i.hasOwnProperty(s)){if(s==t)for(var l in a)a.hasOwnProperty(l)&&(o[l]=a[l]);o[s]=i[s]}return n.languages.DFS(n.languages,function(t,n){n===r[e]&&t!=e&&(this[t]=o)}),r[e]=o},DFS:function(e,t,a,r){r=r||{};for(var i in e)e.hasOwnProperty(i)&&(t.call(e,i,e[i],a||i),"Object"!==n.util.type(e[i])||r[n.util.objId(e[i])]?"Array"!==n.util.type(e[i])||r[n.util.objId(e[i])]||(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,i,r)):(r[n.util.objId(e[i])]=!0,n.languages.DFS(e[i],t,null,r)))}},plugins:{},highlightAll:function(e,t){var a={callback:t,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};n.hooks.run("before-highlightall",a);for(var r,i=a.elements||document.querySelectorAll(a.selector),l=0;r=i[l++];)n.highlightElement(r,e===!0,a.callback)},highlightElement:function(t,a,r){for(var i,l,o=t;o&&!e.test(o.className);)o=o.parentNode;o&&(i=(o.className.match(e)||[,""])[1].toLowerCase(),l=n.languages[i]),t.className=t.className.replace(e,"").replace(/\s+/g," ")+" language-"+i,o=t.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+i);var s=t.textContent,u={element:t,language:i,grammar:l,code:s};if(n.hooks.run("before-sanity-check",u),!u.code||!u.grammar)return u.code&&(n.hooks.run("before-highlight",u),u.element.textContent=u.code,n.hooks.run("after-highlight",u)),n.hooks.run("complete",u),void 0;if(n.hooks.run("before-highlight",u),a&&_self.Worker){var g=new Worker(n.filename);g.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(u.element),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},g.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(t),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},highlight:function(e,t,r){var i=n.tokenize(e,t);return a.stringify(n.util.encode(i),r)},matchGrammar:function(e,t,a,r,i,l,o){var s=n.Token;for(var u in a)if(a.hasOwnProperty(u)&&a[u]){if(u==o)return;var g=a[u];g="Array"===n.util.type(g)?g:[g];for(var c=0;c<g.length;++c){var h=g[c],f=h.inside,d=!!h.lookbehind,m=!!h.greedy,p=0,y=h.alias;if(m&&!h.pattern.global){var v=h.pattern.toString().match(/[imuy]*$/)[0];h.pattern=RegExp(h.pattern.source,v+"g")}h=h.pattern||h;for(var b=r,k=i;b<t.length;k+=t[b].length,++b){var w=t[b];if(t.length>e.length)return;if(!(w instanceof s)){h.lastIndex=0;var _=h.exec(w),P=1;if(!_&&m&&b!=t.length-1){if(h.lastIndex=k,_=h.exec(e),!_)break;for(var A=_.index+(d?_[1].length:0),j=_.index+_[0].length,x=b,O=k,S=t.length;S>x&&(j>O||!t[x].type&&!t[x-1].greedy);++x)O+=t[x].length,A>=O&&(++b,k=O);if(t[b]instanceof s||t[x-1].greedy)continue;P=x-b,w=e.slice(k,O),_.index-=k}if(_){d&&(p=_[1].length);var A=_.index+p,_=_[0].slice(p),j=A+_.length,N=w.slice(0,A),C=w.slice(j),E=[b,P];N&&(++b,k+=N.length,E.push(N));var L=new s(u,f?n.tokenize(_,f):_,y,_,m);if(E.push(L),C&&E.push(C),Array.prototype.splice.apply(t,E),1!=P&&n.matchGrammar(e,t,a,b,k,!0,u),l)break}else if(l)break}}}}},tokenize:function(e,t){var a=[e],r=t.rest;if(r){for(var i in r)t[i]=r[i];delete t.rest}return n.matchGrammar(e,a,t,0,0,!1),a},hooks:{all:{},add:function(e,t){var a=n.hooks.all;a[e]=a[e]||[],a[e].push(t)},run:function(e,t){var a=n.hooks.all[e];if(a&&a.length)for(var r,i=0;r=a[i++];)r(t)}}},a=n.Token=function(e,t,n,a,r){this.type=e,this.content=t,this.alias=n,this.length=0|(a||"").length,this.greedy=!!r};if(a.stringify=function(e,t,r){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(n){return a.stringify(n,t,e)}).join("");var i={type:e.type,content:a.stringify(e.content,t,r),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:r};if("comment"==i.type&&(i.attributes.spellcheck="true"),e.alias){var l="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(i.classes,l)}n.hooks.run("wrap",i);var o=Object.keys(i.attributes).map(function(e){return e+'="'+(i.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return"<"+i.tag+' class="'+i.classes.join(" ")+'"'+(o?" "+o:"")+">"+i.content+"</"+i.tag+">"},!_self.document)return _self.addEventListener?(_self.addEventListener("message",function(e){var t=JSON.parse(e.data),a=t.language,r=t.code,i=t.immediateClose;_self.postMessage(n.highlight(r,n.languages[a],a)),i&&_self.close()},!1),_self.Prism):_self.Prism;var r=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return r&&(n.filename=r.src,!document.addEventListener||n.manual||r.hasAttribute("data-manual")||("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n.highlightAll):window.setTimeout(n.highlightAll,16):document.addEventListener("DOMContentLoaded",n.highlightAll))),_self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);
Prism.languages.sql={comment:{pattern:/(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,lookbehind:!0},string:{pattern:/(^|[^@\\])("|')(?:\\?[\s\S])*?\2/,greedy:!0,lookbehind:!0},variable:/@[\w.$]+|@("|'|`)(?:\\?[\s\S])+?\1/,"function":/\b(?:COUNT|SUM|AVG|MIN|MAX|FIRST|LAST|UCASE|LCASE|MID|LEN|ROUND|NOW|FORMAT)(?=\s*\()/i,keyword:/\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR VARYING|CHARACTER (?:SET|VARYING)|CHARSET|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|DATA(?:BASES?)?|DATE(?:TIME)?|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITER(?:S)?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE(?: PRECISION)?|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE KEY|ELSE|ENABLE|ENCLOSED BY|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPE(?:D BY)?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTO|INVOKER|ISOLATION LEVEL|JOIN|KEYS?|KILL|LANGUAGE SQL|LAST|LEFT|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MODIFIES SQL DATA|MODIFY|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL(?: CHAR VARYING| CHARACTER(?: VARYING)?| VARCHAR)?|NATURAL|NCHAR(?: VARCHAR)?|NEXT|NO(?: SQL|CHECK|CYCLE)?|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READ(?:S SQL DATA|TEXT)?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEATABLE|REPLICATION|REQUIRE|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE MODE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|START(?:ING BY)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED BY|TEXT(?:SIZE)?|THEN|TIMESTAMP|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNPIVOT|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?)\b/i,"boolean":/\b(?:TRUE|FALSE|NULL)\b/i,number:/\b-?(?:0x)?\d*\.?[\da-f]+\b/,operator:/[-+*\/=%^~]|&&?|\|?\||!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,punctuation:/[;[\]()`,.]/};
(function(){'use strict';var f,g=[];function l(a){g.push(a);1==g.length&&f()}function m(){for(;g.length;)g[0](),g.shift()}f=function(){setTimeout(m)};function n(a){this.a=p;this.b=void 0;this.f=[];var b=this;try{a(function(a){q(b,a)},function(a){r(b,a)})}catch(c){r(b,c)}}var p=2;function t(a){return new n(function(b,c){c(a)})}function u(a){return new n(function(b){b(a)})}function q(a,b){if(a.a==p){if(b==a)throw new TypeError;var c=!1;try{var d=b&&b.then;if(null!=b&&"object"==typeof b&&"function"==typeof d){d.call(b,function(b){c||q(a,b);c=!0},function(b){c||r(a,b);c=!0});return}}catch(e){c||r(a,e);return}a.a=0;a.b=b;v(a)}}
function r(a,b){if(a.a==p){if(b==a)throw new TypeError;a.a=1;a.b=b;v(a)}}function v(a){l(function(){if(a.a!=p)for(;a.f.length;){var b=a.f.shift(),c=b[0],d=b[1],e=b[2],b=b[3];try{0==a.a?"function"==typeof c?e(c.call(void 0,a.b)):e(a.b):1==a.a&&("function"==typeof d?e(d.call(void 0,a.b)):b(a.b))}catch(h){b(h)}}})}n.prototype.g=function(a){return this.c(void 0,a)};n.prototype.c=function(a,b){var c=this;return new n(function(d,e){c.f.push([a,b,d,e]);v(c)})};
function w(a){return new n(function(b,c){function d(c){return function(d){h[c]=d;e+=1;e==a.length&&b(h)}}var e=0,h=[];0==a.length&&b(h);for(var k=0;k<a.length;k+=1)u(a[k]).c(d(k),c)})}function x(a){return new n(function(b,c){for(var d=0;d<a.length;d+=1)u(a[d]).c(b,c)})};window.Promise||(window.Promise=n,window.Promise.resolve=u,window.Promise.reject=t,window.Promise.race=x,window.Promise.all=w,window.Promise.prototype.then=n.prototype.c,window.Promise.prototype["catch"]=n.prototype.g);}());

(function(){function l(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function m(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function k(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",k),a()})};function r(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function t(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;left:-999px;white-space:nowrap;font-synthesis:none;font:"+b+";"}function y(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function z(a,b){function c(){var a=k;y(a)&&a.a.parentNode&&b(a.g)}var k=a;l(a.b,c);l(a.c,c);y(a)};function A(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var B=null,C=null,E=null,F=null;function G(){if(null===C)if(J()&&/Apple/.test(window.navigator.vendor)){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);C=!!a&&603>parseInt(a[1],10)}else C=!1;return C}function J(){null===F&&(F=!!document.fonts);return F}
function K(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function L(a,b){return[a.style,a.weight,K()?a.stretch:"","100px",b].join(" ")}
A.prototype.load=function(a,b){var c=this,k=a||"BESbswy",q=0,D=b||3E3,H=(new Date).getTime();return new Promise(function(a,b){if(J()&&!G()){var M=new Promise(function(a,b){function e(){(new Date).getTime()-H>=D?b():document.fonts.load(L(c,'"'+c.family+'"'),k).then(function(c){1<=c.length?a():setTimeout(e,25)},function(){b()})}e()}),N=new Promise(function(a,c){q=setTimeout(c,D)});Promise.race([N,M]).then(function(){clearTimeout(q);a(c)},function(){b(c)})}else m(function(){function u(){var b;if(b=-1!=
f&&-1!=g||-1!=f&&-1!=h||-1!=g&&-1!=h)(b=f!=g&&f!=h&&g!=h)||(null===B&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),B=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=B&&(f==v&&g==v&&h==v||f==w&&g==w&&h==w||f==x&&g==x&&h==x)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(q),a(c))}function I(){if((new Date).getTime()-H>=D)d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)f=e.a.offsetWidth,
g=n.a.offsetWidth,h=p.a.offsetWidth,u();q=setTimeout(I,50)}}var e=new r(k),n=new r(k),p=new r(k),f=-1,g=-1,h=-1,v=-1,w=-1,x=-1,d=document.createElement("div");d.dir="ltr";t(e,L(c,"sans-serif"));t(n,L(c,"serif"));t(p,L(c,"monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);v=e.a.offsetWidth;w=n.a.offsetWidth;x=p.a.offsetWidth;I();z(e,function(a){f=a;u()});t(e,L(c,'"'+c.family+'",sans-serif'));z(n,function(a){g=a;u()});t(n,L(c,'"'+c.family+'",serif'));
z(p,function(a){h=a;u()});t(p,L(c,'"'+c.family+'",monospace'))})})};"undefined"!==typeof module?module.exports=A:(window.FontFaceObserver=A,window.FontFaceObserver.prototype.load=A.prototype.load);}());
const UTIL = {

  resizeCanvas: (canvas, w, h) => {
    const canvasResized = document.createElement('canvas');
    canvasResized.width = w;
    canvasResized.height = h;
    canvasResized.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
    return canvasResized;
  },

  drawRoundRect: (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
  },

  wrapText: (ctx, text, conf) => {
    let separator = ' ';
    let words = [];

    if (document.documentElement.lang == 'ja') {
      const notAtStartOfLine = ')]｝〕〉》」』】〙〗〟’"｠»‐゠–〜?!‼⁇⁈⁉・、:;,。.';
      const notAtEndOfLine = '([｛〔〈《「『【〘〖〝‘"｟«';

      for (let i = 0; i < text.length; i++) {
        const thisChar = text[i];
        const nextChar = text[i + 1];

        if (nextChar && notAtStartOfLine.indexOf(nextChar) >= 0) {
          words.push(thisChar + nextChar);
          i++;
        } else if (nextChar && notAtEndOfLine.indexOf(thisChar) >= 0) {
          words.push(thisChar + nextChar);
          i++;
        } else {
          words.push(thisChar);
        }
      }

      separator = '';

    } else {
      words = text.split(separator);
    }

    const maxLineLength = conf.width - conf.padding[0] - conf.padding[2];
    let line = '';
    let y = conf.padding[1];

    for (var i = 0; i < words.length; i++) {
      const testLine = line + words[i] + separator;
      const metrics = ctx.measureText(testLine.trim());

      if (metrics.width > maxLineLength) {
        ctx.fillText(line.trim(), conf.padding[0], y);
        line = words[i] + separator;
        y += conf.lineHeight;
      } else {
        line = testLine;
      }

      ctx.fillText(line.trim(), conf.padding[0], y);
    }
  },

  createEl: (tag, attrs) => {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach(prop => el[prop] = attrs[prop] );
    return el;
  },

  createSVGEl: (tag, attrs) => {
    const svgns = 'http://www.w3.org/2000/svg';
    const el = document.createElementNS(svgns, tag);
    Object.keys(attrs).forEach(prop => el.setAttribute(prop, attrs[prop]) );
    return el;
  },

  miniMarkdown: (text) => {
    let out = '';
    let state = {
      code: false,
      linkTitle: false,
      linkTitleContent: '',
      linkHref: false,
      linkHrefContent: '',
    };

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      switch (char) {
        case '`':
          if (state.code) {
            out = out + '</code>';
            state.code = false;
          } else {
            out = out + '<code>';
            state.code = true;
          }
          break;

        case '[':
          state.linkTitle = true;
          state.linkTitleContent = '';
          break;

        case ']':
          state.linkTitle = false;
          break;

        case '(':
          if (state.linkTitleContent.length) {
            state.linkHref = true;
            state.linkHrefContent = '';
          } else {
            out = out + '(';
          }
          break;

        case ')':
          if (state.linkTitleContent.length && state.linkHrefContent.length) {
            state.linkHref = false;
            out = out + `<a class='common-Link' href='${state.linkHrefContent}'>${state.linkTitleContent}</a>`;
            state.linkTitleContent = '';
            state.linkHrefContent = '';
          } else {
            out = out + ')';
          }
          break;

        default:
          if (state.linkTitle) {
            state.linkTitleContent = state.linkTitleContent + char;
          } else if (state.linkHref) {
            state.linkHrefContent = state.linkHrefContent + char;
          } else {
            out = out + char;
          }
      }
    }

    return out;
  },

  addNormalizedListener: (el, eventName, callback) => {
    const MOUSE = 0, TOUCH = 1, POINTER = 2;
    const EVENTS = {
      'enter': ['mouseenter', null, 'pointerenter'],
      'leave': ['mouseleave', null, 'pointerleave'],
      'down': ['mousedown', 'touchstart', 'pointerdown'],
      'move': ['mousemove', 'touchmove', 'pointermove'],
      'up': ['mouseup', 'touchend', 'pointerup'],
    };

    if (window.PointerEvent) {
      el.addEventListener(EVENTS[eventName][POINTER], e => UTIL.normalizeEvent(e, callback));
    } else {
      if (EVENTS[eventName][MOUSE]) el.addEventListener(EVENTS[eventName][MOUSE], e => UTIL.normalizeEvent(e, callback));
      el.addEventListener(EVENTS[eventName][TOUCH], e => UTIL.normalizeEvent(e, callback));
    }
  },

  normalizeEvent: (e, callback) => {
    if (e.changedTouches && e.changedTouches.length) {
      callback(e, {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        canHover: false,
      });
    } else {
      callback(e, {
        x: e.clientX,
        y: e.clientY,
        canHover: true,
      });
    }
  },

  setVendorStyle: (el, prop, val) => {
    ['-webkit-', '-ms-', '-moz-', ''].forEach(prefix => {
      el.style[prefix + prop] = val;
    })
  },

  preventWheelBubbles: function(e) {
    e.preventDefault();
    e.stopPropagation();

    const scale = e.deltaMode > 0 ? 40 : 1;

    this.scrollTop += e.deltaY * scale;
    this.scrollLeft += e.deltaX * scale;
  },

  rgbInterpolate: function(c1, c2, p) {
    return `rgb(${
      Math.round(Strut.interpolate(c1[0], c2[0], p))}, ${
      Math.round(Strut.interpolate(c1[1], c2[1], p))}, ${
      Math.round(Strut.interpolate(c1[2], c2[2], p))})`;
  },

  currency: function(n, loc, cur, digits) {
    let localeString = n.toLocaleString(loc, { style: 'currency', currency: cur,
      minimumFractionDigits: digits, maximumFractionDigits: digits })

    localeString = localeString.replace(/SGD/, 'S$');

    if (/DKK|NOK|SEK/.test(localeString)) localeString = localeString.replace(/DKK|NOK|SEK/, '') + 'kr';

    return localeString;
  },

  delayedHandler: function(cb, delay) {
    delay = delay || 250;
    let timeout;

    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(cb, delay);
    };
  },

};
function createSmoothValue(obj, prop, initial, duration, easeIn, easeOut, nowProvider) {
  const _prop = '__' + prop;
  if (easeOut === undefined) easeOut = easeIn;

  Object.defineProperties(obj, {

    [_prop]: {
      value: {
        start: initial,
        current: initial,
        target: initial,
        transitionActive: false,
        transitionStartTime: 0,
        transitionEndTime: 0,
        transitionProgress: 0,
      },
      enumerable: false,
      configurable: true
    },

    [prop]: {
      get: () => {
        if (obj[_prop].transitionActive) {
          const now = nowProvider ? nowProvider.now : performance.now();

          obj[_prop].transitionProgress = obj[_prop].currentEasingFn(Strut.clamp(
            Strut.rangePosition(
              obj[_prop].transitionStartTime,
              obj[_prop].transitionEndTime,
              now
            ), 0, 1
          ));

          obj[_prop].current = Strut.interpolate(
            obj[_prop].start,
            obj[_prop].target,
            obj[_prop].transitionProgress
          );

          if (now >= obj[_prop].transitionEndTime) {
            obj[_prop].current = obj[_prop].target;
            obj[_prop].transitionActive = false;
          }
        }

        return obj[_prop].current;
      },

      set: target => {
        if (target === obj[_prop].target) return;

        if (obj[_prop].current === undefined) {
          obj[_prop].start = target;
          obj[_prop].current = target;
          obj[_prop].target = target;
          if (DEBUG) console.log('Skipping transition on ' + prop);
          return;
        }

        const now = nowProvider ? nowProvider.now : performance.now();

        obj[_prop].start = obj[_prop].current;
        obj[_prop].target = target;
        obj[_prop].transitionStartTime = now;
        obj[_prop].transitionEndTime = now + duration;
        obj[_prop].transitionActive = true;
        obj[_prop].transitionProgress = 0;
        obj[_prop].currentEasingFn = (target > obj[_prop].current) ? easeIn : easeOut;
      },

      configurable: true
    }

  });
}
const HEADER_VIDEO_CONFIG = {
  easeUp: BezierEasing(0.3, 1.5, 0.4, 1.0),
  easeDown: BezierEasing(0.6, 0.0, 0.7, -0.4),
  timeOffset: -19.5,
  dom: {
    videoEl: document.querySelector('.screencast video'),
    playButton: document.querySelector('.screencast .play-button'),
    chatBackground: document.querySelector('.screencast-chat .background'),
    bubble1: document.querySelector('.screencast-chat li:first-child'),
    bubble2: document.querySelector('.screencast-chat li:last-child'),
    link: document.querySelector('.screencast-chat li a'),
  },
  sources: {
    mobile: {
      'video/ogg': '//stripe-images.s3.amazonaws.com/videos/sigma/screencast-mobile.ogv',
      'video/mp4': '//stripe-images.s3.amazonaws.com/videos/sigma/screencast-mobile.mp4',
    },
    full: {
      'video/ogg': '//stripe-images.s3.amazonaws.com/videos/sigma/screencast-full.ogv',
      'video/mp4': '//stripe-images.s3.amazonaws.com/videos/sigma/screencast-full.mp4',
    },
  },
};

HEADER_VIDEO_CONFIG.actors = [
  {
    el: HEADER_VIDEO_CONFIG.dom.chatBackground,
    keyframes: {
      0.000: { scale: 0.5, opacity: 0.0 },
      0.750: { scale: 1.0, opacity: 1.0 },
      4.100: { scale: 1.0, opacity: 1.0 },
      4.700: { scale: 0.2, opacity: 0.0 },
    },
  },
  {
    el: HEADER_VIDEO_CONFIG.dom.bubble1,
    keyframes: {
      0.500: { scale: 0.5, opacity: 0.0 },
      1.000: { scale: 1.0, opacity: 1.0 },
      3.850: { scale: 1.0, opacity: 1.0 },
      4.700: { scale: 0.5, opacity: 0.0 },
    },
  },
  {
    el: HEADER_VIDEO_CONFIG.dom.bubble2,
    keyframes: {
      1.250: { scale: 0.5, opacity: 0.0 },
      1.750: { scale: 1.0, opacity: 1.0 },
      3.950: { scale: 1.0, opacity: 1.0 },
      4.700: { scale: 0.5, opacity: 0.0 },
    },
  },
  {
    el: HEADER_VIDEO_CONFIG.dom.link,
    keyframes: {
      2.500: { scale: 1.1, opacity: 0.0 },
      2.800: { scale: 1.0, opacity: 1.0 },
    },
  },
];



//////////////////////////////////////////////////////////////////////////////////////////



function VideoController(conf) {
  const my = this;

  my.conf = conf;
  my.paused = true;
  my.tickBind = my.tick.bind(my);
  my.mobile = Strut.isMobileViewport;

  const sources = my.mobile ? HEADER_VIDEO_CONFIG.sources.mobile : HEADER_VIDEO_CONFIG.sources.full;
  for (type in sources) {
    HEADER_VIDEO_CONFIG.dom.videoEl.appendChild(
      UTIL.createEl('source', { type, src: sources[type] })
    );
  }

  if (my.mobile) {
    HEADER_VIDEO_CONFIG.dom.playButton.style.display = 'block';

    my.conf.dom.videoEl.addEventListener('click', e => {
      if (my.conf.dom.videoEl.paused) {
        my.conf.dom.videoEl.play();
        HEADER_VIDEO_CONFIG.dom.playButton.style.display = 'none';
      } else {
        my.conf.dom.videoEl.pause();
        HEADER_VIDEO_CONFIG.dom.playButton.style.display = 'block';
      }
    });

  } else {
    HEADER_VIDEO_CONFIG.dom.videoEl.preload = true;
    HEADER_VIDEO_CONFIG.actors.forEach(actor => actor.currentValues = {} );
  }
}



//////////////////////////////////////////////////////////////////////////////////////////



VideoController.prototype.start = function() {
  const my = this;

  if (!my.mobile && my.paused) {
    my.paused = false;
    my.conf.dom.videoEl.play();
    requestAnimationFrame(my.tickBind);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



VideoController.prototype.stop = function() {
  const my = this;

  if (!my.mobile) {
    my.paused = true;
    my.conf.dom.videoEl.pause();
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



VideoController.prototype.tick = function() {
  const my = this;

  my.currentTime = my.conf.dom.videoEl.currentTime + HEADER_VIDEO_CONFIG.timeOffset;

  if (my.currentTime !== my.lastTime) {
    for (let ai = 0; ai < my.conf.actors.length; ai++) {
      const actor = my.conf.actors[ai];

      // Calculate values

      let changes = {};

      if (!actor.keyframeTimes) actor.keyframeTimes = Object.keys(actor.keyframes).map(parseFloat).sort();

      const firstKeyframeTime = actor.keyframeTimes[0];
      const lastKeyframeTime  = actor.keyframeTimes[actor.keyframeTimes.length - 1];

      if (my.currentTime < firstKeyframeTime) {
        changes.scale   = actor.keyframes[firstKeyframeTime].scale;
        changes.opacity = actor.keyframes[firstKeyframeTime].opacity;

      } else if (my.currentTime >= lastKeyframeTime) {
        changes.scale   = actor.keyframes[lastKeyframeTime].scale;
        changes.opacity = actor.keyframes[lastKeyframeTime].opacity;

      } else {
        for (let ti = 0; ti < actor.keyframeTimes.length - 1; ti++) {
          const thisTime = actor.keyframeTimes[ti];
          const nextTime = actor.keyframeTimes[ti + 1];

          if (my.currentTime >= thisTime && my.currentTime < nextTime) {
            const thisKeyframe = actor.keyframes[thisTime];
            const nextKeyframe = actor.keyframes[nextTime];

            let progress = Strut.rangePosition(thisTime, nextTime, my.currentTime);

            if (nextKeyframe.scale > thisKeyframe.scale) progress = my.conf.easeUp(progress);
            else progress = my.conf.easeDown(progress);

            changes.scale   = Strut.interpolate(thisKeyframe.scale, nextKeyframe.scale, progress);
            changes.opacity = Strut.interpolate(thisKeyframe.opacity, nextKeyframe.opacity, progress);
          }
        }
      }

      // Apply values

      if (actor.currentValues.scale !== changes.scale) {
        actor.el.style.transform = `scale(${changes.scale})`;
        actor.currentValues.scale = changes.scale;
      }

      if (actor.currentValues.opacity !== changes.opacity) {
        actor.el.style.opacity = changes.opacity;
        actor.currentValues.opacity = changes.opacity;
      }
    }
  }

  my.lastTime = my.currentTime;

  if (!my.paused) requestAnimationFrame(my.tickBind);
};





const QUERY_DATA = {





businessOperations: [

// What percentage of disputes did we contest?
`
-- This template returns an itemized list of disputed charges for the past 30 days,
-- along with information such as whether evidence has been submitted and the status of the dispute

select
  charges.id as charge_id,
  date_format(disputes.created, '%Y-%m-%d') as dispute_date,
  date_format(charges.created, '%Y-%m-%d') as charge_date,
  charges.card_brand,
  disputes.reason,
  disputes.status,
  disputes.amount/100.00 as dispute_amount,
  disputes.currency,
  disputes.evidence_details_has_evidence as evidence_saved,
  case when disputes.evidence_details_submission_count = 0 then false else true end as evidence_submitted
from disputes
join charges
  on charges.id = disputes.charge_id
where date(charges.created) >= date_add('day', -30, current_date)
order by 2 desc
`,

// What was our charge volume in February?
`
-- This template returns a complete summary of activities for every month with live transactions

-- monthly_balance_transactions is a temporary table that aggregates and pivots different
-- balance_transaction types on a monthly basis for each currency
-- This template returns a monthly summary of your activities, including all payments in the UTC time zone

with monthly_balance_transactions as (
  select
    date_trunc('month', case when type = 'payout' then available_on else created end) as month, -- payouts are considered when they are posted (available_on)
    currency,
    sum(case when type in ('charge', 'payment') then amount else 0 end) as sales,
    sum(case when type in ('payment_refund', 'refund') then amount else 0 end) as refunds,
    sum(case when type = 'adjustment' then amount else 0 end) as adjustments,
    sum(case when type not in ('charge', 'payment', 'payment_refund', 'refund', 'adjustment', 'payout') and type not like '%transfer%' then amount else 0 end) as other,
    sum(case when type <> 'payout' and type not like '%transfer%' then amount else 0 end) as gross_transactions,
    sum(case when type <> 'payout' and type not like '%transfer%' then net else 0 end) as net_transactions,
    sum(case when type = 'payout' or type like '%transfer%' then fee * -1.0 else 0 end) as payout_fees,
    sum(case when type = 'payout' or type like '%transfer%' then amount else 0 end) as gross_payouts,
    sum(case when type = 'payout' or type like '%transfer%' then fee * -1.0 else net end) as monthly_net_activity,
    count_if(type in ('payment', 'charge')) as sales_count,
    count_if(type = 'payout') as payouts_count,
    count(distinct case when type = 'adjustment' then source_id end) as adjustments_count
  from balance_transactions
  group by 1, 2
)

-- Compute the month_end_balance for each month and format output
select
  date_format(month, '%Y-%m') as month,
  currency,
  sales/100.0 as sales,
  refunds/100.0 as refunds,
  adjustments/100.0 as adjustments,
  other/100.0 as other,
  gross_transactions/100.0 as gross_transactions,
  net_transactions/100.0 as net_transactions,
  payout_fees/100.0 as payout_fees,
  gross_payouts/100.0 as gross_payouts,
  monthly_net_activity/100.0 as monthly_net_activity,
  sum(monthly_net_activity + gross_payouts) over(partition by currency order by month)/100.0 as month_end_balance, -- use SUM Window Function
  sales_count,
  payouts_count,
  adjustments_count
from monthly_balance_transactions
where month < date_trunc('month', current_date) -- exclude current, partial month
order by 1 desc, 2
`,

// Which customers have not paid their invoices?
`
-- This template returns all unpaid invoices and relevant customer and plan information
select
  date(invoices.date) as invoice_date,
  invoices.amount_due/100.0 as amount_due,
  invoices.attempt_count,
  invoices.customer_id,
  customers.email,
  plans.name as plan_name
from invoices
join subscriptions
  on invoices.subscription_id = subscriptions.id
join plans -- join subscriptions on plans to get plan name
  on subscriptions.plan_id = plans.id
join customers -- join on customers to get customer email
  on invoices.customer_id = customers.id
where not invoices.paid -- filter out paid and forgiven invoices
  and not invoices.forgiven
order by 2 desc, 1
`,

],





finance: [

// What is our company's daily balance?
`
-- This template returns the balance at the end of every day in the UTC time zone

-- daily_balance_transactions is a temporary table that aggregates and pivots different
-- balance_transaction types on a daily basis for each currency
with daily_balance_transactions as (
  select
    -- payouts are considered when they are posted (available_on)
    date(case when type = 'payout' then available_on else created end) as day,
    currency,
    sum(net) as daily_balance,
    sum(case when type = 'payout' then net else 0 end) as payouts,
    sum(case when type <> 'payout' then net else 0 end) as net_transactions,
    sum(case when type in ('charge', 'payment') then net else 0 end) as payments, -- net = amount - fee
    sum(case when type in ('payment_refund', 'refund', 'payment_failure_refund') then net else 0 end) as refunds,
    sum(case when type = 'transfer' then net else 0 end) as transfers,
    sum(case when type = 'adjustment' and lower(description) like 'chargeback withdrawal%' then net else 0 end) as chargeback_withdrawals,
    sum(case when type = 'adjustment' and lower(description) like 'chargeback reversal%' then net else 0 end) as chargeback_reversals,
    sum(case when type = 'adjustment' and lower(description) not like 'chargeback withdrawal%' and lower(description) not like 'chargeback reversal%' then net else 0 end) as other_adjustments,
    sum(case when type not in ('payout', 'transfer', 'charge', 'payment', 'refund', 'payment_refund', 'adjustment') then net else 0 end) as other_transactions
  from balance_transactions
  group by 1, 2
)

-- Compute the current_balance for each day and format output
select
  day,
  currency,
  -- use SUM Window Function to calc. running total
  sum(daily_balance) over(partition by currency order by day)/100.0 as current_balance,
  payouts/100.0 as payouts,
  net_transactions/100.0 as net_transactions,
  payments/100.0 as payments,
  refunds/100.0 as refunds,
  transfers/100.0 as transfers,
  chargeback_withdrawals/100.0 as chargeback_withdrawals,
  chargeback_reversals/100.0 as chargeback_reversals,
  other_adjustments/100.0 as other_adjustments,
  other_transactions/100.0 as other_transactions
from daily_balance_transactions
order by 1 desc, 2
`,

// Which charges reconcile with our latest bank payout?
`
-- This template returns itemized information for transfers/payouts linked to
-- automatic transfers within the past 30 days

select
  date(transfers.date) as transfer_date,
  transfers.id as transfers_id,
  transfers.amount/100.0 as transfer_amount,
  transfers.status as transfers_status,
  balance_transactions.id as balance_transaction_id,
  balance_transactions.source_id as balance_transaction_source_id,
  balance_transactions.type as balance_transaction_type,
  balance_transactions.currency,
  balance_transactions.amount/100.0 as balance_transaction_amount,
  balance_transactions.net/100.0 as balance_transaction_net,
  charges.statement_descriptor as statement_descriptor,
  disputes.reason as disputes_reason,
  refunds.reason as refund_reason
from transfers
join balance_transactions
  on balance_transactions.automatic_transfer_id = transfers.id
left join charges
  on charges.id = balance_transactions.source_id -- balance_transactions.source_id can be used to join on charges, disputes, and refunds table.
left join disputes
  on disputes.id = balance_transactions.source_id
left join refunds
  on refunds.id = balance_transactions.source_id
where transfers.type = 'bank_account'
  and transfers.date >= date_add('day', -30, current_date)
order by transfers.date desc, transfers.id, balance_transactions.created desc
`,

// How does our cash flow change from month to month?
`
-- This template returns gross processing volume for each currency per month, assuming a local timezone of PT
-- Note: charges can change over time, for example if a charge gets refunded.
-- Always use the balance transactions table if you need to create reports for accounting purposes

-- charges_timezone_conversion is a temporary table that converts timestamp with UTC timezone to 'America/Los_Angeles' timezone
with charges_timezone_conversion as (
  select
    date_trunc('month', created at time zone 'America/Los_Angeles') as month,
    currency,
    amount
  from charges
  where captured -- filter out uncaptured charges
)

-- Compute the monthly gross charges for each month and currency
select
  date_format(month, '%Y-%m') as month,
  currency,
  sum(amount)/100.0 as gross_charges
from charges_timezone_conversion
where month >= date_add('month', -24, date_trunc('month', current_timestamp at time zone 'America/Los_Angeles'))
group by 1, 2
order by 1 desc, 2
`,

// What is our monthly recurring revenue?
`
-- This template returns a basic monthly recurring revenue number as the product of the average subscription revenue per user (ARPU) 
-- and the number of active customers within a given month

-- calendar_days is a temporary table with a row and value for every day for the past 1460 days (2 years)
-- the calendar_days temporary table is used to apply the correct amount to each month for invoices that span across multiple months
with calendar_days as (
  select
    day
  from (
    select
      calendar_days_array
    from (
      -- values creates an anonymous table with column calendar_days_array. It has 1 row with an array of timestamps generated by sequence
      values(sequence(date_add('day', -1460, date_trunc('day', current_date)), date_trunc('day', current_date), interval '1' day))
    ) as t1(calendar_days_array)
  )
  cross join unnest(calendar_days_array) as t1(day) -- CROSS JOIN UNNEST will expand the calendar_days_array into individual rows with column days
),

-- invoice_update is a temporary table that returns the net captured amount for each invoice (this may change over time)
invoice_update as (
  select
    invoices.id,
    invoices.customer_id,
    invoices.period_start,
    invoices.period_end,
    greatest(1, date_diff('day', invoices.period_start, invoices.period_end)) as duration, -- duration will be used to calculate a per-day cost
    invoices.currency,
    invoices.amount_due/100.0 as amount_due,
    (charges.amount - charges.amount_refunded)/100.0 as captured_amount
  from invoices
  join charges
    on invoices.id = charges.invoice_id
  -- join subscriptions -- this filter may be included to remove subscriptions that end during the invoice month
    -- on invoices.subscription_id = subscriptions.id
    -- and (subscriptions.ended_at is null or date_trunc('month', subscriptions.ended_at) > date_trunc('month', invoices.period_end))
  where invoices.subscription_id is not null
    and charges.captured
),

-- monthly_summary is a temporary table that calculates monthly billed_amount, captured_amount, and customer_count
monthly_summary as (
  select
    date_trunc('month', calendar_days.day) as month,
    invoice_update.currency,
    sum(invoice_update.amount_due/invoice_update.duration) as billed_amount,
    sum(invoice_update.captured_amount/invoice_update.duration) as captured_amount,
    count(distinct invoice_update.customer_id) as customer_count
  from invoice_update
  join calendar_days
    on calendar_days.day between invoice_update.period_start and invoice_update.period_end
  group by 1, 2
)

-- Calculate ARPU by dividing aggregated captured_amount by customer_count and format output
select
  date_format(month, '%Y-%m') as month,
  currency,
  cast(billed_amount as decimal(32, 2)) as billed_amount,
  cast(captured_amount as decimal(32, 2)) as captured_amount,
  customer_count,
  cast(captured_amount/customer_count as decimal(32, 2)) as ARPU
from monthly_summary
order by 1 desc, 2
`,

],





dataAnalysis: [

// How many active customers do we have?
`
-- This template returns itemized subscription information for each customer and plan
select
  subscriptions.customer_id as customer_id,
  customers.email as customers_email,
  subscriptions.plan_id as plan_id,
  plans.name as plan_name,
  subscriptions.quantity as quantity,
  case when subscriptions.canceled_at is null and subscriptions.ended_at is null then 'active' else 'inactive' end as state,
  date_format(subscriptions.created, '%Y-%m-%d') as created_date,
  date_format(subscriptions.start, '%Y-%m-%d') as start_date,
  date_format(least(subscriptions.canceled_at, subscriptions.ended_at), '%Y-%m-%d') as end_date
from subscriptions
join plans -- join subscriptions on plans to get plan name
  on subscriptions.plan_id = plans.id
left join customers
  on subscriptions.customer_id = customers.id
order by 2
`,

// Why do customers dispute payments?
`
-- This template returns the number of disputes grouped by reason and dispute status
select
  reason, -- reason given by cardholder for dispute
  status, -- current status of dispute
  count(id) as disputes,
  count_if(evidence_details_submission_count > 0) as disputes_with_evidence_submitted
from disputes
group by 1, 2
order by 3 desc
`,

// What is our ARPU (average revenue per user)?
`
-- This template returns the average subscription revenue per user (ARPU) by month and currency for subscription
-- invoices.  ARPU is calculated by dividing monthly recurring revenue (MRR) by the number of active customers
-- within a given month

-- calendar_days is a temporary table with a row and value for every day for the past 1460 days (2 years)
-- the calendar_days temporary table is used to apply the correct amount to each month for invoices spanning multiple months
with calendar_days as (
  select
    day
  from (
    select
      calendar_days_array
    from (
      -- values creates an anonymous table with column calendar_days_array. It has 1 row with an array of timestamps generated by sequence
      values(sequence(date_add('day', -1460, date_trunc('day', current_date)), date_trunc('day', current_date), interval '1' day))
    ) as t1(calendar_days_array)
  )
  cross join unnest(calendar_days_array) as t1(day) -- CROSS JOIN UNNEST will expand the calendar_days_array into individual rows with column days
),

-- invoice_update is a temporary table that returns the net captured amount for each invoice (this may change over time)
invoice_update as (
  select
    invoices.id,
    invoices.customer_id,
    invoices.period_start,
    invoices.period_end,
    greatest(1, date_diff('day', invoices.period_start, invoices.period_end)) as duration, -- duration will be used to calculate a per-day cost
    invoices.currency,
    (charges.amount - charges.amount_refunded)/100.0 as captured_amount
  from invoices
  join charges
    on invoices.id = charges.invoice_id
  where invoices.subscription_id is not null
    and charges.captured
),

-- monthly_summary is a temporary table that calculates monthly billed_amount, captured_amount, and customer_count
monthly_summary as (
  select
    date_trunc('month', calendar_days.day) as month,
    invoice_update.currency,
    sum(invoice_update.captured_amount/invoice_update.duration) as captured_amount,
    count(distinct invoice_update.customer_id) as customer_count
  from invoice_update
  join calendar_days
    on calendar_days.day between invoice_update.period_start and invoice_update.period_end
  group by 1, 2
)

-- Calculate ARPU by dividing aggregated captured_amount by customer_count and format output
select
  date_format(month, '%Y-%m') as month,
  currency,
  cast(captured_amount as decimal(32, 2)) as captured_amount,
  customer_count,
  cast(captured_amount/customer_count as decimal(32, 2)) as ARPU
from monthly_summary
order by 1 desc, 2
`,

],





productManagement: [

// What are our most popular subscription plans?
`
-- This template returns itemized subscription information for each customer and plan
select
  subscriptions.customer_id as customer_id,
  customers.email as customers_email,
  subscriptions.plan_id as plan_id,
  plans.name as plan_name,
  subscriptions.quantity as quantity,
  case when subscriptions.canceled_at is null and subscriptions.ended_at is null then 'active' else 'inactive' end as state,
  date_format(subscriptions.created, '%Y-%m-%d') as created_date,
  date_format(subscriptions.start, '%Y-%m-%d') as start_date,
  date_format(least(subscriptions.canceled_at, subscriptions.ended_at), '%Y-%m-%d') as end_date
from subscriptions
join plans -- join subscriptions on plans to get plan name
  on subscriptions.plan_id = plans.id
left join customers
  on subscriptions.customer_id = customers.id
order by 2
`,

// How many payments are made with each payment card brand?
`
-- This template returns the number of charges and amounts for each card type, by currency

select
  coalesce(card_brand, 'Non-card or Other') as card_brand,
  currency,
  count(id) as charge_count,
  sum(amount)/100.0 as total_amount
from charges
where captured
group by 1, 2
order by 4 desc
`,

// How much revenue comes from different customer channels?
`
-- This template returns itemized information for charges and associated customer metadata (from charges_metadata)

-- charges_metadata_dictionary is a temporary table that creates a row for every charge_id with a dictionary of associated metadata
with charges_metadata_dictionary as (
  select
    charge_id,
    map_agg(key, value) metadata_dictionary -- MAP_AGG creates a key:value dictionary
  from charges_metadata
  group by 1)

select
  charges.created,
  charges.id,
  charges.customer_id,
  charges.amount/100.0 as amount,
  metadata_dictionary['customer_source'] as customer_source -- 'customer_source' is the key we are accessing and returning the associated value (provided via metadata)
from charges
left join charges_metadata_dictionary
  on charges.id = charges_metadata_dictionary.charge_id
where date_trunc('year', charges.created) = date_trunc('year', current_date)
  and charges.captured
order by charges.created desc
limit 1000
`,

],





};
let SELECTOR_CONFIG = {
  dom: {
    background: document.querySelector('.sigma-header'),
    container: document.querySelector('.sigma-header .examples'),
    canvas: document.querySelector('.sigma-header .tabs-canvas'),
    textsList: document.querySelector('.sigma-header .texts'),
  },
  layout: {
    inactiveFont: '500 17px Camphor, sans-serif',
    activeFont: '600 22px Camphor, sans-serif',
    inactiveColor: [107, 124, 147],
    hovercolor: [255, 255, 255],
    activeColor: '#fff',
    inactiveTextY: 24,
    activeTextY: 26,
    tabPadding: 30,
    activeTabInnerPadding: 20,
    activeTabHeight: 38,
    textTopPadding: 20,
    mobileScale: 0.8,
  },
  transition: {
    duration: 700,
    hoverDuration: 200,
    easing: BezierEasing(0.250, 0.100, 0.150, 1.000),
  },
  colors: {
    businessOperations: [183, 106, 196],
    finance:            [ 36, 180, 126],
    dataAnalysis:       [227, 124,  76],
    productManagement:  [ 50, 151, 211],
  },
};



//////////////////////////////////////////////////////////////////////////////////////////



function Selector() {
  let my = this;

  my.currentCategory = null;

  my.categoriesObj = {};
  my.categoriesArr = [];

  my.firstRun = true;

  // Set up tabs and canvas

  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  my.canvasWidth = 0;

  Object.keys(QUERY_CATEGORIES).forEach(slug => {
    let obj = { slug };

    obj.title = QUERY_CATEGORIES[slug].title.toUpperCase();

    obj.text = QUERY_CATEGORIES[slug].text;
    obj.textEl = UTIL.createEl('p', { className: slug, innerHTML: obj.text });
    SELECTOR_CONFIG.dom.textsList.appendChild(obj.textEl);

    testCtx.font = SELECTOR_CONFIG.layout.inactiveFont;
    obj.inactiveTabWidth = testCtx.measureText(obj.title).width;

    testCtx.font = SELECTOR_CONFIG.layout.activeFont;
    obj.activeTabWidth = testCtx.measureText(obj.title).width;
    my.canvasWidth += obj.activeTabWidth;

    obj.currentX = Infinity;

    createSmoothValue(obj, 'inactiveTabPos', undefined,
      SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

    createSmoothValue(obj, 'activeTabPos', undefined,
      SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

    createSmoothValue(obj, 'hover', 0,
      SELECTOR_CONFIG.transition.hoverDuration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

    my.categoriesObj[slug] = obj;
    my.categoriesArr.push(obj);
  });

  createSmoothValue(my, 'centerOffset', undefined,
    SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

  createSmoothValue(my, 'activeBubbleX', undefined,
    SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

  createSmoothValue(my, 'activeBubbleWidth', undefined,
    SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

  createSmoothValue(my, 'activeTabsOffset', undefined,
    SELECTOR_CONFIG.transition.duration, SELECTOR_CONFIG.transition.easing, undefined, SCENE);

  my.canvasWidth += SELECTOR_CONFIG.layout.tabPadding * my.categoriesArr.length;

  SELECTOR_CONFIG.dom.canvas.style.width = my.canvasWidth + 'px';
  SELECTOR_CONFIG.dom.canvas.style.height = SELECTOR_CONFIG.layout.activeTabHeight + 'px';

  SELECTOR_CONFIG.dom.canvas.width = my.canvasWidth * window.devicePixelRatio;
  SELECTOR_CONFIG.dom.canvas.height = SELECTOR_CONFIG.layout.activeTabHeight * window.devicePixelRatio;

  my.ctx = SELECTOR_CONFIG.dom.canvas.getContext('2d');
  my.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  // Interaction

  SELECTOR_CONFIG.dom.canvas.addEventListener('mousemove', e => {
    let isHovering = false;
    for (let ci = 0; ci < my.categoriesArr.length; ci++) {
      const c = my.categoriesArr[ci];
      if (c.active) continue;
      if (
        e.offsetX > c.currentX - SELECTOR_CONFIG.layout.tabPadding / 2 &&
        e.offsetX < c.currentX + c.inactiveTabWidth + SELECTOR_CONFIG.layout.tabPadding / 2
      ) {
        isHovering = true;
        if (c.hover < 1) {
          c.hover = 1;
          if (!my.hoverChanged) my.requestRender();
          SELECTOR_CONFIG.dom.canvas.style.cursor = 'pointer';
          my.hoverChanged = true;
        }
      } else if (c.hover > 0) {
        c.hover = 0;
        if (!my.hoverChanged) my.requestRender();
        my.hoverChanged = true;
      }
    }
    if (!isHovering) SELECTOR_CONFIG.dom.canvas.style.cursor = 'default';
  });

  SELECTOR_CONFIG.dom.canvas.addEventListener('mouseleave', e => {
    for (let ci = 0; ci < my.categoriesArr.length; ci++) {
      const c = my.categoriesArr[ci];
      if (c.hover > 0) {
        c.hover = 0;
        if (!my.hoverChanged) my.requestRender();
        my.hoverChanged = true;
      }
    }
    SELECTOR_CONFIG.dom.canvas.style.cursor = 'default';
  });

  SELECTOR_CONFIG.dom.canvas.addEventListener('click', e => {
    for (let ci = 0; ci < my.categoriesArr.length; ci++) {
      const c = my.categoriesArr[ci];
      if (
        e.offsetX > c.currentX - SELECTOR_CONFIG.layout.tabPadding / 2 &&
        e.offsetX < c.currentX + c.inactiveTabWidth + SELECTOR_CONFIG.layout.tabPadding / 2
      ) {
        c.hover = 0;
        my.setCategory(c.slug);
        my.scene.scrollToCategory(c.slug);

        if (window.siteAnalyticsUtil && window.siteAnalytics.trackSigmaQueryCategory) {
          window.siteAnalytics.trackSigmaQueryCategory(c.slug);
        }
      }
    }
  });

  // Finish

  my.updateTextHeight();
  window.addEventListener('resize', new UTIL.delayedHandler(my.updateTextHeight.bind(my)) );

  my.renderBind = my.render.bind(my);
  my.testFontChangeBind = my.testFontChange.bind(my);
}



//////////////////////////////////////////////////////////////////////////////////////////



Selector.prototype.updateTextHeight = function() {
  let my = this;

  const height = my.categoriesArr.reduce((acc, c) => Math.max(acc, c.textEl.offsetHeight), 0)
   + SELECTOR_CONFIG.layout.textTopPadding;

  SELECTOR_CONFIG.dom.textsList.style.height = height + 'px';
};



//////////////////////////////////////////////////////////////////////////////////////////



Selector.prototype.testFontChange = function() {
  const my = this;

  if (DEBUG) console.log('Testing for font change');

  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  
  let changed;

  my.categoriesArr.forEach(c => {

    if (changed === undefined || changed === true) {
      testCtx.font = SELECTOR_CONFIG.layout.inactiveFont;
      const inactiveTabWidth = testCtx.measureText(c.title).width;

      testCtx.font = SELECTOR_CONFIG.layout.activeFont;
      const activeTabWidth = testCtx.measureText(c.title).width;

      if (changed === true 
        || inactiveTabWidth !== c.inactiveTabWidth 
        || activeTabWidth !== c.activeTabWidth
      ) {
        changed = true;
        c.inactiveTabWidth = inactiveTabWidth;
        c.activeTabWidth = activeTabWidth;
      }
    }

  });

  if (changed) {
    if (DEBUG) console.warn('Detected font change!');
    my.updateTextHeight();
    my.scene.reRenderTextures();
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Selector.prototype.setCategory = function(newCategoryName) {
  let my = this;

  if (my.currentCategory && newCategoryName == my.currentCategory.slug) return;

  if (DEBUG) console.log('Setting category to ' + newCategoryName);

  if (my.currentCategory) my.currentCategory.active = false;

  const newCategory = my.categoriesObj[newCategoryName];
  newCategory.active = true;

  my.previousCategory = my.currentCategory || newCategory;

  // Calculate tab positions

  my.testFontChange();

  let totalWidth = 0;
  let totalActiveWidth = 0;

  for (let ci = 0; ci < my.categoriesArr.length; ci++) {
    const c = my.categoriesArr[ci];

    if (c.active) {
      my.activeBubbleX = totalWidth;
      my.activeBubbleWidth = c.activeTabWidth + SELECTOR_CONFIG.layout.activeTabInnerPadding * 2;

      totalWidth += SELECTOR_CONFIG.layout.activeTabInnerPadding;
      totalActiveWidth  += SELECTOR_CONFIG.layout.activeTabInnerPadding;

      c.inactiveTabPos = totalWidth;
      c.activeTabPos = totalActiveWidth;
      my.activeTabsOffset = totalWidth - totalActiveWidth;

      totalWidth += c.activeTabWidth + SELECTOR_CONFIG.layout.activeTabInnerPadding;
      totalActiveWidth += c.activeTabWidth + SELECTOR_CONFIG.layout.activeTabInnerPadding * 2;

    } else {
      c.inactiveTabPos = totalWidth;
      c.activeTabPos = totalActiveWidth;

      totalWidth += c.inactiveTabWidth;
      totalActiveWidth += c.activeTabWidth;
    }

    if (ci !== my.categoriesArr.length -1) {
      totalWidth += SELECTOR_CONFIG.layout.tabPadding;
      totalActiveWidth += SELECTOR_CONFIG.layout.tabPadding;
    }
  }

  my.centerOffset = (my.canvasWidth - totalWidth) / 2;

  // Update text

  if (my.currentCategory) my.currentCategory.textEl.classList.remove('active');
  newCategory.textEl.classList.add('active');

  // Center on mobile

  if (Strut.isMobileViewport) {
    const x = (my.canvasWidth / 2)
      - (my.__activeBubbleX.target + my.__activeBubbleWidth.target / 2 + my.__centerOffset.target);
    SELECTOR_CONFIG.dom.canvas.style.transform = `scale(${SELECTOR_CONFIG.layout.mobileScale}) translateX(${x}px)`;
  } else {
    SELECTOR_CONFIG.dom.canvas.style.transform = '';
  }

  // Finish

  if (my.firstRun) {
    requestAnimationFrame(() => SELECTOR_CONFIG.dom.container.classList.add('animate'));
    my.firstRun = false;
  }

  my.currentCategory = newCategory;

  my.requestRender();
};



//////////////////////////////////////////////////////////////////////////////////////////



Selector.prototype.requestRender = function(timestamp) {
  const my = this;

  if (!my.isAnimating) {
    my.isAnimating = true;
    requestAnimationFrame(my.renderBind);
  } else {
    if (DEBUG) console.log('Stopped duplicate rAF');
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Selector.prototype.render = function(timestamp) {
  const my = this;

  my.ctx.clearRect(0, 0, SELECTOR_CONFIG.dom.canvas.width, SELECTOR_CONFIG.dom.canvas.height);

  if (my.lastTick === undefined) my.lastTick = SCENE.now;
  const deltaT = SCENE.now - my.lastTick;

  if (my.lastActiveBubbleX === undefined) my.lastActiveBubbleX = my.activeBubbleX;
  const deltaX = Math.abs(my.activeBubbleX - my.lastActiveBubbleX);

  const velocity = (deltaT > 0) ? deltaX / deltaT : 0;

  // Bubble

  my.ctx.fillStyle = UTIL.rgbInterpolate(
    SELECTOR_CONFIG.colors[my.previousCategory.slug],
    SELECTOR_CONFIG.colors[my.currentCategory.slug],
    my.__activeBubbleX.transitionProgress);

  function drawBubble(spread) {
    const x1 = my.activeBubbleX + my.centerOffset - spread;
    const x2 = x1 + my.activeBubbleWidth + spread * 2;
    const y1 = 0;
    const y2 = SELECTOR_CONFIG.layout.activeTabHeight;
    const r = SELECTOR_CONFIG.layout.activeTabHeight / 2;

    my.ctx.beginPath()
    my.ctx.arc(x1 + r, y1 + r, r, Math.PI * 0.5, Math.PI * 1.5);
    my.ctx.arc(x2 - r, y1 + r, r, Math.PI * 1.5, Math.PI * 0.5);
    my.ctx.fill();
  }

  const mblurSize = (Strut.isMobileViewport) ? 0 : velocity * 20;
  const mblurIter = 5;
  drawBubble(-mblurSize);

  if (mblurSize > 0) {
    for (let mbi = 1; mbi <= mblurIter; mbi++) {
      my.ctx.globalAlpha = 1 - (mbi / mblurIter);
      drawBubble(mblurSize * (mbi / mblurIter - 0.5) * 2);
    }
    my.ctx.globalAlpha = 1;
  }

  // Active tabs text

  my.ctx.font = SELECTOR_CONFIG.layout.activeFont;
  my.ctx.fillStyle = SELECTOR_CONFIG.layout.activeColor;
  my.ctx.globalCompositeOperation = 'source-atop';

  for (let ci = 0; ci < my.categoriesArr.length; ci++) {
    const c = my.categoriesArr[ci];

    my.ctx.fillText(c.title,
      c.activeTabPos + my.centerOffset + my.activeTabsOffset,
      SELECTOR_CONFIG.layout.activeTextY
    );
  }

  // Inactive tabs text

  my.ctx.font = SELECTOR_CONFIG.layout.inactiveFont;
  my.ctx.globalCompositeOperation = 'destination-over';

  for (let ci = 0; ci < my.categoriesArr.length; ci++) {
    const c = my.categoriesArr[ci];
    const x = c.inactiveTabPos + my.centerOffset;

    my.ctx.fillStyle = UTIL.rgbInterpolate(
      SELECTOR_CONFIG.layout.inactiveColor, SELECTOR_CONFIG.layout.hovercolor,
      c.hover);

    my.ctx.fillText(c.title, x, SELECTOR_CONFIG.layout.inactiveTextY );

    c.currentX = x;
  }

  // Check hover status

  if (my.hoverChanged) {
    my.hoverChanged = false;
    for (let ci = 0; ci < my.categoriesArr.length; ci++) {
      if (my.categoriesArr[ci].__hover.transitionActive) my.hoverChanged = true;
    }
  }

  my.lastTick = SCENE.now;
  my.lastActiveBubbleX = my.activeBubbleX;

  if (my.__activeBubbleX.transitionActive || my.hoverChanged) requestAnimationFrame(my.renderBind);
  else my.isAnimating = false;
};



let CARD_CONFIG = {
  object: {
    width: 24,
    height: 14,
    margin: 0,
    inactiveScale: 0.8,
    activeScale: 1.0,
    hoverScale: 1.07,
    hoverZ: 0.5,
    activeZ: 1,
  },
  animation: {
    rotateMax: THREE.Math.degToRad(10),
    translateMax: 1.5,
    rotateSpeed: 0.0001,
    translateSpeed: 0.0001,
    // scrollSpeed: 0.0035,
    hoverDuration: 300,
    activateDuration: 800,
    // easing: BezierEasing(0.250, 0.100, 0.250, 1.000),
    easeIn: BezierEasing(0.5, 1.0, 0.75, 1.0),
    easeOut: BezierEasing(0.1, 0.0, 0.6, 1.0),
  },
  layout: {
    width: 1024,
    height: 600,
    radius: 40,
    margin: 4,
    padding: [86, 144, 75],
    font: '400 80px',
    lineHeight: 120,
    textColor: '#32325d',
    colors: {
      inactive: new THREE.Color(0x525f7f),
      businessOperations: new THREE.Color(0xf6a4eb),
      finance: new THREE.Color(0x74e4a2),
      dataAnalysis: new THREE.Color(0xffa27b),
      productManagement: new THREE.Color(0x68d4f8),
    },
  },
  shadow: {
    width: 512,
    height: 300,
    scale: 1.2,
    near: 2.5,
    far: 6,
    sharp: {
      padding: 60,
      blur: 20,
      fill: 'rgba(0, 0, 0, 0.5)',
      texture: null,
    },
    soft: {
      padding: 60,
      blur: 60,
      fill: 'rgba(0, 0, 0, 0.15)',
      texture: null,
    },
    colors: {
      inactive: new THREE.Color(0x00003b),
      businessOperations: new THREE.Color(0x24004b),
      finance: new THREE.Color(0x004844),
      dataAnalysis: new THREE.Color(0x46001f),
      productManagement: new THREE.Color(0x002345),
    },
  },
  hoverBubble: {
    spacingChar: String.fromCharCode(8202),
    font: '600 130px',
    textColor: 'white',
    fill: 'rgba(24, 45, 73, 0.85)',
    padding: [110, 171],
    height: 256,
    texture: null,
    objectScale: 0.014,
    positionZ: 3,
    positionYOffset: -1,
  },
  zoom: {
    overlay: document.querySelector('.zoom-card-overlay'),
    contentTemplate: document.querySelector('.zoom-card-template'),
    margin: 60,
    marginSm: 30,
    maxWidth: 1060,
    maxHeight: 800,
  }
};

CARD_CONFIG.object.activeWidthDelta = CARD_CONFIG.object.width - CARD_CONFIG.object.width
  * (CARD_CONFIG.object.inactiveScale / CARD_CONFIG.object.activeScale);



//////////////////////////////////////////////////////////////////////////////////////////



function Card(opt) {
  const my = this;
  Object.assign(my, opt);

  my.state = {
    willBeActive: false
  };
  createSmoothValue(my.state, 'hover', 0, CARD_CONFIG.animation.hoverDuration,
    CARD_CONFIG.animation.easeIn, CARD_CONFIG.animation.easeOut, my.scene);
  createSmoothValue(my.state, 'active', 0, CARD_CONFIG.animation.activateDuration,
    CARD_CONFIG.animation.easeIn, CARD_CONFIG.animation.easeOut, my.scene);

  my.seeds = {
    rotate: Math.random() * PERLIN_SIZE,
    translateX: Math.random() * PERLIN_SIZE,
    translateY: Math.random() * PERLIN_SIZE,
  };

  //
  // Card mesh
  //

  const cardGeometry = new THREE.PlaneGeometry(CARD_CONFIG.object.width, CARD_CONFIG.object.height);

  const cardMaterial = new THREE.MeshPhongMaterial({
    map: my.renderCardTexture(),
    color: new THREE.Color().set(CARD_CONFIG.layout.colors.inactive),
    side: THREE.FrontSide,
    transparent: true,
    alphaTest: 0.5
  });

  my.card = new THREE.Mesh(cardGeometry, cardMaterial);
  my.scene.scene.add(my.card);

  my.pushX = 0;
  my.wobbleX = 0;
  my.wobbleY = 0;

  my.rotateQuaternion = new THREE.Quaternion();
  my.hoverQuaternion = new THREE.Quaternion();
  my.hoverMatrix = new THREE.Matrix4();

  //
  // Shadow texture
  //

  function drawShadow(conf) {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_CONFIG.shadow.width;
    canvas.height = CARD_CONFIG.shadow.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = conf.fill;
    ctx.fillRect(conf.padding, conf.padding, canvas.width - conf.padding * 2, canvas.height - conf.padding * 2 );
    StackBlur.canvasRGBA(canvas, 0, 0, canvas.width, canvas.height, conf.blur);

    return UTIL.resizeCanvas(canvas, 128, 128);
  }

  if (!CARD_CONFIG.shadow.sharp.texture) {
    CARD_CONFIG.shadow.sharp.texture = new THREE.Texture(drawShadow(CARD_CONFIG.shadow.sharp));
    CARD_CONFIG.shadow.sharp.texture.needsUpdate = true;

    CARD_CONFIG.shadow.soft.texture = new THREE.Texture(drawShadow(CARD_CONFIG.shadow.soft));
    CARD_CONFIG.shadow.soft.texture.needsUpdate = true;
  }

  //
  // Shadow mesh
  //

  const shadowGeometry = new THREE.PlaneGeometry(CARD_CONFIG.object.width, CARD_CONFIG.object.height);

  const shadowVertexShader = `
varying float vDepth;
varying vec2 vUv;

void main(){
  vDepth = color.r;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
  `;

  const shadowFragmentShader = `
varying float vDepth;
varying vec2 vUv;
uniform sampler2D shadowSharp;
uniform sampler2D shadowSoft;
uniform vec3 shadowColor;

void main(){
  vec4 sharp = texture2D(shadowSharp, vUv);
  vec4 soft = texture2D(shadowSoft, vUv);
  float alpha = mix(sharp[3], soft[3], vDepth);
  // vec3 color = mix(vec3(0.0, 0.0, 0.0), shadowColor, vDepth);
  gl_FragColor = vec4(shadowColor, alpha);
}
  `;

  const shadowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      'shadowColor': { type: 'c', value: CARD_CONFIG.shadow.colors.inactive },
      'shadowSharp': { type: 't', value: CARD_CONFIG.shadow.sharp.texture },
      'shadowSoft': { type: 't', value: CARD_CONFIG.shadow.soft.texture }
    },
    vertexShader: shadowVertexShader,
    fragmentShader: shadowFragmentShader,
    side: THREE.FrontSide,
    transparent: true,
    vertexColors: THREE.VertexColors,
  });

  my.vertexColorMap = Array.from(Array(shadowGeometry.vertices.length)).map(() => []);

  for (let fi = 0; fi < shadowGeometry.faces.length; fi++) {
    const face = shadowGeometry.faces[fi];
    for (let vi = 0; vi < 3; vi++) face.vertexColors[vi] = new THREE.Color();
    my.vertexColorMap[face.a].push({ faceIndex: fi, vertexColorIndex: 0 });
    my.vertexColorMap[face.b].push({ faceIndex: fi, vertexColorIndex: 1 });
    my.vertexColorMap[face.c].push({ faceIndex: fi, vertexColorIndex: 2 });
  }

  my.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  my.scene.scene.add(my.shadow);

  my.shadowOrigin = SCENE_CONFIG.shadow.origin.clone();
  my.shadowRay = new THREE.Ray();

  //
  // Hover bubble texture
  //

  if (!CARD_CONFIG.hoverBubble.texture) {
    const bubbleCanvas = document.createElement('canvas');
    const bubbleCtx = bubbleCanvas.getContext('2d');

    // CARD_CONFIG.hoverBubble.text = QUERY_HOVER_TEXT.toUpperCase().split('').join(CARD_CONFIG.hoverBubble.spacingChar);
    CARD_CONFIG.hoverBubble.text = QUERY_HOVER_TEXT.toUpperCase();
    bubbleCtx.font = CARD_CONFIG.hoverBubble.font + ' ' + my.fontFamily;
    const width = bubbleCtx.measureText(CARD_CONFIG.hoverBubble.text).width;

    bubbleCanvas.width = width + CARD_CONFIG.hoverBubble.padding[0] * 2;
    bubbleCanvas.height = CARD_CONFIG.hoverBubble.height;

    bubbleCtx.font = CARD_CONFIG.hoverBubble.font + ' ' + my.fontFamily;
    bubbleCtx.fillStyle = CARD_CONFIG.hoverBubble.fill;
    UTIL.drawRoundRect(bubbleCtx, 2, 2, bubbleCanvas.width - 4, bubbleCanvas.height - 4, (bubbleCanvas.height - 4) / 2);
    bubbleCtx.fill();

    bubbleCtx.fillStyle = CARD_CONFIG.hoverBubble.textColor;
    bubbleCtx.fillText(CARD_CONFIG.hoverBubble.text,
      CARD_CONFIG.hoverBubble.padding[0], CARD_CONFIG.hoverBubble.padding[1]);

    CARD_CONFIG.hoverBubble.texture = new THREE.Texture(UTIL.resizeCanvas(bubbleCanvas, 512, 256));
    CARD_CONFIG.hoverBubble.texture.minFilter = THREE.LinearMipMapNearestFilter;
    CARD_CONFIG.hoverBubble.texture.anisotropy = my.scene.maxAnisotropy;
    CARD_CONFIG.hoverBubble.texture.needsUpdate = true;

    CARD_CONFIG.hoverBubble.objectWidth = bubbleCanvas.width * CARD_CONFIG.hoverBubble.objectScale;
    CARD_CONFIG.hoverBubble.objectHeight = bubbleCanvas.height * CARD_CONFIG.hoverBubble.objectScale;
  }

  //
  // Hover bubble object
  //

  const bubbleGeometry = new THREE.PlaneGeometry(CARD_CONFIG.hoverBubble.objectWidth,
    CARD_CONFIG.hoverBubble.objectHeight);

  const bubbleMaterial = new THREE.MeshBasicMaterial({
    map: CARD_CONFIG.hoverBubble.texture,
    side: THREE.FrontSide,
    transparent: true,
  });

  my.bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
  my.bubble.visible = false;
  my.scene.scene.add(my.bubble);
}



//////////////////////////////////////////////////////////////////////////////////////////



Card.prototype.renderCardTexture = function() {
  const my = this;

  if (!my.textureCanvas) {
    my.textureCanvas = document.createElement('canvas');
    my.textureCanvas.width = CARD_CONFIG.layout.width;
    my.textureCanvas.height = CARD_CONFIG.layout.height;
  }

  const textureCtx = my.textureCanvas.getContext('2d');
  UTIL.drawRoundRect(textureCtx,
    CARD_CONFIG.layout.margin,
    CARD_CONFIG.layout.margin,
    my.textureCanvas.width - CARD_CONFIG.layout.margin * 2,
    my.textureCanvas.height - CARD_CONFIG.layout.margin * 2,
    CARD_CONFIG.layout.radius
  );
  textureCtx.fillStyle = 'white';
  textureCtx.fill();

  my.fontFamily = getComputedStyle(document.body).getPropertyValue('font-family');

  textureCtx.font = CARD_CONFIG.layout.font + ' ' + my.fontFamily;
  textureCtx.fillStyle = CARD_CONFIG.layout.textColor;
  UTIL.wrapText(textureCtx, my.text, CARD_CONFIG.layout);

  const cardTexture = new THREE.Texture(UTIL.resizeCanvas(my.textureCanvas, 512, 512));
  cardTexture.minFilter = THREE.LinearMipMapNearestFilter;
  cardTexture.anisotropy = my.scene.maxAnisotropy;
  cardTexture.needsUpdate = true;

  return cardTexture;
};



//////////////////////////////////////////////////////////////////////////////////////////



Card.prototype.reRenderCardTexture = function() {
  const my = this;

  if (DEBUG) console.log('Re-rendering', my.text);

  my.card.material.map = my.renderCardTexture();
  my.card.material.needsUpdate = true;
};



//////////////////////////////////////////////////////////////////////////////////////////



Card.prototype.tick = function() {
  const my = this;

  if (!my.state.willBeActive && my.category == my.scene.activeCategory) {
    my.state.willBeActive = true;
    my.state.active = 1;
  } else if (my.state.willBeActive && my.category != my.scene.activeCategory) {
    my.state.willBeActive = false;
    my.state.active = 0;
  }

  //
  // Position
  //

  // Lay out cards in a row
  const layoutX = (CARD_CONFIG.object.width + CARD_CONFIG.object.margin) * my.index;

  if (my.scene.recalc) {
    // Push from other larger cards
    my.pushX = 0;
    for (let ci = 0; ci < my.scene.cards.length; ci++) {
      const c = my.scene.cards[ci];
      if (c.index < my.index) my.pushX = my.pushX + c.state.active * CARD_CONFIG.object.activeWidthDelta;
    }
  }

  // Center larger active cards
  // THIS IS A VAR BECAUSE https://bugs.chromium.org/p/v8/issues/detail?id=5666 //
  var selfOffsetX = my.state.active * CARD_CONFIG.object.activeWidthDelta / 2;

  if (my.scene.recalc) {
    // Perlin noise wobble
    // SAME HERE //
    my.wobbleX = noise(my.seeds.translateX + my.scene.now * CARD_CONFIG.animation.translateSpeed)
      * CARD_CONFIG.animation.translateMax * 2 - CARD_CONFIG.animation.translateMax;
  }

  // X position without scroll
  my.staticX = layoutX + my.pushX + selfOffsetX + my.wobbleX;

  // Final X position on screen
  my.absoluteX = my.staticX + my.scene.cardOffset + my.scene.absoluteScrollOffset;

  //
  // Move card to the other end it's off-screen
  //

  if (my.absoluteX < my.scene.cardWrapLeft) {
    my.index = my.index + my.scene.cards.length;
    my.scene.cardOffset = my.scene.cardOffset + selfOffsetX * 2;

    // console.log(my.scene.cards.map(c => c.index), my.scene.cardOffset);

  } else if (my.absoluteX > my.scene.cardWrapRight) {
    my.index = my.index - my.scene.cards.length;
    my.scene.cardOffset = my.scene.cardOffset - selfOffsetX * 2;

    // console.log(my.scene.cards.map(c => c.index), my.scene.cardOffset);
  }


  //
  // Only render if visible
  //

  if (
    my.absoluteX < -my.scene.visibleWidthHalf - CARD_CONFIG.object.width ||
    my.absoluteX > my.scene.visibleWidthHalf + CARD_CONFIG.object.width
  ) {
    my.card.visible = false;
    my.shadow.visible = false;
    my.bubble.visible = false;

  } else {
    my.card.visible = true;
    my.shadow.visible = true;

    if (my.scene.recalc) {
      // Y Wobble
      my.wobbleY = noise(my.seeds.translateY + my.scene.now * CARD_CONFIG.animation.translateSpeed)
      * CARD_CONFIG.animation.translateMax * 4 - CARD_CONFIG.animation.translateMax * 2;
    }

    // Z pos based on state
    const translateZ = my.state.hover * CARD_CONFIG.object.hoverZ
      + my.state.active * CARD_CONFIG.object.activeZ;

    my.card.position.set(my.absoluteX, my.wobbleY, translateZ);
    my.shadow.position.set(my.absoluteX, my.wobbleY, 0);
    my.bubble.position.set(my.absoluteX, my.wobbleY + CARD_CONFIG.hoverBubble.positionYOffset * (1 - my.state.hover), CARD_CONFIG.hoverBubble.positionZ);

    //
    // Rotation
    //


    if (my.scene.recalc) {
      const angle = noise(my.seeds.rotate + my.scene.now * CARD_CONFIG.animation.rotateSpeed)
        * Math.PI * 2 + my.seeds.rotate;

      const rotateX = Math.cos(angle);
      const rotateY = Math.sin(angle);
      const rotateAxis = new THREE.Vector3(rotateX, rotateY, 0);
      const rotateEffect = 1 - my.state.hover;

      my.rotateQuaternion.setFromAxisAngle(rotateAxis, CARD_CONFIG.animation.rotateMax);
    }

    if (my.state.hover) {
      my.hoverMatrix.lookAt(SCENE_CONFIG.hoverLookAtTarget, my.card.position, my.card.up);
      my.hoverQuaternion.setFromRotationMatrix(my.hoverMatrix);
      my.rotateQuaternion.slerp(my.hoverQuaternion, my.state.hover);
    }

    my.card.quaternion.copy(my.rotateQuaternion);

    //
    // Scale
    //

    if (my.scene.recalc) {
      const scale = THREE.Math.lerp(CARD_CONFIG.object.inactiveScale, CARD_CONFIG.object.activeScale, my.state.active)
        * THREE.Math.lerp(1.0, CARD_CONFIG.object.hoverScale, my.state.hover);

      my.card.scale.set(scale, scale, 1.0);
    }

    //
    // Color
    //

    if (my.scene.recalc) {
      const color = my.state.active
        ? CARD_CONFIG.layout.colors.inactive.clone().lerp(CARD_CONFIG.layout.colors[my.category], my.state.active)
        : CARD_CONFIG.layout.colors.inactive;

      my.card.material.color.set(color);

      const shadowColor = my.state.active
        ? CARD_CONFIG.shadow.colors.inactive.clone().lerp(CARD_CONFIG.shadow.colors[my.category], my.state.active)
        : CARD_CONFIG.shadow.colors.inactive;

      my.shadow.material.uniforms.shadowColor.value = shadowColor;
    }

    //
    // Shadow
    //

    if (my.scene.recalc) {
      my.card.updateMatrixWorld();
      my.shadow.updateMatrixWorld();

      for (let vi = 0; vi < my.card.geometry.vertices.length; vi++) {
        const cardVertex = my.card.geometry.vertices[vi].clone();
        my.card.localToWorld(cardVertex);

        my.shadowOrigin.x = cardVertex.x;

        const shadowDirection = cardVertex.clone().sub(my.shadowOrigin).normalize();
        my.shadowRay.set(my.shadowOrigin, shadowDirection);

        const shadowVertex = my.shadowRay.intersectPlane(SCENE_CONFIG.shadow.plane);

        const shadowDepth = cardVertex.distanceTo(shadowVertex);
        const vertexColor = THREE.Math.clamp(THREE.Math.mapLinear(
          shadowDepth, CARD_CONFIG.shadow.near, CARD_CONFIG.shadow.far, 0, 1
        ), 0, 1);

        for (let vci = 0; vci < my.vertexColorMap[vi].length; vci++) {
          const vc = my.vertexColorMap[vi][vci];
          my.shadow.geometry.faces[vc.faceIndex].vertexColors[vc.vertexColorIndex].r = vertexColor;
        }

        my.shadow.worldToLocal(shadowVertex);
        shadowVertex.multiplyScalar(CARD_CONFIG.shadow.scale);

        my.shadow.geometry.vertices[vi].copy(shadowVertex);
      }

      my.shadow.geometry.colorsNeedUpdate = true;
      my.shadow.geometry.verticesNeedUpdate = true;
    }

    //
    // Hover bubble
    //

    if (my.state.hover > 0) {
      my.bubble.visible = true;
      my.bubble.material.opacity = my.state.hover;

    } else {
      my.bubble.visible = false;
    }

    //
    // Update current category if card is in the center
    //

    if (my.absoluteX - CARD_CONFIG.object.width / 2 <= 0 && my.absoluteX + CARD_CONFIG.object.width / 2 > 0) {
      my.scene.setActiveCategory(my.category);
    }

  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Card.prototype.open = function() {
  const my = this;
  if (my.scene.openCard) return;

  // Container

  my.zoomEl = UTIL.createEl('div', { className: 'zoom-card' });
  const sceneRect = my.scene.renderer.domElement.getBoundingClientRect();

  const scale = my.card.scale.x / my.scene.screenToWorld * 1.015;
  const width = CARD_CONFIG.object.width * scale;
  const height = CARD_CONFIG.object.height * scale;

  const center = my.card.position.clone().project(my.scene.camera);
  center.x = (center.x + 1) / 2 * sceneRect.width + sceneRect.left;
  center.y = -(center.y - 1) / 2 * sceneRect.height + sceneRect.top;

  const translateX = center.x - width / 2;
  const translateY = center.y - height / 2;

  my.zoomEl.style.transform = `translate(${center.x}px, ${center.y}px)`;

  // Canvas

  const canvas = UTIL.createEl('canvas', {
    width: CARD_CONFIG.layout.width,
    height: CARD_CONFIG.layout.height,
  });

  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.style.left = (width / -2) + 'px';
  canvas.style.top = (height / -2) + 'px';

  const ctx = canvas.getContext('2d');
  ctx.drawImage(my.textureCanvas, 0, 0);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#' + my.card.material.color.getHexString();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  my.zoomEl.appendChild(canvas);

  // Backside

  const margin = Strut.isMobileViewport ? CARD_CONFIG.zoom.marginSm : CARD_CONFIG.zoom.margin;
  const width2 = Math.min(document.body.clientWidth - margin * 2, CARD_CONFIG.zoom.maxWidth);
  const height2 = Math.min(window.innerHeight - margin * 2, CARD_CONFIG.zoom.maxHeight);
  const scaleDown = width / width2;

  my.zoomBackside = UTIL.createEl('div', { className: 'backside' });

  my.zoomBackside.style.width = width2 + 'px';
  my.zoomBackside.style.height = height2 + 'px';
  my.zoomBackside.style.left = (width2 / -2) + 'px';
  my.zoomBackside.style.top = (height2 / -2) + 'px';
  my.zoomBackside.style.transform = `scale(${scaleDown}) rotateY(180deg)`;

  // Content

  const content = CARD_CONFIG.zoom.contentTemplate.cloneNode(true);
  content.className = 'content ' + my.category;

  const lineNums = Array(my.query.split('\n').length).fill().map((x, i) => i+1).join('<br/>');

  content.querySelector('.category').innerHTML = QUERY_CATEGORIES[my.category].title;
  content.querySelector('.title').innerHTML = my.text.replace('- ', '');
  content.querySelector('.query').innerHTML = Prism.highlight(my.query, Prism.languages.sql);
  content.querySelector('.line-nums').innerHTML = lineNums;

  const codeEl = content.querySelector('.hidden-code');
  codeEl.innerHTML = my.query;

  /*
  content.querySelector('.scroll-area').addEventListener('mousedown', e => {
    codeEl.select();
    if (document.execCommand('copy')) content.classList.add('copied');
  });
  */

  content.querySelector('.scroll-area').addEventListener('wheel', UTIL.preventWheelBubbles);

  my.zoomBackside.appendChild(content);
  my.zoomEl.appendChild(my.zoomBackside);

  // Append & animate

  my.state.hover = 0;
  my.scene.pauseScroll();
  my.scene.openCard = my;
  my.canClose = false;

  CARD_CONFIG.zoom.overlay.style.display = 'block';
  CARD_CONFIG.zoom.overlay.appendChild(my.zoomEl);

  requestAnimationFrame(() => {
    CARD_CONFIG.zoom.overlay.classList.add('visible');

    const scaleUp = width2 / width;
    const windowCenter = { 
      x: Math.round(document.body.clientWidth / 2), 
      y: Math.round(window.innerHeight / 2)
    };
    const rotation = windowCenter.x > center.x ? -180 : 180;

    requestAnimationFrame(() => {
      my.zoomEl.style.transform = `translate(${windowCenter.x}px, ${windowCenter.y}px)
        rotateY(${rotation}deg) scale(${scaleUp})`;

      my.zoomEl.addEventListener('transitionend', e => my.canClose = true);
    });
  });
};



//////////////////////////////////////////////////////////////////////////////////////////



Card.prototype.close = function() {
  const my = this;
  if (!my.canClose) return;

  CARD_CONFIG.zoom.overlay.classList.remove('visible');

  my.zoomBackside.style.opacity = 0;

  my.zoomEl.style.transform += ' translateY(50px)';
  my.zoomEl.addEventListener('transitionend', e => {
    CARD_CONFIG.zoom.overlay.removeChild(my.zoomEl);
    CARD_CONFIG.zoom.overlay.style.display = 'none';
    my.scene.openCard = null;
  });

  my.scene.start();
};


let SCENE_CONFIG = {
  dom: {
    container: document.querySelector('.sigma-header .examples'),
    canvas: document.querySelector('.cards-canvas'),
  },
  height: 240,
  camera: {
    fov: 12,
    position: new THREE.Vector3(0, -3, 125),
  },
  shadow: {
    origin: new THREE.Vector3(0, 26, 40),
    plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 4),
  },
  ambient: {
    intensity: 0.4,
  },
  light: {
    position: new THREE.Vector3(0, 8, 20),
    intensity: 0.7
  },
  hoverLookAtTarget: new THREE.Vector3(0, 0, 700),
  autoScrollSpeed: 0.0035,
  scrollToCategoryAnimation: {
    duration: 800,
    easing: BezierEasing(0.250, 0.100, 0.250, 1.000),
  },
  manualScroll: {
    multiplier: 2,
    friction: 0.88,
    wheelFactor: 0.66,
  },
  recalcInterval: 2,
};



//////////////////////////////////////////////////////////////////////////////////////////



function Scene() {
  let my = this;

  my.height = SCENE_CONFIG.height;

  my.now = 0;
  my.lastTick = 0;
  my.paused = true;
  my.firstRun = true;
  my.recalcFrame = 0;

  my.autoScrollDirection = -1;
  my.autoScrollOffset = 0;
  my.manualScrollMomentum = 0;

  my.canvasRect = { left: Infinity, top: Infinity };

  // Set up scene

  my.scene = new THREE.Scene();

  my.camera = new THREE.PerspectiveCamera(SCENE_CONFIG.camera.fov, my.width / my.height);
  my.camera.position.copy(SCENE_CONFIG.camera.position);

  my.renderer = new THREE.WebGLRenderer({ canvas: SCENE_CONFIG.dom.canvas, alpha: true });

  my.renderer.context.getShaderInfoLog = function() { return ''; };

  my.maxAnisotropy = my.renderer.getMaxAnisotropy();

  // new THREE.OrbitControls( my.camera, my.renderer.domElement );

  // Lighting

  my.lights = {};

  my.lights.ambient = new THREE.AmbientLight(0xFFFFFF, SCENE_CONFIG.ambient.intensity);
  my.scene.add(my.lights.ambient);

  my.lights.directional = new THREE.DirectionalLight(0xFFFFFF, SCENE_CONFIG.light.intensity);
  my.lights.directional.position.copy(SCENE_CONFIG.light.position);
  my.scene.add(my.lights.directional)

  // Add cards

  my.cardOffset = 0;
  my.activeCategory = '';
  my.manualScrollOffset = 0;

  createSmoothValue(my, 'smoothScrollOffset', 0,
    SCENE_CONFIG.scrollToCategoryAnimation.duration,
    SCENE_CONFIG.scrollToCategoryAnimation.easing,
    undefined, my);

  my.cards = [];
  let cardIndex = 0;
  for (category in QUERY_EXAMPLES) {
    QUERY_EXAMPLES[category].forEach((text, i) => {
      const query = (function(){
        if (QUERY_DATA[category] && QUERY_DATA[category][i]) {
          return QUERY_DATA[category][i].trim();
        } else {
          if (DEBUG) console.warn('QUERY_DATA is missing', text);
          return '';
        }
      })();
      my.cards.push(new Card({ text, category, query, scene: my, index: cardIndex }));
      cardIndex++;
    });
  };

  // Interaction

  my.hasScrolled = false;
  my.scrollDistance = 0;
  my.raycaster = new THREE.Raycaster();
  my.cursorNDC = new THREE.Vector2(); // Normalized device coordinates
  my.lastDragX = null;

  function startDrag(p) {
    if (!my.openCard) {
      my.dragging = true;
      my.hasScrolled = false;
      my.scrollDistance = 0;
      my.lastDragX = p.x;
      my.manualScrollMomentum = 0;
      my.manualScrollMomentumSamples = [{ x: p.x, time: my.now }];
    }
  }

  function dragMove(p) {
    if (my.dragging && !my.openCard) {
      my.hasScrolled = true;

      const deltaX = p.x - my.lastDragX;
      my.manualScrollOffset += deltaX * my.screenToWorld;
      my.lastDragX = p.x;
      my.scrollDistance += deltaX;

      // Sample scroll movement over the last 100ms
      my.manualScrollMomentumSamples.push({ x: p.x, time: my.now });
      my.manualScrollMomentumSamples = my.manualScrollMomentumSamples.filter(s => s.time > my.now - 100);
    }
  }

  function stopDrag() {
    if (my.hasScrolled && my.manualScrollMomentumSamples.length) {
      const firstSample = my.manualScrollMomentumSamples[0];
      const lastSample = my.manualScrollMomentumSamples[my.manualScrollMomentumSamples.length - 1];

      const deltaX = lastSample.x - firstSample.x;
      const deltaT = lastSample.time - firstSample.time;

      const velocity = deltaX / deltaT * SCENE_CONFIG.manualScroll.multiplier;
      my.autoScrollDirection = Math.sign(velocity) || 1;
      my.manualScrollMomentum = Math.abs(velocity);
    }
    my.dragging = false;
    my.hasScrolled = false;
  }

  function checkIntersections(p, callback) {
    my.cursorNDC.x = ( p.x / my.width ) * 2 - 1;
    my.cursorNDC.y = - ( p.y / my.height ) * 2 + 1;

    if (my.cursorNDC.x > -1 && my.cursorNDC.x < 1 && my.cursorNDC.y > -1 && my.cursorNDC.y < 1) {
      my.raycaster.setFromCamera(my.cursorNDC, my.camera);
      const intersects = my.raycaster.intersectObjects(my.cards.map(c => c.card));
      callback(intersects);
    } else {
      callback([]);
    }
  }

  function checkForHover(p) {
    if (!my.openCard) {
      checkIntersections(p, intersects => {
        for (let ci = 0; ci < my.cards.length; ci++) {
          const c = my.cards[ci];
          if (intersects.length > 0 && intersects[0].object.uuid === c.card.uuid) {
            c.state.hover = 1;
          } else {
            c.state.hover = 0;
          }
        }
      });
    }
  }

  function checkForClick(p) {
    if (!my.openCard && Math.abs(my.scrollDistance) < 3) {
      checkIntersections(p, intersects => {
        if (intersects.length > 0) {
          const activeCard = my.cards.find(c => c.card.uuid === intersects[0].object.uuid);
          activeCard.open();

          if (window.siteAnalyticsUtil && window.siteAnalytics.trackSigmaQueryExample) {
            window.siteAnalytics.trackSigmaQueryExample(activeCard.index);
          }
        }
      });
    }
  }

  function relativePos(p) {
    p.x -= my.canvasRect.left;
    p.y -= my.canvasRect.top;
    return p;
  }

  // Event listeners

  UTIL.addNormalizedListener(my.renderer.domElement, 'enter', (e, p) => {
    my.updateRect();
  });

  UTIL.addNormalizedListener(my.renderer.domElement, 'down', (e, p) => {
    e.preventDefault();
    my.updateRect();
    startDrag(relativePos(p));
  });

  UTIL.addNormalizedListener(document.body, 'move', (e, p) => {
    p = relativePos(p);
    if (p.canHover) checkForHover(p);
    if (my.dragging) {
      e.preventDefault();
      dragMove(p);
    }
  });

  UTIL.addNormalizedListener(document.body, 'up', (e, p) => {
    checkForClick(relativePos(p));
    stopDrag();
  });

  document.addEventListener('mouseleave', (e, p) => {
    stopDrag();
  });

  my.renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();

    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
      my.autoScrollDirection = Math.sign(-e.deltaX) || 1;
      my.manualScrollOffset -= e.deltaX * my.screenToWorld * SCENE_CONFIG.manualScroll.wheelFactor;
    } else {
      document.body.scrollTop += e.deltaY;
    }

    checkForHover(e);
  });

  CARD_CONFIG.zoom.overlay.addEventListener('click', e => {
    if (e.target === CARD_CONFIG.zoom.overlay && my.openCard) my.openCard.close();
  });

  CARD_CONFIG.zoom.overlay.addEventListener('wheel', e => {
    e.preventDefault();
  });

  document.addEventListener('keyup', e => {
    // Close on ESC
    if (e.keyCode == 27 && my.openCard) my.openCard.close();
  });

  // Finish

  my.updateSize();
  window.addEventListener('resize', new UTIL.delayedHandler(my.updateSize.bind(my)) );
  window.addEventListener('scroll', my.updateRect.bind(my));
  window.addEventListener('load', my.updateSize.bind(my));

  my.renderBind = my.render.bind(my);
  requestAnimationFrame(my.renderBind);
}



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.updateSize = function() {
  const my = this;

  my.width = window.innerWidth;
  my.renderer.setSize(my.width, my.height);

  let ratio = window.devicePixelRatio;
  if (/Safari/.test(navigator.userAgent) && !(/Chrome/.test(navigator.userAgent)) && my.width > 1700) {
    ratio = Math.min(window.devicePixelRatio, 1.5);
  }
  my.renderer.setPixelRatio(ratio);

  my.camera.aspect = my.width / my.height;
  my.camera.updateProjectionMatrix();

  my.visibleWidthHalf = Math.tan( my.camera.fov * Math.PI / 360 ) * my.camera.position.z * my.camera.aspect;
  my.screenToWorld = (my.visibleWidthHalf * 2) / my.width;

  my.cardWrapLeft = -my.visibleWidthHalf - CARD_CONFIG.object.width * 2;
  my.cardWrapRight = -my.visibleWidthHalf + CARD_CONFIG.object.width * (my.cards.length - 1);

  my.updateRect();
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.updateRect = function() {
  const my = this;
  my.canvasRect = my.renderer.domElement.getBoundingClientRect();
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.render = function(timestamp) {
  const my = this;

  my.now = timestamp;
  const delta = my.now - my.lastTick;

  my.recalcFrame = (my.recalcFrame + 1) % SCENE_CONFIG.recalcInterval;
  my.recalc = (my.recalcFrame === 0);

  // Scroll pos

  if (my.manualScrollMomentum > 0) {
    my.manualScrollMomentum = Math.max(
      my.manualScrollMomentum * Math.pow(SCENE_CONFIG.manualScroll.friction, delta / 1000 * 60)
        - 0.001 * (delta / 1000 * 60),
    0);
    my.autoScrollOffset += my.manualScrollMomentum * my.autoScrollDirection;
  }

  if (!my.dragging && !my.scrollPaused) my.autoScrollOffset += delta * SCENE_CONFIG.autoScrollSpeed * my.autoScrollDirection;

  my.absoluteScrollOffset = my.autoScrollOffset + my.smoothScrollOffset + my.manualScrollOffset;

  // Render

  for (let ci = 0; ci < my.cards.length; ci++) my.cards[ci].tick();

  if (!my.firstRun) {
    my.renderer.render(my.scene, my.camera);
  } else {
    // Delay first render so all the positioning logic kicks in
    requestAnimationFrame(my.renderBind);
    requestAnimationFrame(() => SCENE_CONFIG.dom.container.classList.add('loaded'));
    my.firstRun = false;
  }

  if (!my.paused) requestAnimationFrame(my.renderBind);

  my.lastTick = my.now;
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.reRenderTextures = function() {
  const my = this;

  for (let ci = 0; ci < my.cards.length; ci++) my.cards[ci].reRenderCardTexture();
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.setActiveCategory = function(newCategoryName) {
  const my = this;

  my.activeCategory = newCategoryName;
  if (!my.__smoothScrollOffset.transitionActive) my.selector.setCategory(my.activeCategory);
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.scrollToCategory = function(newCategoryName) {
  const my = this;

  if (newCategoryName == my.activeCategory) return;

  let firstCardPos, lastCardPos;
  for (let ci = 0; ci < my.cards.length; ci++) {
    const c = my.cards[ci];
    if (c.category === newCategoryName) {
      if (firstCardPos === undefined) firstCardPos = c.absoluteX;
      else lastCardPos = c.absoluteX;
    }
  }

  if (DEBUG) console.log('First card:', firstCardPos, "Last card:", lastCardPos);

  if (Math.abs(firstCardPos) < Math.abs(lastCardPos)) {
    // Scroll forward
    my.smoothScrollOffset -= firstCardPos;
    my.autoScrollDirection = Math.sign(-firstCardPos);
  } else {
    // Scroll backward
    my.smoothScrollOffset -= lastCardPos;
    my.autoScrollDirection = Math.sign(-lastCardPos);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.stop = function() {
  const my = this;
  my.paused = true;
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.start = function() {
  const my = this;

  my.scrollPaused = false;

  if (my.paused) {
    my.paused = false;
    requestAnimationFrame(my.renderBind);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Scene.prototype.pauseScroll = function() {
  const my = this;
  my.scrollPaused = true;
};



const IDE_CONFIG = {
  dom: {
    container: document.querySelector('.ide-animation'),
    codeBox: document.querySelector('.ide-animation pre'),
    popups: document.querySelector('.ide-animation .popups'),
  },
  layout: {
    paddingTop: 20,
    paddingLeft: 60,
    charWidth: 11,
    lineHeight: 29,
  },
  animation: {
    charDelay: 100,
    stepDelay: 1000,
    endDelay: 2000,
    deleteDelay: 20,
  },
  code:
`*select*
  id,
  amount,
  currency,
  source_id
*from* balance_transactions`,
  steps: [
    {
      // select / id
      chars: 8,
      popups: {
        7: 0, // id
      },
    },
    {
      // amount
      chars: 7,
      popups: {
        3: 1, // am
      },
    },
    {
      // currency
      chars: 9,
      popups: {
        3: 2, // cu
        4: 3, // cur
        7: 4, // currenc
      },
    },
    {
      // source_id
      chars: 10,
      popups: {
        3: 5, // so
        8: 6, // source_
        9: 7, // source_i
      },
    },
    {
      // from balance_transactions
      chars: 25,
      popups: {
        6: 8, // from b
      },
    },
  ],
};



//////////////////////////////////////////////////////////////////////////////////////////



function IDEAnimation() {
  const my = this;

  my.paused = true;
  my.tickBind = my.tick.bind(my);

  my.nextStep = 0;
  my.nextChar = 0;
  my.stepChar = 0;

  my.popups = Strut.queryArray('ul', IDE_CONFIG.dom.popups);

  my.popups.forEach(popup => {
    const x = parseInt(popup.getAttribute('data-x'));
    const y = parseInt(popup.getAttribute('data-y'));
    popup.style.transform = `translate(${
      IDE_CONFIG.layout.paddingLeft + x * IDE_CONFIG.layout.charWidth
    }px, ${
      IDE_CONFIG.layout.paddingTop + y * IDE_CONFIG.layout.lineHeight
    }px)`;
  });

  // Set up code

  my.codeChars = [];

  let bold = false;
  let x = 0;
  let y = 0;

  for (let ci = 0; ci < IDE_CONFIG.code.length; ci++) {
    const char = IDE_CONFIG.code[ci];

    switch (char) {
      case '*':
        bold = !bold;
        break;

      case ' ':
        x++;
        break;

      case '\n':
        x = 0;
        y++;
        break;

      default:
        const charEl = UTIL.createEl('span', { innerHTML: char });
        if (bold) charEl.classList.add('bold');

        charEl.style.transform = `translate(${
          IDE_CONFIG.layout.paddingLeft + x * IDE_CONFIG.layout.charWidth
        }px, ${
          IDE_CONFIG.layout.paddingTop + y * IDE_CONFIG.layout.lineHeight
        }px)`;

        IDE_CONFIG.dom.codeBox.appendChild(charEl);
        my.codeChars.push({ el: charEl, x, y });
        x++;
    }
  }
}



//////////////////////////////////////////////////////////////////////////////////////////



IDEAnimation.prototype.tick = function(timestamp) {
  const my = this;

  if (!my.nextAction) my.nextAction = timestamp + IDE_CONFIG.animation.charDelay;

  const step = IDE_CONFIG.steps[my.nextStep];

  if (timestamp >= my.nextAction) {
    const char = my.codeChars[my.nextChar];

    if (my.deleteMode) {
      my.hidePopups();
      char.el.style.opacity = 0;
      my.nextChar--;

      my.nextAction = timestamp + IDE_CONFIG.animation.deleteDelay;

      if (my.nextChar < 0) {
        my.deleteMode = false;
        my.nextChar = 0;
        my.nextStep = 0;
        my.stepChar = 0;
        my.nextAction = timestamp + IDE_CONFIG.animation.stepDelay;
      }

    } else {
      char.el.style.opacity = 1;

      if (my.stepChar === 0) my.hidePopups();

      if (!step.popupKeys) step.popupKeys = Object.keys(step.popups);

      for (let pc = 0; pc < step.popupKeys.length; pc++) {
        const popupChar = parseInt(step.popupKeys[pc]);
        if (popupChar === my.stepChar) my.showPopup(step.popups[popupChar]);
      }

      my.stepChar++;
      my.nextChar++;

      if (my.nextChar === my.codeChars.length) {
        my.nextChar--;
        my.deleteMode = true;
        my.nextAction = timestamp + IDE_CONFIG.animation.endDelay;
      } else if (my.stepChar === step.chars) {
        my.nextStep++;
        my.stepChar = 0;
        my.nextAction = timestamp + IDE_CONFIG.animation.stepDelay;
      } else {
        my.nextAction = timestamp + IDE_CONFIG.animation.charDelay;
      }
    }
  }

  if (!my.paused) requestAnimationFrame(my.tickBind);
};



//////////////////////////////////////////////////////////////////////////////////////////



IDEAnimation.prototype.showPopup = function(id) {
  const my = this;

  my.hidePopups();

  my.activePopup = my.popups[id];
  my.activePopup.style.opacity = 1;
};



//////////////////////////////////////////////////////////////////////////////////////////



IDEAnimation.prototype.hidePopups = function(id, x, y) {
  const my = this;

  if (my.activePopup) {
    my.activePopup.style.opacity = 0;
    my.activePopup = undefined;
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



IDEAnimation.prototype.start = function() {
  const my = this;

  if (my.paused) {
    my.paused = false;
    my.nextAction = undefined;
    requestAnimationFrame(my.tickBind);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



IDEAnimation.prototype.stop = function() {
  const my = this;

  my.paused = true;
};
const SCHEMA_DATA = [
  {
    "name" : "coupons",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount_off",
        "type" : "bigint",
        "comment" : "Amount (in the `currency` specified) that will be taken off the subtotal of any invoices for this customer.",
        "has_currency" : "currency"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "If `amount_off` has been set, the three-letter [ISO code for the currency](https://stripe.com/docs/currencies) of the amount to take off.",
        "is_currency" : "true"
      },
      {
        "name" : "duration",
        "type" : "varchar",
        "comment" : "One of `forever`, `once`, and `repeating`. Describes how long a customer who applies this coupon will get the discount."
      },
      {
        "name" : "duration_in_months",
        "type" : "integer",
        "comment" : "If `duration` is `repeating`, the number of months the coupon applies. Null if coupon `duration` is `forever` or `once`."
      },
      {
        "name" : "max_redemptions",
        "type" : "integer",
        "comment" : "Maximum number of times this coupon can be redeemed, in total, before it is no longer valid."
      },
      {
        "name" : "percent_off",
        "type" : "integer",
        "comment" : "Percent that will be taken off the subtotal of any invoices for this customer for the duration of the coupon. For example, a coupon with percent_off of 50 will make a $100 invoice $50 instead."
      },
      {
        "name" : "redeem_by",
        "type" : "timestamp",
        "comment" : "Date after which the coupon can no longer be redeemed."
      },
      {
        "name" : "times_redeemed",
        "type" : "integer",
        "comment" : "Number of times this coupon has been applied to a customer."
      },
      {
        "name" : "valid",
        "type" : "boolean",
        "comment" : "Taking account of the above properties, whether this coupon can still be applied to a customer."
      }
    ]
  },
  {
    "name" : "invoices",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount_due",
        "type" : "bigint",
        "comment" : "Final amount due at this time for this invoice. If the invoice's total is smaller than the minimum charge amount, for example, or if there is account credit that can be applied to the invoice, the `amount_due` may be 0. If there is a positive `starting_balance` for the invoice (the customer owes money), the amount_due will also take that into account. The charge that gets generated for the invoice will be for the amount specified in `amount_due`.",
        "has_currency" : "currency"
      },
      {
        "name" : "application_fee",
        "type" : "bigint",
        "comment" : "The fee in cents that will be applied to the invoice and transferred to the application owner's Stripe account when the invoice is paid.",
        "has_currency" : "currency"
      },
      {
        "name" : "attempt_count",
        "type" : "integer",
        "comment" : "Number of payment attempts made for this invoice, from the perspective of the payment retry schedule. Any payment attempt counts as the first attempt, and subsequently only automatic retries increment the attempt count. In other words, manual payment attempts after the first attempt do not affect the retry schedule."
      },
      {
        "name" : "attempted",
        "type" : "boolean",
        "comment" : "Whether or not an attempt has been made to pay the invoice. An invoice is not attempted until 1 hour after the `invoice.created` webhook, for example, so you might not want to display that invoice as unpaid to your users."
      },
      {
        "name" : "charge_id",
        "type" : "varchar",
        "comment" : "ID of the latest charge generated for this invoice, if any.",
        "foreign_key" : "charges"
      },
      {
        "name" : "closed",
        "type" : "boolean",
        "comment" : "Whether or not the invoice is still trying to collect payment. An invoice is closed if it's either paid or it has been marked closed. A closed invoice will no longer attempt to collect payment."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "customer_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "customers"
      },
      {
        "name" : "date",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "ending_balance",
        "type" : "bigint",
        "comment" : "Ending customer balance after attempting to pay invoice. If the invoice has not been attempted yet, this will be null.",
        "has_currency" : "currency"
      },
      {
        "name" : "forgiven",
        "type" : "boolean",
        "comment" : "Whether or not the invoice has been forgiven. Forgiving an invoice instructs us to update the subscription status as if the invoice were successfully paid. Once an invoice has been forgiven, it cannot be unforgiven or reopened."
      },
      {
        "name" : "next_payment_attempt",
        "type" : "timestamp",
        "comment" : "The time at which payment will next be attempted."
      },
      {
        "name" : "paid",
        "type" : "boolean",
        "comment" : "Whether or not payment was successfully collected for this invoice. An invoice can be paid (most commonly) with a charge or with credit from the customer's account balance."
      },
      {
        "name" : "period_end",
        "type" : "timestamp",
        "comment" : "End of the usage period during which invoice items were added to this invoice."
      },
      {
        "name" : "period_start",
        "type" : "timestamp",
        "comment" : "Start of the usage period during which invoice items were added to this invoice."
      },
      {
        "name" : "receipt_number",
        "type" : "varchar",
        "comment" : "This is the transaction number that appears on email receipts sent for this invoice."
      },
      {
        "name" : "starting_balance",
        "type" : "bigint",
        "comment" : "Starting customer balance before attempting to pay invoice. If the invoice has not been attempted yet, this will be the current customer balance.",
        "has_currency" : "currency"
      },
      {
        "name" : "statement_descriptor",
        "type" : "varchar",
        "comment" : "Extra information about an invoice for the customer's credit card statement."
      },
      {
        "name" : "subscription_id",
        "type" : "varchar",
        "comment" : "The subscription that this invoice was prepared for, if any.",
        "foreign_key" : "subscriptions"
      },
      {
        "name" : "subscription_proration_date",
        "type" : "timestamp",
        "comment" : "Only set for upcoming invoices that preview prorations. The time used to calculate prorations."
      },
      {
        "name" : "subtotal",
        "type" : "bigint",
        "comment" : "Total of all subscriptions, invoice items, and prorations on the invoice before any discount is applied.",
        "has_currency" : "currency"
      },
      {
        "name" : "tax",
        "type" : "bigint",
        "comment" : "The amount of tax included in the total, calculated from `tax_percent` and the subtotal. If no `tax_percent` is defined, this value will be null.",
        "has_currency" : "currency"
      },
      {
        "name" : "tax_percent",
        "type" : "double",
        "comment" : "This percentage of the subtotal has been added to the total amount of the invoice, including invoice line items and discounts. This field is inherited from the subscription's `tax_percent` field, but can be changed before the invoice is paid. This field defaults to null."
      },
      {
        "name" : "total",
        "type" : "bigint",
        "comment" : "Total after discount.",
        "has_currency" : "currency"
      },
      {
        "name" : "webhooks_delivered_at",
        "type" : "timestamp",
        "comment" : "The time at which webhooks for this invoice were successfully delivered (if the invoice had no webhooks to deliver, this will match `date`). Invoice payment is delayed until webhooks are delivered, or until all webhook delivery attempts have been exhausted."
      },
      {
        "name" : "discount_coupon_id",
        "type" : "varchar",
        "comment" : "Hash describing the coupon applied to create this discount.",
        "foreign_key" : "coupons"
      },
      {
        "name" : "discount_customer_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "customers"
      },
      {
        "name" : "discount_end",
        "type" : "timestamp",
        "comment" : "If the coupon has a duration of `once` or `repeating`, the date that this discount will end. If the coupon used has a `forever` duration, this attribute will be null."
      },
      {
        "name" : "discount_start",
        "type" : "timestamp",
        "comment" : "Date that the coupon was applied."
      },
      {
        "name" : "discount_subscription",
        "type" : "varchar",
        "comment" : "The subscription that this coupon is applied to, if it is applied to a particular subscription."
      }
    ]
  },
  {
    "name" : "coupons_metadata",
    "columns" : [
      {
        "name" : "coupon_id",
        "type" : "varchar",
        "comment" : "The ID of the coupon that this metadata entry is associated with.",
        "foreign_key" : "coupons"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "balance_transaction_fee_details",
    "columns" : [
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount of the fee, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "application",
        "type" : "varchar",
        "comment" : ""
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "type",
        "type" : "varchar",
        "comment" : "Type of the fee, one of: `application_fee`, `stripe_fee` or `tax`."
      }
    ]
  },
  {
    "name" : "charges_metadata",
    "columns" : [
      {
        "name" : "charge_id",
        "type" : "varchar",
        "comment" : "The ID of the charge that this metadata entry is associated with.",
        "foreign_key" : "charges"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "subscriptions_metadata",
    "columns" : [
      {
        "name" : "subscription_id",
        "type" : "varchar",
        "comment" : "The ID of the subscription that this metadata entry is associated with.",
        "foreign_key" : "subscriptions"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "transfers_metadata",
    "columns" : [
      {
        "name" : "transfer_id",
        "type" : "varchar",
        "comment" : "The ID of the transfer that this metadata entry is associated with.",
        "foreign_key" : "transfers"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "application_fees",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "account_id",
        "type" : "varchar",
        "comment" : "ID of the Stripe account this fee was taken from."
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount earned, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "amount_refunded",
        "type" : "bigint",
        "comment" : "Amount in cents refunded (can be less than the amount attribute on the fee if a partial refund was issued)",
        "has_currency" : "currency"
      },
      {
        "name" : "application_id",
        "type" : "varchar",
        "comment" : "ID of the Connect application that earned the fee."
      },
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "Balance transaction that describes the impact of this collected application fee on your account balance (not including refunds).",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "charge_id",
        "type" : "varchar",
        "comment" : "ID of the charge that the application fee was taken from.",
        "foreign_key" : "charges"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "originating_transaction_id",
        "type" : "varchar",
        "comment" : "ID of the corresponding charge on the platform account, if this fee was the result of a charge using the `destination` parameter."
      },
      {
        "name" : "refunded",
        "type" : "boolean",
        "comment" : "Whether or not the fee has been fully refunded. If the fee is only partially refunded, this attribute will still be false."
      }
    ]
  },
  {
    "name" : "refunds",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "Balance transaction that describes the impact on your account balance.",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "charge_id",
        "type" : "varchar",
        "comment" : "ID of the charge that was refunded.",
        "foreign_key" : "charges"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "reason",
        "type" : "varchar",
        "comment" : "Reason for the refund. If set, possible values are `duplicate`, `fraudulent`, and `requested_by_customer`."
      },
      {
        "name" : "receipt_number",
        "type" : "varchar",
        "comment" : "This is the transaction number that appears on email receipts sent for this refund."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "Status of the refund. For credit card refunds, this will always be `succeeded`. For other types of refunds, it can be `pending`, `succeeded`, `failed`, or `cancelled`."
      }
    ],
    "reports" : [
      {
        "title" : "Refund count and volume by month (created)",
        "query" : "SELECT\n  date_format(refunds.created, '%Y-%m-01') AS month,\n  card_country AS country,\n  SUM(refunds.amount) / 100 AS sum\nFROM refunds\nJOIN charges\n  ON refunds.charge = charges.id\nGROUP BY 1, 2 ORDER BY 2\n"
      }
    ]
  },
  {
    "name" : "transfer_reversals",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "Balance transaction that describes the impact on your account balance.",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "transfer_id",
        "type" : "varchar",
        "comment" : "ID of the transfer that was reversed.",
        "foreign_key" : "transfers"
      }
    ]
  },
  {
    "name" : "sources_metadata",
    "columns" : [
      {
        "name" : "source_id",
        "type" : "varchar",
        "comment" : "The ID of the source that this metadata entry is associated with.",
        "foreign_key" : "sources"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "customers_metadata",
    "columns" : [
      {
        "name" : "customer_id",
        "type" : "varchar",
        "comment" : "The ID of the customer that this metadata entry is associated with.",
        "foreign_key" : "customers"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "refunds_metadata",
    "columns" : [
      {
        "name" : "refund_id",
        "type" : "varchar",
        "comment" : "The ID of the refund that this metadata entry is associated with.",
        "foreign_key" : "refunds"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "invoice_items",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount (in the `currency` specified) of the invoice item.",
        "has_currency" : "currency"
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "customer_id",
        "type" : "varchar",
        "comment" : "The ID of the customer who will be billed when this invoice item is billed.",
        "foreign_key" : "customers"
      },
      {
        "name" : "date",
        "type" : "timestamp",
        "comment" : ""
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "discountable",
        "type" : "boolean",
        "comment" : "If true, discounts will apply to this invoice item. Always false for prorations."
      },
      {
        "name" : "invoice_id",
        "type" : "varchar",
        "comment" : "The ID of the invoice this invoice item belongs to.",
        "foreign_key" : "invoices"
      },
      {
        "name" : "period_end",
        "type" : "timestamp",
        "comment" : ""
      },
      {
        "name" : "period_start",
        "type" : "timestamp",
        "comment" : ""
      },
      {
        "name" : "plan_id",
        "type" : "varchar",
        "comment" : "If the invoice item is a proration, the plan of the subscription that the proration was computed for.",
        "foreign_key" : "plans"
      },
      {
        "name" : "proration",
        "type" : "boolean",
        "comment" : "Whether or not the invoice item was created automatically as a proration adjustment when the customer switched plans."
      },
      {
        "name" : "quantity",
        "type" : "integer",
        "comment" : "If the invoice item is a proration, the quantity of the subscription that the proration was computed for."
      },
      {
        "name" : "subscription_id",
        "type" : "varchar",
        "comment" : "The subscription that this invoice item has been created for, if any.",
        "foreign_key" : "subscriptions"
      }
    ]
  },
  {
    "name" : "charges",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "A positive integer in the [smallest currency unit](https://stripe.com/docs/currencies#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency) representing how much to charge. The minimum amount is $0.50 US or [equivalent in charge currency](https://support.stripe.com/questions/what-is-the-minimum-amount-i-can-charge-with-stripe).",
        "has_currency" : "currency"
      },
      {
        "name" : "amount_refunded",
        "type" : "bigint",
        "comment" : "Amount in cents refunded (can be less than the amount attribute on the charge if a partial refund was issued).",
        "has_currency" : "currency"
      },
      {
        "name" : "application_fee_id",
        "type" : "varchar",
        "comment" : "The application fee (if any) for the charge. [See the Connect documentation](/docs/connect/direct-charges#collecting-fees) for details."
      },
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "ID of the balance transaction that describes the impact of this charge on your account balance (not including refunds or disputes).",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "captured",
        "type" : "boolean",
        "comment" : "If the charge was created without capturing, this boolean represents whether or not it is still uncaptured or has since been captured."
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "customer_id",
        "type" : "varchar",
        "comment" : "ID of the customer this charge is for if one exists.",
        "foreign_key" : "customers"
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "destination_id",
        "type" : "varchar",
        "comment" : "The account (if any) the charge was made on behalf of, with an automatic transfer. [See the Connect documentation](/docs/connect/destination-charges) for details."
      },
      {
        "name" : "dispute_id",
        "type" : "varchar",
        "comment" : "Details about the dispute if the charge has been disputed.",
        "foreign_key" : "disputes"
      },
      {
        "name" : "failure_code",
        "type" : "varchar",
        "comment" : "Error code explaining reason for charge failure if available (see [the errors section](/docs/api#errors) for a list of codes)."
      },
      {
        "name" : "failure_message",
        "type" : "varchar",
        "comment" : "Message to user further explaining reason for charge failure if available."
      },
      {
        "name" : "invoice_id",
        "type" : "varchar",
        "comment" : "ID of the invoice this charge is for if one exists.",
        "foreign_key" : "invoices"
      },
      {
        "name" : "order_id",
        "type" : "varchar",
        "comment" : "ID of the order this charge is for if one exists."
      },
      {
        "name" : "paid",
        "type" : "boolean",
        "comment" : "`true` if the charge succeeded, or was successfully authorized for later capture."
      },
      {
        "name" : "receipt_email",
        "type" : "varchar",
        "comment" : "This is the email address that the receipt for this charge was sent to."
      },
      {
        "name" : "receipt_number",
        "type" : "varchar",
        "comment" : "This is the transaction number that appears on email receipts sent for this charge."
      },
      {
        "name" : "refunded",
        "type" : "boolean",
        "comment" : "Whether or not the charge has been fully refunded. If the charge is only partially refunded, this attribute will still be false."
      },
      {
        "name" : "statement_descriptor",
        "type" : "varchar",
        "comment" : "Extra information about a charge. This will appear on your customer's credit card statement."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "The status of the payment is either `succeeded`, `pending`, or `failed`."
      },
      {
        "name" : "source_transfer_id",
        "type" : "varchar",
        "comment" : "The transfer ID which created this charge. Only present if the charge came from another Stripe account. [See the Connect documentation](/docs/connect/destination-charges) for details."
      },
      {
        "name" : "transfer_id",
        "type" : "varchar",
        "comment" : "ID of the transfer to the `destination` account (only applicable if the charge was created using the `destination` parameter).",
        "foreign_key" : "transfers"
      },
      {
        "name" : "transfer_group",
        "type" : "varchar",
        "comment" : "A string that identifies this transaction as part of a group. See the [Connect documentation](/docs/connect/charges-transfers#grouping-transactions) for details."
      },
      {
        "name" : "application_id",
        "type" : "varchar",
        "comment" : "ID of the Connect application that created the charge."
      },
      {
        "name" : "source_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "sources"
      },
      {
        "name" : "card_id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object."
      },
      {
        "name" : "card_address_city",
        "type" : "varchar",
        "comment" : "City/District/Suburb/Town/Village."
      },
      {
        "name" : "card_address_country",
        "type" : "varchar",
        "comment" : "Billing address country, if provided when creating card."
      },
      {
        "name" : "card_address_line1",
        "type" : "varchar",
        "comment" : "Address line 1 (Street address/PO Box/Company name)."
      },
      {
        "name" : "card_address_line1_check",
        "type" : "varchar",
        "comment" : "If `address_line1` was provided, results of the check: `pass`, `fail`, `unavailable`, or `unchecked`."
      },
      {
        "name" : "card_address_line2",
        "type" : "varchar",
        "comment" : "Address line 2 (Apartment/Suite/Unit/Building)."
      },
      {
        "name" : "card_address_state",
        "type" : "varchar",
        "comment" : "State/County/Province/Region."
      },
      {
        "name" : "card_address_zip",
        "type" : "varchar",
        "comment" : "Zip/Postal Code."
      },
      {
        "name" : "card_address_zip_check",
        "type" : "varchar",
        "comment" : "If `address_zip` was provided, results of the check: `pass`, `fail`, `unavailable`, or `unchecked`."
      },
      {
        "name" : "card_brand",
        "type" : "varchar",
        "comment" : "Card brand. Can be `Visa`, `American Express`, `MasterCard`, `Discover`, `JCB`, `Diners Club`, or `Unknown`."
      },
      {
        "name" : "card_country",
        "type" : "varchar",
        "comment" : "Two-letter ISO code representing the country of the card. You could use this attribute to get a sense of the international breakdown of cards you've collected.",
        "is_country" : "true"
      },
      {
        "name" : "card_customer_id",
        "type" : "varchar",
        "comment" : "The customer that this card belongs to. This attribute will not be in the card object if the card belongs to an account or recipient instead.",
        "foreign_key" : "customers"
      },
      {
        "name" : "card_cvc_check",
        "type" : "varchar",
        "comment" : "If a CVC was provided, results of the check: `pass`, `fail`, `unavailable`, or `unchecked`."
      },
      {
        "name" : "card_dynamic_last4",
        "type" : "varchar",
        "comment" : "(For tokenized numbers only.) The last four digits of the device account number."
      },
      {
        "name" : "card_exp_month",
        "type" : "integer",
        "comment" : "Two digit number representing the card's expiration month."
      },
      {
        "name" : "card_exp_year",
        "type" : "integer",
        "comment" : "Four digit number representing the card's expiration year."
      },
      {
        "name" : "card_fingerprint",
        "type" : "varchar",
        "comment" : "Uniquely identifies this particular card number. You can use this attribute to check whether two customers who've signed up with you are using the same card number, for example."
      },
      {
        "name" : "card_funding",
        "type" : "varchar",
        "comment" : "Card funding type. Can be `credit`, `debit`, `prepaid`, or `unknown`."
      },
      {
        "name" : "card_last4",
        "type" : "varchar",
        "comment" : "The last 4 digits of the card."
      },
      {
        "name" : "card_name",
        "type" : "varchar",
        "comment" : "Cardholder name."
      },
      {
        "name" : "card_tokenization_method",
        "type" : "varchar",
        "comment" : "If the card number is tokenized, this is the method that was used. Can be `apple_pay` or `android_pay`."
      }
    ],
    "reports" : [
      {
        "title" : "Charge count and volume by month (created)",
        "query" : "SELECT\n  date_format(charges.created, '%Y-%m-01') AS month,\n  SUM(charges.amount) / 100 AS volume,\n  COUNT(*) AS count\n  FROM charges\nGROUP BY 1\nORDER BY 1\n"
      },
      {
        "title" : "Charge count and volume by card country",
        "query" : "SELECT\n  card_country AS country,\n  SUM(charges.amount) / 100 AS sum\n  FROM charges\nGROUP BY 1\nORDER BY 2\n"
      },
      {
        "title" : "Charge count and volume by card brand",
        "query" : "SELECT\n  card_brand AS brand,\n  SUM(charges.amount) / 100 AS sum\n  FROM charges\nGROUP BY 1\nORDER BY 2\n"
      }
    ]
  },
  {
    "name" : "invoice_items_metadata",
    "columns" : [
      {
        "name" : "invoice_item_id",
        "type" : "varchar",
        "comment" : "The ID of the invoice_item that this metadata entry is associated with.",
        "foreign_key" : "invoice_items"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "invoice_line_items",
    "columns" : [
      {
        "name" : "invoice_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "invoices"
      },
      {
        "name" : "source_id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object."
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "The amount, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "discountable",
        "type" : "boolean",
        "comment" : "If true, discounts will apply to this line item. Always false for prorations."
      },
      {
        "name" : "period_end",
        "type" : "timestamp",
        "comment" : "The period this line_item covers. For subscription line items, this is the subscription period. For prorations, this starts when the proration was calculated, and ends at the period end of the subscription. For invoice items, this is the time at which the invoice item was created, so the period start and end are the same time."
      },
      {
        "name" : "period_start",
        "type" : "timestamp",
        "comment" : "The period this line_item covers. For subscription line items, this is the subscription period. For prorations, this starts when the proration was calculated, and ends at the period end of the subscription. For invoice items, this is the time at which the invoice item was created, so the period start and end are the same time."
      },
      {
        "name" : "plan_id",
        "type" : "varchar",
        "comment" : "The plan of the subscription, if the line item is a subscription or a proration.",
        "foreign_key" : "plans"
      },
      {
        "name" : "proration",
        "type" : "boolean",
        "comment" : "Whether or not this is a proration."
      },
      {
        "name" : "quantity",
        "type" : "integer",
        "comment" : "The quantity of the subscription, if the line item is a subscription or a proration."
      },
      {
        "name" : "subscription",
        "type" : "varchar",
        "comment" : "When type is `invoiceitem`, the subscription that the invoice item pertains to, if any. Left blank when `type` is already subscription, as it'd be redundant with `id`."
      },
      {
        "name" : "source_type",
        "type" : "varchar",
        "comment" : "A string identifying the type of the source of this line item, either an `invoiceitem` or a `subscription`."
      }
    ]
  },
  {
    "name" : "disputes",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Disputed amount. Usually the amount of the charge, but can differ (usually because of currency fluctuation or because only part of the order is disputed).",
        "has_currency" : "currency"
      },
      {
        "name" : "charge_id",
        "type" : "varchar",
        "comment" : "ID of the charge that was disputed.",
        "foreign_key" : "charges"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "is_charge_refundable",
        "type" : "boolean",
        "comment" : "If true, it is still possible to refund the disputed payment. Once the payment has been fully refunded, no further funds will be withdrawn from your Stripe account as a result of this dispute."
      },
      {
        "name" : "reason",
        "type" : "varchar",
        "comment" : "Reason given by cardholder for dispute. Possible values are `duplicate`, `fraudulent`, `subscription_canceled`, `product_unacceptable`, `product_not_received`, `unrecognized`, `credit_not_processed`, `general`, `incorrect_account_details`, `insufficient_funds`, `bank_cannot_process`, `debit_not_authorized`, or `customer_initiated`. Read more about [dispute reasons](https://stripe.com/help/disputes#reasons)."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "Current status of dispute. Possible values are `warning_needs_response`, `warning_under_review`, `warning_closed`, `needs_response`, `under_review`, `charge_refunded`, `won`, or `lost`."
      },
      {
        "name" : "evidence_access_activity_log",
        "type" : "varchar",
        "comment" : "Any server or activity logs showing proof that the customer accessed or downloaded the purchased digital product. This information should include IP addresses, corresponding timestamps, and any detailed recorded activity."
      },
      {
        "name" : "evidence_billing_address",
        "type" : "varchar",
        "comment" : "The billing address provided by the customer."
      },
      {
        "name" : "evidence_cancellation_policy_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Your subscription cancellation policy, as shown to the customer."
      },
      {
        "name" : "evidence_cancellation_policy_disclosure",
        "type" : "varchar",
        "comment" : "An explanation of how and when the customer was shown your refund policy prior to purchase."
      },
      {
        "name" : "evidence_cancellation_rebuttal",
        "type" : "varchar",
        "comment" : "A justification for why the customer's subscription was not canceled."
      },
      {
        "name" : "evidence_customer_communication_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Any communication with the customer that you feel is relevant to your case (for example emails proving that they received the product or service, or demonstrating their use of or satisfaction with the product or service)."
      },
      {
        "name" : "evidence_customer_email_address",
        "type" : "varchar",
        "comment" : "The email address of the customer."
      },
      {
        "name" : "evidence_customer_name",
        "type" : "varchar",
        "comment" : "The name of the customer."
      },
      {
        "name" : "evidence_customer_purchase_ip",
        "type" : "varchar",
        "comment" : "The IP address that the customer used when making the purchase."
      },
      {
        "name" : "evidence_customer_signature_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) A relevant document or contract showing the customer's signature."
      },
      {
        "name" : "evidence_duplicate_charge_documentation_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Documentation for the prior charge that can uniquely identify the charge, such as a receipt, shipping label, work order, etc. This document should be paired with a similar document from the disputed payment that proves the two payments are separate."
      },
      {
        "name" : "evidence_duplicate_charge_id",
        "type" : "varchar",
        "comment" : "The Stripe ID for the prior charge which appears to be a duplicate of the disputed charge."
      },
      {
        "name" : "evidence_product_description",
        "type" : "varchar",
        "comment" : "A description of the product or service which was sold."
      },
      {
        "name" : "evidence_receipt_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Any receipt or message sent to the customer notifying them of the charge."
      },
      {
        "name" : "evidence_refund_policy_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Your refund policy, as shown to the customer."
      },
      {
        "name" : "evidence_refund_policy_disclosure",
        "type" : "varchar",
        "comment" : "Documentation demonstrating that the customer was shown your refund policy prior to purchase."
      },
      {
        "name" : "evidence_refund_refusal_explanation",
        "type" : "varchar",
        "comment" : "A justification for why the customer is not entitled to a refund."
      },
      {
        "name" : "evidence_service_date",
        "type" : "varchar",
        "comment" : "The date on which the customer received or began receiving the purchased service, in a clear human-readable format."
      },
      {
        "name" : "evidence_service_documentation_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Documentation showing proof that a service was provided to the customer. This could include a copy of a signed contract, work order, or other form of written agreement."
      },
      {
        "name" : "evidence_shipping_address",
        "type" : "varchar",
        "comment" : "The address to which a physical product was shipped. You should try to include as much complete address information as possible."
      },
      {
        "name" : "evidence_shipping_carrier",
        "type" : "varchar",
        "comment" : "The delivery service that shipped a physical product, such as Fedex, UPS, USPS, etc. If multiple carriers were used for this purchase, please separate them with commas."
      },
      {
        "name" : "evidence_shipping_date",
        "type" : "varchar",
        "comment" : "The date on which a physical product began its route to the shipping address, in a clear human-readable format."
      },
      {
        "name" : "evidence_shipping_documentation_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Documentation showing proof that a product was shipped to the customer at the same address the customer provided to you. This could include a copy of the shipment receipt, shipping label, etc, and should show the full shipping address of the customer, if possible."
      },
      {
        "name" : "evidence_shipping_tracking_number",
        "type" : "varchar",
        "comment" : "The tracking number for a physical product, obtained from the delivery service. If multiple tracking numbers were generated for this purchase, please separate them with commas."
      },
      {
        "name" : "evidence_uncategorized_file_id",
        "type" : "varchar",
        "comment" : "(ID of a [file upload](https://stripe.com/docs/guides/file-upload)) Any additional evidence or statements."
      },
      {
        "name" : "evidence_uncategorized_text",
        "type" : "varchar",
        "comment" : "Any additional evidence or statements."
      },
      {
        "name" : "evidence_details_due_by",
        "type" : "timestamp",
        "comment" : "Date by which evidence must be submitted in order to successfully challenge dispute. Will be null if the customer's bank or credit card company doesn't allow a response for this particular dispute."
      },
      {
        "name" : "evidence_details_has_evidence",
        "type" : "boolean",
        "comment" : "Whether or not evidence has been saved for this dispute."
      },
      {
        "name" : "evidence_details_past_due",
        "type" : "boolean",
        "comment" : "Whether or not the last evidence submission was submitted past the due date. Defaults to `false` if no evidence submissions have occurred. If true, then delivery of the latest evidence is not guaranteed."
      },
      {
        "name" : "evidence_details_submission_count",
        "type" : "integer",
        "comment" : "The number of times the evidence has been submitted. You may submit evidence a maximum of 5 times."
      }
    ],
    "reports" : [
      {
        "title" : "Dispute count and volume by month (created)",
        "query" : "SELECT\n  date_format(charges.created, '%Y-%m-01') AS month,\n  count(*) AS count\nFROM charges\nWHERE dispute IS NOT NULL\nGROUP BY 1 ORDER BY 1\n"
      }
    ]
  },
  {
    "name" : "transfer_reversals_metadata",
    "columns" : [
      {
        "name" : "transfer_reversal_id",
        "type" : "varchar",
        "comment" : "The ID of the transfer_reversal that this metadata entry is associated with.",
        "foreign_key" : "transfer_reversals"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "plans",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "The amount in cents to be charged on the interval specified.",
        "has_currency" : "currency"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "interval",
        "type" : "varchar",
        "comment" : "One of `day`, `week`, `month` or `year`. The frequency with which a subscription should be billed."
      },
      {
        "name" : "interval_count",
        "type" : "integer",
        "comment" : "The number of intervals (specified in the `interval` property) between each subscription billing. For example, `interval=month` and `interval_count=3` bills every 3 months."
      },
      {
        "name" : "name",
        "type" : "varchar",
        "comment" : "Display name of the plan."
      },
      {
        "name" : "statement_descriptor",
        "type" : "varchar",
        "comment" : "Extra information about a charge for the customer's credit card statement."
      },
      {
        "name" : "trial_period_days",
        "type" : "integer",
        "comment" : "Number of trial period days granted when subscribing a customer to this plan. Null if the plan has no trial period."
      }
    ]
  },
  {
    "name" : "transfers",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount (in cents) to be transferred to your bank account.",
        "has_currency" : "currency"
      },
      {
        "name" : "amount_reversed",
        "type" : "bigint",
        "comment" : "Amount in cents reversed (can be less than the amount attribute on the transfer if a partial reversal was issued).",
        "has_currency" : "currency"
      },
      {
        "name" : "application_fee_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "application_fees"
      },
      {
        "name" : "balance_transaction_id",
        "type" : "varchar",
        "comment" : "Balance transaction that describes the impact of this transfer on your account balance.",
        "foreign_key" : "balance_transactions"
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/payouts).",
        "is_currency" : "true"
      },
      {
        "name" : "date",
        "type" : "timestamp",
        "comment" : "Date the transfer is scheduled to arrive in the bank. This factors in delays like weekends or bank holidays."
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "Internal-only description of the transfer."
      },
      {
        "name" : "destination_id",
        "type" : "varchar",
        "comment" : "ID of the bank account, card, or Stripe account the transfer was sent to."
      },
      {
        "name" : "destination_payment_id",
        "type" : "varchar",
        "comment" : "If the destination is a Stripe account, this will be the ID of the payment that the destination account received for the transfer.",
        "foreign_key" : "charges"
      },
      {
        "name" : "failure_code",
        "type" : "varchar",
        "comment" : "Error code explaining reason for transfer failure if available. See [Types of transfer failures](/docs/api#transfer_failures) for a list of failure codes."
      },
      {
        "name" : "failure_message",
        "type" : "varchar",
        "comment" : "Message to user further explaining reason for transfer failure if available."
      },
      {
        "name" : "reversed",
        "type" : "boolean",
        "comment" : "Whether or not the transfer has been fully reversed. If the transfer is only partially reversed, this attribute will still be false."
      },
      {
        "name" : "source_transaction_id",
        "type" : "varchar",
        "comment" : "ID of the charge (or other transaction) that was used to fund the transfer. If null, the transfer was funded from the available balance."
      },
      {
        "name" : "source_type",
        "type" : "varchar",
        "comment" : "The source balance this transfer came from. One of `card`, `bank_account`, `bitcoin_receiver`, or `alipay_account`."
      },
      {
        "name" : "statement_descriptor",
        "type" : "varchar",
        "comment" : "Extra information about a transfer to be displayed on the user's bank statement."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "Current status of the transfer (`paid`, `pending`, `in_transit`, `canceled` or `failed`). A transfer will be `pending` until it is submitted to the bank, at which point it becomes `in_transit`. It will then change to `paid` if the transaction goes through. If it does not go through successfully, its status will change to `failed` or `canceled`."
      },
      {
        "name" : "transfer_group",
        "type" : "varchar",
        "comment" : "A string that identifies this transaction as part of a group. See the [Connect documentation](/docs/connect/charges-transfers#grouping-transactions) for details."
      },
      {
        "name" : "type",
        "type" : "varchar",
        "comment" : "Can be `card`, `bank_account`, or `stripe_account`."
      }
    ]
  },
  {
    "name" : "plans_metadata",
    "columns" : [
      {
        "name" : "plan_id",
        "type" : "varchar",
        "comment" : "The ID of the plan that this metadata entry is associated with.",
        "foreign_key" : "plans"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "balance_transactions",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Gross amount of the transaction, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "available_on",
        "type" : "timestamp",
        "comment" : "The date the transaction's net funds will become available in the Stripe balance."
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).",
        "is_currency" : "true"
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "fee",
        "type" : "bigint",
        "comment" : "Fees (in cents) paid for this transaction.",
        "has_currency" : "currency"
      },
      {
        "name" : "net",
        "type" : "bigint",
        "comment" : "Net amount of the transaction, in cents.",
        "has_currency" : "currency"
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "If the transaction's net funds are available in the Stripe balance yet. Either `available` or `pending`."
      },
      {
        "name" : "type",
        "type" : "varchar",
        "comment" : "Transaction type: `adjustment`, `application_fee`, `application_fee_refund`, `charge`, `payment`, `payment_failure_refund`, `payment_refund`, `refund`,  `transfer`, `transfer_refund`, `payout`, `payout_cancel`, `payout_failure`, or `validation`."
      },
      {
        "name" : "source_id",
        "type" : "varchar",
        "comment" : "The Stripe object this transaction is related to."
      },
      {
        "name" : "automatic_transfer_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "balance_transactions"
      }
    ]
  },
  {
    "name" : "invoices_metadata",
    "columns" : [
      {
        "name" : "invoice_id",
        "type" : "varchar",
        "comment" : "The ID of the invoice that this metadata entry is associated with.",
        "foreign_key" : "invoices"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "customers",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "account_balance",
        "type" : "bigint",
        "comment" : "Current balance, if any, being stored on the customer's account. If negative, the customer has credit to apply to the next invoice. If positive, the customer has an amount owed that will be added to the next invoice. The balance does not refer to any unpaid invoices; it solely takes into account amounts that have yet to be successfully applied to any invoice. This balance is only taken into account for recurring billing purposes (i.e., subscriptions, invoices, invoice items).",
        "has_currency" : "currency"
      },
      {
        "name" : "business_vat_id",
        "type" : "varchar",
        "comment" : "The customer's VAT identification number."
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO code for the currency](https://stripe.com/docs/currencies) the customer can be charged in for recurring billing purposes.",
        "is_currency" : "true"
      },
      {
        "name" : "delinquent",
        "type" : "boolean",
        "comment" : "Whether or not the latest charge for the customer's latest invoice has failed."
      },
      {
        "name" : "description",
        "type" : "varchar",
        "comment" : "An arbitrary string attached to the object. Often useful for displaying to users."
      },
      {
        "name" : "email",
        "type" : "varchar",
        "comment" : "The customer's email address."
      },
      {
        "name" : "default_source_id",
        "type" : "varchar",
        "comment" : "ID of the default source attached to this customer."
      },
      {
        "name" : "shipping_name",
        "type" : "varchar",
        "comment" : "Customer name."
      },
      {
        "name" : "shipping_phone",
        "type" : "varchar",
        "comment" : "Customer phone (including extension)."
      },
      {
        "name" : "shipping_address_city",
        "type" : "varchar",
        "comment" : "City/District/Suburb/Town/Village."
      },
      {
        "name" : "shipping_address_country",
        "type" : "varchar",
        "comment" : "2-letter country code.",
        "is_country" : "true"
      },
      {
        "name" : "shipping_address_line1",
        "type" : "varchar",
        "comment" : "Address line 1 (Street address/PO Box/Company name)."
      },
      {
        "name" : "shipping_address_line2",
        "type" : "varchar",
        "comment" : "Address line 2 (Apartment/Suite/Unit/Building)."
      },
      {
        "name" : "shipping_address_postal_code",
        "type" : "varchar",
        "comment" : "Zip/Postal Code."
      },
      {
        "name" : "shipping_address_state",
        "type" : "varchar",
        "comment" : "State/County/Province/Region."
      },
      {
        "name" : "discount_coupon_id",
        "type" : "varchar",
        "comment" : "Hash describing the coupon applied to create this discount.",
        "foreign_key" : "coupons"
      },
      {
        "name" : "discount_customer_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "customers"
      },
      {
        "name" : "discount_end",
        "type" : "timestamp",
        "comment" : "If the coupon has a duration of `once` or `repeating`, the date that this discount will end. If the coupon used has a `forever` duration, this attribute will be null."
      },
      {
        "name" : "discount_start",
        "type" : "timestamp",
        "comment" : "Date that the coupon was applied."
      },
      {
        "name" : "discount_subscription",
        "type" : "varchar",
        "comment" : "The subscription that this coupon is applied to, if it is applied to a particular subscription."
      }
    ],
    "reports" : [
      {
        "title" : "Charge count and volume by month (created)",
        "query" : "WITH counts AS (\n  SELECT\n    COUNT(*) AS num_charges\n  FROM charges\n  GROUP BY customer\n)\nSELECT\n  num_charges,\n  COUNT(num_charges)\nFROM counts\nGROUP BY 1\n"
      }
    ]
  },
  {
    "name" : "sources",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "amount",
        "type" : "bigint",
        "comment" : "Amount associated with the source. This is the amount for which the source will be chargeable once ready. Required for `single_use` sources.",
        "has_currency" : "currency"
      },
      {
        "name" : "client_secret",
        "type" : "varchar",
        "comment" : "The client secret of the source. Used for client-side polling using a publishable key."
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "currency",
        "type" : "varchar",
        "comment" : "Three-letter [ISO code for the currency](https://stripe.com/docs/currencies) associated with the source. This is the currency for which the source will be chargeable once ready. Required for `single_use` sources.",
        "is_currency" : "true"
      },
      {
        "name" : "flow",
        "type" : "varchar",
        "comment" : "The authentication `flow` of the source. `flow` is one of `redirect`, `receiver`, `code_verification`, `none`."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "The status of the charge, one of `canceled`, `chargeable`, `consumed`, `failed`, or `pending`. Only `chargeable` source objects can be used to create a charge."
      },
      {
        "name" : "type",
        "type" : "varchar",
        "comment" : "The `type` of the source. The `type` is a payment method, one of `card`, `three_d_secure`, `giropay`, `sepa_debit`, `ideal`, `sofort`, or `bancontact`."
      },
      {
        "name" : "usage",
        "type" : "varchar",
        "comment" : "Either `reusable` or `single_use`. Whether this source should be reusable or not. Some source types may or may not be reusable by construction, while other may leave the option at creation. If an incompatible value is passed, an error will be returned."
      },
      {
        "name" : "code_verification_attempts_remaining",
        "type" : "integer",
        "comment" : "The number of attempts remaining to authenticate the source object with a verification code."
      },
      {
        "name" : "code_verification_status",
        "type" : "varchar",
        "comment" : "The status of the code verification, either `pending`, `succeeded` or `failed`."
      },
      {
        "name" : "owner_email",
        "type" : "varchar",
        "comment" : "Owner's email address."
      },
      {
        "name" : "owner_name",
        "type" : "varchar",
        "comment" : "Owner's full name."
      },
      {
        "name" : "owner_phone",
        "type" : "varchar",
        "comment" : "Owner's phone number (including extension)."
      },
      {
        "name" : "owner_verified_email",
        "type" : "varchar",
        "comment" : "Verified owner's email address."
      },
      {
        "name" : "owner_verified_name",
        "type" : "varchar",
        "comment" : "Verified owner's full name."
      },
      {
        "name" : "owner_verified_phone",
        "type" : "varchar",
        "comment" : "Verified owner's phone number (including extension)."
      },
      {
        "name" : "owner_address_city",
        "type" : "varchar",
        "comment" : "City/District/Suburb/Town/Village."
      },
      {
        "name" : "owner_address_country",
        "type" : "varchar",
        "comment" : "2-letter country code.",
        "is_country" : "true"
      },
      {
        "name" : "owner_address_line1",
        "type" : "varchar",
        "comment" : "Address line 1 (Street address/PO Box/Company name)."
      },
      {
        "name" : "owner_address_line2",
        "type" : "varchar",
        "comment" : "Address line 2 (Apartment/Suite/Unit/Building)."
      },
      {
        "name" : "owner_address_postal_code",
        "type" : "varchar",
        "comment" : "Zip/Postal Code."
      },
      {
        "name" : "owner_address_state",
        "type" : "varchar",
        "comment" : "State/County/Province/Region."
      },
      {
        "name" : "owner_verified_address_city",
        "type" : "varchar",
        "comment" : "City/District/Suburb/Town/Village."
      },
      {
        "name" : "owner_verified_address_country",
        "type" : "varchar",
        "comment" : "2-letter country code.",
        "is_country" : "true"
      },
      {
        "name" : "owner_verified_address_line1",
        "type" : "varchar",
        "comment" : "Address line 1 (Street address/PO Box/Company name)."
      },
      {
        "name" : "owner_verified_address_line2",
        "type" : "varchar",
        "comment" : "Address line 2 (Apartment/Suite/Unit/Building)."
      },
      {
        "name" : "owner_verified_address_postal_code",
        "type" : "varchar",
        "comment" : "Zip/Postal Code."
      },
      {
        "name" : "owner_verified_address_state",
        "type" : "varchar",
        "comment" : "State/County/Province/Region."
      },
      {
        "name" : "receiver_address",
        "type" : "varchar",
        "comment" : "The address of the receiver source. This is the value that should be communicated to the customer to send their funds to."
      },
      {
        "name" : "receiver_amount_charged",
        "type" : "bigint",
        "comment" : "The total amount that was charged by you. The amount charged is expressed in the source's currency.",
        "has_currency" : "currency"
      },
      {
        "name" : "receiver_amount_received",
        "type" : "bigint",
        "comment" : "The total amount received by the receiver source. `amount_received = amount_returned + amount_charged` is true at all time. The amount received is expressed in the source's currency.",
        "has_currency" : "currency"
      },
      {
        "name" : "receiver_amount_returned",
        "type" : "bigint",
        "comment" : "The total amount that was returned to the customer. The amount returned is expressed in the source's currency.",
        "has_currency" : "currency"
      },
      {
        "name" : "redirect_return_url",
        "type" : "varchar",
        "comment" : "The URL you provide to redirect the customer to after they authenticated their payment."
      },
      {
        "name" : "redirect_status",
        "type" : "varchar",
        "comment" : "The status of the redirect, either `pending`, `succeeded` or `failed`."
      },
      {
        "name" : "redirect_url",
        "type" : "varchar",
        "comment" : "The URL provided to you to redirect a customer to as part of a `redirect` authentication flow."
      }
    ]
  },
  {
    "name" : "disputes_metadata",
    "columns" : [
      {
        "name" : "dispute_id",
        "type" : "varchar",
        "comment" : "The ID of the dispute that this metadata entry is associated with.",
        "foreign_key" : "disputes"
      },
      {
        "name" : "key",
        "type" : "varchar",
        "comment" : "Name of the metadata key."
      },
      {
        "name" : "value",
        "type" : "varchar",
        "comment" : "Value of the metadata."
      }
    ]
  },
  {
    "name" : "subscriptions",
    "columns" : [
      {
        "name" : "id",
        "type" : "varchar",
        "comment" : "Unique identifier for the object.",
        "primary_key" : "true"
      },
      {
        "name" : "application_fee_percent",
        "type" : "double",
        "comment" : "A non-negative decimal (with at most two decimal places) between 0 and 100. This represents the percentage of the subscription invoice subtotal that will be transferred to the application owner's Stripe account."
      },
      {
        "name" : "cancel_at_period_end",
        "type" : "boolean",
        "comment" : "If the subscription has been canceled with the `at_period_end` flag set to `true`, `cancel_at_period_end` on the subscription will be true. You can use this attribute to determine whether a subscription that has a status of active is scheduled to be canceled at the end of the current period."
      },
      {
        "name" : "canceled_at",
        "type" : "timestamp",
        "comment" : "If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, canceled_at will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state."
      },
      {
        "name" : "created",
        "type" : "timestamp",
        "comment" : "Time at which the object was created. Measured in seconds since the Unix epoch."
      },
      {
        "name" : "current_period_end",
        "type" : "timestamp",
        "comment" : "End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created."
      },
      {
        "name" : "current_period_start",
        "type" : "timestamp",
        "comment" : "Start of the current period that the subscription has been invoiced for."
      },
      {
        "name" : "customer_id",
        "type" : "varchar",
        "comment" : "ID of the customer who owns the subscription.",
        "foreign_key" : "customers"
      },
      {
        "name" : "ended_at",
        "type" : "timestamp",
        "comment" : "If the subscription has ended (either because it was canceled or because the customer was switched to a subscription to a new plan), the date the subscription ended."
      },
      {
        "name" : "plan_id",
        "type" : "varchar",
        "comment" : "Hash describing the plan the customer is subscribed to.",
        "foreign_key" : "plans"
      },
      {
        "name" : "quantity",
        "type" : "integer",
        "comment" : "The quantity of the plan to which the customer should be subscribed. For example, if your plan is $10/user/month, and your customer has 5 users, you could pass 5 as the quantity to have the customer charged $50 (5 x $10) monthly."
      },
      {
        "name" : "start",
        "type" : "timestamp",
        "comment" : "Date the most recent update to this subscription started."
      },
      {
        "name" : "status",
        "type" : "varchar",
        "comment" : "Possible values are `trialing`, `active`, `past_due`, `canceled`, or `unpaid`. A subscription still in its trial period is `trialing` and moves to `active` when the trial period is over. When payment to renew the subscription fails, the subscription becomes `past_due`. After Stripe has exhausted all payment retry attempts, the subscription ends up with a status of either `canceled` or `unpaid` depending on your retry settings. Note that when a subscription has a status of `unpaid`, no subsequent invoices will be attempted (invoices will be created, but then immediately automatically closed. Additionally, updating customer card details will not lead to Stripe retrying the latest invoice.). After receiving updated card details from a customer, you may choose to reopen and pay their closed invoices."
      },
      {
        "name" : "tax_percent",
        "type" : "double",
        "comment" : "If provided, each invoice created by this subscription will apply the tax rate, increasing the amount billed to the customer."
      },
      {
        "name" : "trial_end",
        "type" : "timestamp",
        "comment" : "If the subscription has a trial, the end of that trial."
      },
      {
        "name" : "trial_start",
        "type" : "timestamp",
        "comment" : "If the subscription has a trial, the beginning of that trial."
      },
      {
        "name" : "discount_coupon_id",
        "type" : "varchar",
        "comment" : "Hash describing the coupon applied to create this discount.",
        "foreign_key" : "coupons"
      },
      {
        "name" : "discount_customer_id",
        "type" : "varchar",
        "comment" : "",
        "foreign_key" : "customers"
      },
      {
        "name" : "discount_end",
        "type" : "timestamp",
        "comment" : "If the coupon has a duration of `once` or `repeating`, the date that this discount will end. If the coupon used has a `forever` duration, this attribute will be null."
      },
      {
        "name" : "discount_start",
        "type" : "timestamp",
        "comment" : "Date that the coupon was applied."
      },
      {
        "name" : "discount_subscription",
        "type" : "varchar",
        "comment" : "The subscription that this coupon is applied to, if it is applied to a particular subscription."
      }
    ]
  }
];
const SCHEMA_SECTIONS = [
  {
    name: 'Payment tables',
    tables: [
      'charges',
      'charges_metadata',
      'disputes',
      'disputes_metadata',
      'balance_transactions',
      'balance_transaction_fee_details',
      'refunds',
      'refunds_metadata',
    ]
  },
  {
    name: 'Transfer tables',
    tables: [
      'transfer_reversals',
      'transfers',
      'transfers_metadata',
    ]
  },
  {
    name: 'Customer tables',
    tables: [
      'customers',
      'customers_metadata',
    ],
  },
  {
    name: 'Subscription tables',
    tables: [
      'subscriptions',
      'subscriptions_metadata',
      'plans',
      'plans_metadata',
      'coupons',
      'coupons_metadata',
      'invoice_items',
      'invoice_items_metadata',
      'invoice_line_items',
      'invoices',
      'invoices_metadata',
    ],
  },
  {
    name: 'Other tables',
    tables: [
      'application_fees',
      'sources',
      'sources_metadata',
      'transfer_reversals_metadata',
    ],
  },
];
const SCHEMA_CONFIG = {
  dom: {
    container: document.querySelector('.schema-ui'),
    list: document.querySelector('.schema-ui .list'),
    listInner: document.querySelector('.schema-ui .list .inner'),
    searchInput: document.querySelector('.schema-ui .search input'),
    searchClear: document.querySelector('.schema-ui .search .clear'),
    tooltip: document.querySelector('.schema-tooltip'),
  },
  layout: {
    top: -15,
    sectionNameRowHeight: 35,
    tableNameRowHeight: 28,
    firstColumnRowPadding: 4,
    columnRowHeight: 24,
    bottom: 10,
    noResultsRowHeight: 60,
  },
  idleAnimation: {
    interval: 3000,
    scrollDuration: 500,
    easing: BezierEasing(0.250, 0.100, 0.250, 1.000),
  },
};



//////////////////////////////////////////////////////////////////////////////////////////



function SchemaUI() {
  const my = this;

  my.idle = false;

  // Create schema list

  my.orderedTables = [];

  SCHEMA_SECTIONS.forEach(section => {
    section.visible = true;

    section.el = UTIL.createEl('div', { className: 'section-name', innerHTML: section.name });
    SCHEMA_CONFIG.dom.listInner.appendChild(section.el);

    section.tables = section.tables.sort().map(tableName => {
      const table = SCHEMA_DATA.find(t => t.name == tableName);
      if (!table) {
        if (DEBUG) console.warn('SCHEMA_DATA is missing', tableName, '— wanted by', section.name);
        return false;
      }

      table.visible = true;
      table.collapsed = true;

      table.el = UTIL.createEl('div', { className: 'table-name', innerHTML: table.name });
      table.el.addEventListener('click', e => {
        if (!my.searchActive) {
          table.collapsed = !table.collapsed;
          my.render();
        } else {
          SCHEMA_CONFIG.dom.searchInput.value = table.name + '.';
          my.filter(table.name + '.');
        }
      });

      SCHEMA_CONFIG.dom.listInner.appendChild(table.el);

      table.columns.forEach(column => {
        column.visible = true;

        column.el = UTIL.createEl('div', { className: 'column' });
        column.el.appendChild(UTIL.createEl('span', { className: 'column-name', innerHTML: column.name }));
        column.el.appendChild(UTIL.createEl('span', { className: 'column-type', innerHTML: column.type }));

        if (column.primary_key || column.foreign_key) column.el.classList.add('key');

        if (column.comment) {
          column.comment = UTIL.miniMarkdown(column.comment);
          column.el.addEventListener('mouseenter', e => my.showTooltip(column) );
          column.el.addEventListener('mouseleave', e => my.hideTooltip() );
        }

        SCHEMA_CONFIG.dom.listInner.appendChild(column.el);
      });

      my.orderedTables.push(table);
      return table;

    }).filter(t => t);
  });

  // More UI setup

  SCHEMA_CONFIG.dom.tooltip.addEventListener('mouseenter', e => clearTimeout(my.hideTooltipTimeout) );
  SCHEMA_CONFIG.dom.tooltip.addEventListener('mouseleave', e => my.hideTooltip() );
  document.body.addEventListener('touchstart', e => my.hideTooltipForReal() );

  SCHEMA_CONFIG.dom.searchInput.addEventListener('input', e => {
    my.filter(SCHEMA_CONFIG.dom.searchInput.value.toLowerCase());

    SCHEMA_CONFIG.dom.searchClear.style.display = SCHEMA_CONFIG.dom.searchInput.value.length ? 'block' : 'none';
  });

  SCHEMA_CONFIG.dom.searchClear.addEventListener('click', e => {
    SCHEMA_CONFIG.dom.searchInput.value = '';
    my.filter('');
    SCHEMA_CONFIG.dom.searchClear.style.display = 'none';
    SCHEMA_CONFIG.dom.searchInput.focus();
  });

  SCHEMA_CONFIG.dom.container.addEventListener('click', e => my.stop() );
  SCHEMA_CONFIG.dom.container.addEventListener('wheel', e => my.stop(), { capture: true });
  SCHEMA_CONFIG.dom.searchInput.addEventListener('focus', e => my.stop() );

  SCHEMA_CONFIG.dom.list.addEventListener('wheel', UTIL.preventWheelBubbles);

  my.render();
}



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.render = function() {
  const my = this;

  const visibleTop = SCHEMA_CONFIG.dom.list.scrollTop - 100;
  const visibleBottom = visibleTop + SCHEMA_CONFIG.dom.list.offsetHeight + 100;

  function isVisible(ypos) {
    return ypos > visibleTop && ypos < visibleBottom;
  }

  function move(item, op) {
    // Skip animation if
    if (
      // this is the first positioning
      item.currentPosition === undefined ||
      // or the item was, and will be, off-screen
      ( !isVisible(item.currentPosition) && !isVisible(y) ) ||
      // or the item was, and will be, invisible
      ( item.currentOpacity === 0 && op === 0 ) ||
      // or the item was off-screen, and will be invisible
      ( !isVisible(item.currentPosition) && op === 0 ) ||
      // or the item is invisible, and will be off-screen
      ( item.currentOpacity === 0 && !isVisible(y) )
    ) {
      item.el.classList.add('no-animation');
    } else {
      item.el.classList.remove('no-animation');
    }

    item.el.style.transform = `translateY(${y}px)`;
    item.el.style.opacity = op;
    item.el.style.pointerEvents = op ? 'auto' : 'none';

    item.currentPosition = y;
    item.currentOpacity = op;
  }

  let resultCount = 0;
  let y = SCHEMA_CONFIG.layout.top;

  // Section
  for (let si = 0; si < SCHEMA_SECTIONS.length; si++) {
    const section = SCHEMA_SECTIONS[si];
    if (section.visible) {
      move(section, 1);
      resultCount++;

      y += SCHEMA_CONFIG.layout.sectionNameRowHeight;

      // Tables
      for (let ti = 0; ti < section.tables.length; ti++) {
        const table = section.tables[ti];
        if (table.visible) {
          move(table, 1);
          resultCount++;

          y += SCHEMA_CONFIG.layout.tableNameRowHeight;
          let firstColumn = true;

          // Columns
          for (let ci = 0; ci < table.columns.length; ci++) {
            const column = table.columns[ci];
            if (column.visible && (!table.collapsed || my.searchActive)) {
              if (firstColumn) y += SCHEMA_CONFIG.layout.firstColumnRowPadding;
              firstColumn = false;

              move(column, 1);
              resultCount++;

              y += SCHEMA_CONFIG.layout.columnRowHeight;

            // Invisible column
            } else {
              move(column, 0);
            }
          }

        // Invisible table
        } else {
          move(table, 0);
          for (let ci = 0; ci < table.columns.length; ci++) move(table.columns[ci], 0);
        }
      }

    // Invisible section
    } else {
      move(section, 0);
      for (let ti = 0; ti < section.tables.length; ti++) {
        const table = section.tables[ti];
        move(table, 0);
        for (let ci = 0; ci < table.columns.length; ci++) move(table.columns[ci], 0);
      }
    }
  }

  y += SCHEMA_CONFIG.layout.bottom;

  if (resultCount) {
    SCHEMA_CONFIG.dom.listInner.classList.remove('no-results');
  } else {
    y = SCHEMA_CONFIG.layout.noResultsRowHeight;
    SCHEMA_CONFIG.dom.listInner.classList.add('no-results');
  }

  SCHEMA_CONFIG.dom.listInner.style.height = y + 'px';
}



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.filter = function(filter) {
  const my = this;

  my.searchActive = filter.length > 0;

  // For queries like 'charges.card'
  if (filter.indexOf('.') > 0) {
    filter = filter.split('.');

    for (let si = 0; si < SCHEMA_SECTIONS.length; si++) {
      const section = SCHEMA_SECTIONS[si];
      section.visible = false;

      for (let ti = 0; ti < section.tables.length; ti++) {
        const table = section.tables[ti];
        table.visible = false;

        for (let ci = 0; ci < table.columns.length; ci++) {
          const column = table.columns[ci];
          if (table.name == filter[0] && column.name.indexOf(filter[1]) >= 0) {
            column.visible = true;
            table.visible = true;
            section.visible = true;
          } else {
            column.visible = false;
          }
        }
      }
    }

  // Normal freeform queries
  } else {
    for (let si = 0; si < SCHEMA_SECTIONS.length; si++) {
      const section = SCHEMA_SECTIONS[si];
      section.visible = false;

      for (let ti = 0; ti < section.tables.length; ti++) {
        const table = section.tables[ti];
        table.visible = false;
        const showAll = filter.length == 0 || table.name.indexOf(filter) >= 0;

        for (let ci = 0; ci < table.columns.length; ci++) {
          const column = table.columns[ci];
          if (showAll || column.name.indexOf(filter) >= 0) {
            column.visible = true;
            table.visible = true;
            section.visible = true
          } else {
            column.visible = false;
          }
        }
      }
    }
  }

  my.render();
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.showTooltip = function(column) {
  const my = this;
  clearTimeout(my.hideTooltipTimeout);

  if (column.comment) {
    SCHEMA_CONFIG.dom.tooltip.innerHTML = column.comment;

    const columnRowRect = column.el.getBoundingClientRect();
    if (Strut.isMobileViewport) {
      SCHEMA_CONFIG.dom.tooltip.style.left = (columnRowRect.left + columnRowRect.width / 2) + 'px';
      SCHEMA_CONFIG.dom.tooltip.style.top = (columnRowRect.top + columnRowRect.height) + 'px';
    } else {
      SCHEMA_CONFIG.dom.tooltip.style.left = (columnRowRect.left + columnRowRect.width) + 'px';
      SCHEMA_CONFIG.dom.tooltip.style.top = (columnRowRect.top + columnRowRect.height / 2) + 'px';
    }

    SCHEMA_CONFIG.dom.tooltip.classList.add('visible');
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.hideTooltip = function(column) {
  const my = this;
  my.hideTooltipTimeout = setTimeout(my.hideTooltipForReal, 200);
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.hideTooltipForReal = function(column) {
  SCHEMA_CONFIG.dom.tooltip.classList.remove('visible');
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.start = function() {
  const my = this;

  if (!my.idle) {
    my.idle = true;

    // First run
    if (!my.idleTickBind) {
      my.idleTickBind = my.idleTick.bind(my);
      my.idleTable = -1;
      my.lastIdleChange = -Infinity;
      createSmoothValue(my, 'idleScrollPosition', 0,
        SCHEMA_CONFIG.idleAnimation.scrollDuration,
        SCHEMA_CONFIG.idleAnimation.easing);
    }

    SCHEMA_CONFIG.dom.container.classList.add('idle', 'idle-animation');
    requestAnimationFrame(my.idleTickBind)
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.stop = function() {
  const my = this;

  if (my.idle) {
    my.idle = false;

    SCHEMA_CONFIG.dom.container.classList.remove('idle');
    SCHEMA_CONFIG.dom.container.addEventListener('animationiteration', e => {
      SCHEMA_CONFIG.dom.container.classList.remove('idle-animation');
    }, { once: true });
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



SchemaUI.prototype.idleTick = function(t) {
  const my = this;
  if (my.idle) {

    if (t - my.lastIdleChange > SCHEMA_CONFIG.idleAnimation.interval) {
      if (my.idleTable >= 0) {
        my.orderedTables[my.idleTable].collapsed = true;

        my.idleScrollPosition = my.orderedTables[my.idleTable].currentPosition
          - SCHEMA_CONFIG.layout.tableNameRowHeight * 2;
      }

      my.idleTable = ++my.idleTable % my.orderedTables.length;
      my.orderedTables[my.idleTable].collapsed = false;

      my.render();
      my.lastIdleChange = t;
    }

    // if (my.__idleScrollPosition.transitionActive) {
    //   SCHEMA_CONFIG.dom.list.scrollTop = my.idleScrollPosition;
    // }

    requestAnimationFrame(my.idleTickBind);
  }
};








const SHARE_CONFIG = {
  dom: {
    container: document.querySelector('.share-animation'),
    conversations: Strut.queryArray('.share-animation > ul'),
  },
  activeClass: 'active',
  interval: 6000,
};



//////////////////////////////////////////////////////////////////////////////////////////



function ShareAnimation() {
  const my = this;

  my.paused = true;
  my.tickBind = my.tick.bind(my);

  my.activeConversation = SHARE_CONFIG.dom.container.querySelector('.' + SHARE_CONFIG.activeClass);
  my.activeIndex = SHARE_CONFIG.dom.conversations.indexOf(my.activeConversation);

  SHARE_CONFIG.dom.conversations.forEach(ul => {
    ul.addEventListener('transitionend', function(e) {
      if (this !== my.activeConversation) {
        this.classList.remove('above');
        this.classList.add('below');
      }
    });
  });
}



//////////////////////////////////////////////////////////////////////////////////////////



ShareAnimation.prototype.tick = function(timestamp) {
  const my = this;

  if (!my.lastSwitch) my.lastSwitch = timestamp;

  if (timestamp - my.lastSwitch > SHARE_CONFIG.interval) {
    my.lastSwitch = timestamp;

    my.activeConversation.classList.remove('active');
    my.activeConversation.classList.add('above');

    my.activeIndex = (my.activeIndex + 1) % SHARE_CONFIG.dom.conversations.length;
    my.activeConversation = SHARE_CONFIG.dom.conversations[my.activeIndex];

    my.activeConversation.classList.add('active');
    my.activeConversation.classList.remove('below');
  }

  if (!my.paused) requestAnimationFrame(my.tickBind);
};



//////////////////////////////////////////////////////////////////////////////////////////



ShareAnimation.prototype.start = function() {
  const my = this;

  if (my.paused) {
    my.paused = false;
    my.lastSwitch = null;
    requestAnimationFrame(my.tickBind);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



ShareAnimation.prototype.stop = function() {
  const my = this;

  my.paused = true;
};
let PRICING_CONFIG = {
  initialPercentage: 0.399,
  dom: {
    container: document.querySelector('.sigma-pricing'),
    transactionsNumber: document.querySelector('.sigma-pricing .transactions-number'),
    monthlyNumber: document.querySelector('.sigma-pricing .monthly-number'),
    knob: document.querySelector('.sigma-pricing .knob'),
    activeRail: document.querySelector('.sigma-pricing .rail.active'),
    activeRailItems: Strut.queryArray('.sigma-pricing .rail.active li'),
    labelsList: document.querySelector('.sigma-pricing .labels'),
    infraFee: document.querySelector('.sigma-pricing .infra-fee'),
    infraFeeNumber: document.querySelector('.sigma-pricing .infra-fee-number'),
  },
  animation: {
    duration: 1000,
    easing: BezierEasing(0.250, 0.100, 0.200, 1.000),
  },
};



//////////////////////////////////////////////////////////////////////////////////////////



function PricingCalculator() {
  const my = this;

  my.percentage = 0;
  my.analyticsTimeout;

  PRICING_DATA.tiers = PRICING_DATA.tiers.map((tier, i) => {
    tier.min = (i === 0) ? 0 : PRICING_DATA.tiers[i - 1].max;
    return tier;
  });

  PRICING_CONFIG.dom.labels = PRICING_DATA.tiers.map((tier, i) => {
    const floor = (tier.min + 1).toLocaleString(PRICING_DATA.locale);

    const ceil = tier.max === Infinity
      ? '∞'
      : tier.max.toLocaleString(PRICING_DATA.locale);

    let html = `<h3>${floor}&ndash;${ceil}</h3>`;

    if (tier.txn) {
      const fee = PRICING_DATA.cents
        ? (tier.txn * 100).toLocaleString(PRICING_DATA.locale) + PRICING_DATA.cents
        : UTIL.currency(tier.txn, PRICING_DATA.locale, PRICING_DATA.currency, 3);

      html +=`<p>${fee}<span class='slash'>/</span>${PRICING_DATA.chargeText}</p>`;
    }

    const label = UTIL.createEl('li', { innerHTML: html });

    PRICING_CONFIG.dom.labelsList.appendChild(label);
    return label;
  });

  UTIL.addNormalizedListener(PRICING_CONFIG.dom.activeRail, 'down', (e, p) => {
    my.dragging = true;
    my.railRect = PRICING_CONFIG.dom.activeRail.getBoundingClientRect();
    my.setPercentage(Strut.clamp(
      Strut.rangePosition(my.railRect.left, my.railRect.left + my.railRect.width, e.clientX),
      0, 1
    ));
    UTIL.setVendorStyle(PRICING_CONFIG.dom.container, 'user-select', 'none');
  });

  UTIL.addNormalizedListener(PRICING_CONFIG.dom.knob, 'down', (e, p) => {
    my.dragging = true;
    my.railRect = PRICING_CONFIG.dom.activeRail.getBoundingClientRect();
    UTIL.setVendorStyle(PRICING_CONFIG.dom.container, 'user-select', 'none');
  });

  UTIL.addNormalizedListener(document.body, 'up', (e, p) => {
    my.dragging = false;
    UTIL.setVendorStyle(PRICING_CONFIG.dom.container, 'user-select', 'auto');
  });

  UTIL.addNormalizedListener(document.body, 'move', (e, p) => {
    if (my.dragging) {
      e.preventDefault();
      my.setPercentage(Strut.clamp(
        Strut.rangePosition(my.railRect.left, my.railRect.left + my.railRect.width, p.x),
        0, 1
      ));
    }
  });
}



//////////////////////////////////////////////////////////////////////////////////////////



PricingCalculator.prototype.setPercentage = function(percentage, skipAnalytics) {
  const my = this;

  my.percentage = percentage;
  PRICING_CONFIG.dom.knob.style.left = (my.percentage * 100) + '%';

  // Calculate pricing

  my.contactSales = false;
  let tierIndex = Math.min(Math.floor(my.percentage * PRICING_DATA.tiers.length), PRICING_DATA.tiers.length - 1);
  let txnFloor = PRICING_DATA.tiers[tierIndex].min;
  let txnCeil = PRICING_DATA.tiers[tierIndex].max;

  let tierPerc = Strut.rangePosition(
    tierIndex / PRICING_DATA.tiers.length,
    (tierIndex + 1) / PRICING_DATA.tiers.length,
    my.percentage
  );

  if (txnCeil === Infinity) {
    my.contactSales = true;

  } else {
    const rawTxn = Strut.interpolate(txnFloor, txnCeil, tierPerc);
    const roundTo = rawTxn > 10000 ? 100 : 10;
    my.transactionsPerMonth = Math.round(rawTxn / roundTo) * roundTo;

    let foundTier = false;

    my.transactionsCost = PRICING_DATA.tiers.reduce((acc, tier, i) => {
      if (tier.max < my.transactionsPerMonth) {
        return acc += tier.txn * (tier.max - tier.min);
      } else if (tier.max >= my.transactionsPerMonth && !foundTier) {
        foundTier = true;
        tierIndex = i;
        txnFloor = tier.min;
        txnCeil = tier.max;
        my.infraFee = tier.infra;
        return acc += tier.txn * (my.transactionsPerMonth - tier.min);
      } else {
        return acc;
      }
    }, 0);

    my.totalMonthlyCost = my.transactionsCost + my.infraFee;
  }

  tierPerc = Strut.rangePosition(
    tierIndex / PRICING_DATA.tiers.length,
    (tierIndex + 1) / PRICING_DATA.tiers.length,
    my.percentage
  );

  // Update total

  if (my.contactSales) {
    PRICING_CONFIG.dom.transactionsNumber.innerHTML = (txnFloor + 1).toLocaleString(PRICING_DATA.locale) + '+';
    PRICING_CONFIG.dom.container.classList.add('contact-sales');

  } else {
    PRICING_CONFIG.dom.transactionsNumber.innerHTML = my.transactionsPerMonth.toLocaleString(PRICING_DATA.locale);
    PRICING_CONFIG.dom.monthlyNumber.innerHTML = UTIL.currency(my.totalMonthlyCost, PRICING_DATA.locale, PRICING_DATA.currency, PRICING_DATA.decimals);
    PRICING_CONFIG.dom.container.classList.remove('contact-sales');
  }

  // Update rail

  PRICING_CONFIG.dom.activeRailItems.forEach((el, i) => {
    if (i < tierIndex) {
      el.style.width = (100 / PRICING_DATA.tiers.length) + '%';
      el.style.display = 'block';
    } else if (i == tierIndex) {
      el.style.width = (100 / PRICING_DATA.tiers.length) * tierPerc + '%';
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });

  // Update labels

  PRICING_CONFIG.dom.labels.forEach((el, i) => {
    if (i <= tierIndex) el.classList.add('active');
    else el.classList.remove('active');
  });

  // Update infra fee

  if (!my.contactSales) {
    PRICING_CONFIG.dom.infraFee.style.opacity = 1;
    PRICING_CONFIG.dom.infraFee.style.left = ((tierIndex + 0.5) / (PRICING_DATA.tiers.length)) * 100 + '%';
    PRICING_CONFIG.dom.infraFeeNumber.innerHTML = UTIL.currency(my.infraFee, PRICING_DATA.locale, PRICING_DATA.currency, 0);
  }

  // Analytics

  if (!skipAnalytics) {
    clearTimeout(my.analyticsTimeout);
    my.analyticsTimeout = setTimeout(() => {
      if (window.siteAnalyticsUtil && window.siteAnalytics.trackSigmaPricingSlider) {
        window.siteAnalytics.trackSigmaPricingSlider();
      }
    }, 3000);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



PricingCalculator.prototype.animatePercentage = function(newPercentage) {
  const my = this;

  createSmoothValue(my, 'animatePercentageValue', my.percentage,
    PRICING_CONFIG.animation.duration, PRICING_CONFIG.animation.easing);

  my.animatePercentageValue = newPercentage;

  my.animateTickBind = my.animateTick.bind(my);
  my.animateTick();
};



//////////////////////////////////////////////////////////////////////////////////////////



PricingCalculator.prototype.animateTick = function() {
  const my = this;

  my.setPercentage(my.animatePercentageValue, true);

  if (my.__animatePercentageValue.transitionActive) requestAnimationFrame(my.animateTickBind);
};



//////////////////////////////////////////////////////////////////////////////////////////



PricingCalculator.prototype.start = function() {
  const my = this;
  if (!my.started) {
    my.animatePercentage(PRICING_CONFIG.initialPercentage);
    my.started = true;
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



PricingCalculator.prototype.stop = function() {
  // Just for the Manager
};


const POINTS_CACHE = [];

function Points(opt) {

  opt = opt || {};
  const PointRadius = opt.pointRadius || 0.01;
  const Ac = opt.ac || { x: -2, y: -2 }; // Center of circle A
  const ArBase = opt.arBase || 1.0; // Starting radius of circle A
  const Bc = opt.bc || { x: -2, y: 2 }; // Center of circle B
  const BrBase = opt.brBase || 1.0; // Starting radius of circle B
  const dR = opt.dr || 2.5 * PointRadius; // Distance between concentric rings

  // http://www.xarg.org/2016/07/calculate-the-intersection-points-of-two-circles/

  function circleCircleIntersections(Ac, Ar, Bc, Br) {
    const d = Math.hypot(Bc.x - Ac.x, Bc.y - Ac.y);
    let P1, P2;

    if (d <= Ar + Br) {

        const x = (Ar * Ar - Br * Br + d * d) / (2 * d);
        const y = Math.sqrt(Ar * Ar - x * x);

        if (Ar < Math.abs(x)) {
            // No intersection, one circle is inside the other
            P1 = P2 = null;
        } else {

            const ex = (Bc.x - Ac.x) / d;
            const ey = (Bc.y - Ac.y) / d;

            P1 = {
                x: Ac.x + x * ex - y * ey,
                y: Ac.y + x * ey + y * ex
            };

            P2 = {
                x: Ac.x + x * ex + y * ey,
                y: Ac.y + x * ey - y * ex
            };
        }
    } else {
        // No Intersection, far outside
        P1 = P2 = null
    }

    return [P1, P2];
  }

  if (!POINTS_CACHE.length) {

    // https://mollyrocket.com/casey/stream_0016.html

    for (let RadiusStepA = 0; RadiusStepA < 128; ++RadiusStepA) {
      const Ar = ArBase + dR * RadiusStepA;
      for (let RadiusStepB = 0; RadiusStepB < 128; ++RadiusStepB) {
        const Br = BrBase + dR * RadiusStepB;

        const UseAr = Ar + ((RadiusStepB % 3) ? 0.0 : 0.3 * dR);
        const UseBr = Br + ((RadiusStepA % 3) ? 0.0 : 0.3 * dR);

        circleCircleIntersections(Ac, UseAr, Bc, UseBr).forEach(p => {
          if (p && p.x < 1 && p.x > -1 && p.y < 1 && p.y > -1) POINTS_CACHE.push([ p.x, p.y ]);
        })
       }
    }
  }

  return POINTS_CACHE;

}
const PATTERN_SPRINKLES = {
  canvas: document.createElement('canvas'),
  backgroundEl: document.querySelector('.sigma-header .stripes-container .pattern'),
  width: 1000,
  height: 245,
  skipClip: true,

  setup: (my) => {
    my.ctx.lineCap = 'round';
    my.ctx.lineWidth = 2;
    my.ctx.strokeStyle = 'rgba(167, 140, 233, 0.5)';

    my.conf.backgroundEl.style.backgroundSize = `100%, ${my.conf.width}px ${my.conf.height}px`;
    my.conf.backgroundEl.style.backgroundPosition = 'center';
    my.origBackground = getComputedStyle(my.conf.backgroundEl).getPropertyValue('background-image');

    my.padding = 10;

    my.points = Points().map(p => {
      p = {
        x: p[0] * 1200,
        y: p[1] * 1200,
      };

      if (
        p.x > 0 && p.x < my.conf.width &&
        p.y > my.padding && p.y < my.conf.height - my.padding
      ) return p;
      else return false;
    }).filter(p => p);
  },

  loop: (my) => {
    my.ctx.beginPath();

    for (let i = 0; i < my.points.length; i++) {
      const p = my.points[i];

      const a = noise( i * 751 + my.now * 0.00020 ) * Math.PI * 2;
      const ax = Math.cos(a) * 6;
      const ay = Math.sin(a) * 6;

      my.ctx.moveTo(p.x - ax, p.y - ay);
      my.ctx.lineTo(p.x + ax, p.y + ay);

      if (p.x < 20) {
        my.ctx.moveTo(p.x - ax + my.conf.width, p.y - ay);
        my.ctx.lineTo(p.x + ax + my.conf.width, p.y + ay);
      } else if (p.x > my.conf.width - 20) {
        my.ctx.moveTo(p.x - ax - my.conf.width, p.y - ay);
        my.ctx.lineTo(p.x + ax - my.conf.width, p.y + ay);
      }
    }

    my.ctx.stroke();
    my.conf.backgroundEl.style.backgroundImage = `${my.origBackground}, url(%24%7bmy.conf.canvas.html)})`;
  }
};
const PATTERN_BUBBLES = {
  canvas: document.querySelector('.pattern-bubbles'),
  width: 1200,
  height: 1200,
  clip: false,

  setup: (my) => {
    my.ctx.lineWidth = 2;
    my.ctx.strokeStyle = '#ffcca5';

    my.points = Points().map(p => {
      p = {
        x: p[0] * 1350,
        y: p[1] * 1350,
      };

      if (my.ctx.isPointInPath(p.x * my.scale, p.y * my.scale)) return p;
      else return false;
    }).filter(p => p);
  },

  loop: (my) => {
    my.ctx.beginPath();

    for (let i = 0; i < my.points.length; i++) {
      const p = my.points[i];

      const x = p.x + (noise( i * i * 123 + my.now * 0.000016 ) - 0.5) * 15;
      const y = p.y + (noise( i * 9820 + my.now * 0.00020 ) - 0.5) * 15;

      my.ctx.moveTo(x + 5, y);
      my.ctx.arc(x, y, 5, 0, Math.PI * 2);
    }

    my.ctx.stroke();
  }
};
const PATTERN_WAVES = {
  canvas: document.querySelector('.pattern-waves'),
  width: 1200,
  height: 1200,
  clip: true,

  setup: (my) => {
    my.ctx.lineWidth = 2;
    my.ctx.strokeStyle = '#9cdbff';
  },

  loop: (my) => {

    for (var y = 10; y < my.conf.height; y += 25) {
      my.ctx.beginPath();

      const xo = noise( y * 92 + my.now * 0.0002 ) * 50;

      for (var x = 0; x < my.conf.width; x += 4) {
        my.ctx.lineTo(x + xo, y + Math.cos(x * 0.15 + my.now * -0.0005) * 3);
      }

      my.ctx.stroke();
    }
  }
};
const PATTERN_ARROWS = {
  canvas: document.querySelector('.pattern-sprinkles'),
  width: 1200,
  height: 1200,
  clip: false,
  radius: 6,

  setup: (my) => {
    my.ctx.lineCap = 'round';
    my.ctx.lineJoin = 'round';
    my.ctx.lineWidth = 2;
    my.ctx.strokeStyle = '#beb0f4';

    my.points = Points().map(p => {
      p = {
        x: p[0] * 1300,
        y: p[1] * 1300,
      };

      if (my.ctx.isPointInPath(p.x * my.scale, p.y * my.scale)) return p;
      else return false;
    }).filter(p => p);
  },

  loop: (my) => {
    my.ctx.beginPath();

    for (let i = 0; i < my.points.length; i++) {
      const p = my.points[i];

      const a = noise( i * 751 + my.now * 0.00020 ) * Math.PI * 2;

      my.ctx.moveTo(p.x + my.conf.radius * Math.cos(a),
        p.y + my.conf.radius * Math.sin(a));
      my.ctx.lineTo(p.x + my.conf.radius * Math.cos(a + Math.PI / 2),
        p.y + my.conf.radius * Math.sin(a + Math.PI / 2));
      my.ctx.lineTo(p.x + my.conf.radius * Math.cos(a + Math.PI),
        p.y + my.conf.radius * Math.sin(a + Math.PI));
    }

    my.ctx.stroke();
  }
};
function PatternDots(opt) {
  return {
    canvas: document.createElement('canvas'),
    backgroundEl: opt.backgroundEl,
    width: 600,
    height: 245,
    skipClip: true,
    color: opt.color,

    setup: (my) => {
      if (!my.conf.backgroundEl) return;

      my.ctx.lineWidth = 2;
      my.ctx.fillStyle = my.conf.color;

      my.conf.backgroundEl.style.backgroundSize = `${my.conf.width}px ${my.conf.height}px`;

      my.padding = 10;

      my.radius = 3;
      my.diameter = my.radius * 2;
      my.skewFactor = 0.6;
      my.radiusL = my.diameter * my.skewFactor;
      my.radiusS = my.diameter - my.radiusL;
      my.centerOffset = my.radiusL - my.radius;

      my.points = Points().map(p => {
        p = {
          x: p[0] * 1000,
          y: p[1] * 1000,
        };

        if (
          p.x > my.padding && p.x < my.conf.width - my.padding &&
          p.y > my.padding && p.y < my.conf.height - my.padding
        ) return p;
        else return false;
      }).filter(p => p);
    },

    loop: (my) => {
      if (!my.conf.backgroundEl) return;
      
      my.ctx.beginPath();

      for (let i = 0; i < my.points.length; i++) {
        const p = my.points[i];

        const x = p.x + (noise( i * i * 123 + my.now * 0.000016 ) - 0.5) * 10;
        const y = p.y + (noise( i * 9820 + my.now * 0.00020 ) - 0.5) * 10;

        my.ctx.moveTo(x - my.radius, y - my.centerOffset);
        my.ctx.arc(x + my.centerOffset, y + my.centerOffset, my.radiusS, 0, Math.PI * 0.5);
        my.ctx.arc(x + my.centerOffset, y - my.centerOffset, my.radiusL, Math.PI * 0.5, Math.PI);
        my.ctx.arc(x - my.centerOffset, y - my.centerOffset, my.radiusS, Math.PI, Math.PI * 1.5);
        my.ctx.arc(x - my.centerOffset, y + my.centerOffset, my.radiusL, Math.PI * 1.5, Math.PI * 2);
      }

      my.ctx.fill();
      my.conf.backgroundEl.style.backgroundImage = `url(%24%7bmy.conf.canvas.html)})`;
    }
  };
};

const PATTERN_DOTS_PINK = new PatternDots({ 
  color: 'rgba(183, 106, 196, 0.6)',
  backgroundEl: document.querySelector('.sigma-quotes .quote-stripe1'),
});

const PATTERN_DOTS_ORANGE = new PatternDots({ 
  color: '#e3904c',
  backgroundEl: document.querySelector('.sigma-quotes .quote-stripe2'),
});
function Pattern(conf) {
  const my = this;

  my.conf = conf;
  my.now = 0;
  my.lastTick = 0;
  my.paused = true;

  // Set up canvas

  my.scale = window.devicePixelRatio;

  my.conf.canvas.style.width = my.conf.width + 'px';
  my.conf.canvas.style.height = my.conf.height + 'px';
  my.conf.canvas.width = my.conf.width * my.scale;
  my.conf.canvas.height = my.conf.height * my.scale;

  my.ctx = my.conf.canvas.getContext('2d');
  my.ctx.scale(my.scale, my.scale);

  // Create 12° mask

  if (!my.skipClip) {
    const TWELVE_DEGREES = 12 * Math.PI / 180;
    my.padding = 20;
    my.elevation = Math.sin(TWELVE_DEGREES) * (my.conf.width - my.padding * 2);

    my.ctx.beginPath();
    my.ctx.moveTo(my.padding, my.padding + my.elevation);
    my.ctx.lineTo(my.conf.width - my.padding, my.padding);
    my.ctx.lineTo(my.conf.width - my.padding, my.conf.height - my.elevation - my.padding);
    my.ctx.lineTo(my.padding, my.conf.height - my.padding);
    my.ctx.closePath();

    if (my.conf.clip) my.ctx.clip();
  }

  // Run pattern config setup fn

  my.conf.setup(my);

  // Finish

  my.renderBind = my.render.bind(my);
  my.render(0);
}



//////////////////////////////////////////////////////////////////////////////////////////



Pattern.prototype.render = function(timestamp) {
  const my = this;

  my.now = timestamp;
  my.delta = my.now - my.lastTick;

  // if (my.delta < 1000/30) return;

  my.ctx.clearRect(0, 0, my.conf.width, my.conf.height);
  my.conf.loop(my);

  my.lastTick = my.now;

  if (!my.paused) requestAnimationFrame(my.renderBind);
};



//////////////////////////////////////////////////////////////////////////////////////////



Pattern.prototype.start = function() {
  const my = this;
  if (my.paused) {
    my.paused = false;
    requestAnimationFrame(my.renderBind);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////



Pattern.prototype.stop = function() {
  const my = this;
  my.paused = true;
};




function Manager(conf) {
  const my = this;
  my.conf = conf;

  Strut.ready(() => {

    if (!window.IntersectionObserver) {
      my.update();
      my.updateBind = my.update.bind(my);
      window.addEventListener('scroll', my.updateBind);
      window.addEventListener('load', my.updateBind);

    } else {
      my.conf.forEach(item => {
        item.observer = new IntersectionObserver(intersections => {
          intersections.forEach(intersection => {
            if (intersection.isIntersecting || intersection.intersectionRatio > 0) {
              if (DEBUG) console.log('Starting', item);
              item.controller.start.call(item.controller);
            } else {
              if (DEBUG) console.log('Stopping', item);
              item.controller.stop.call(item.controller);
            }
          });
        });
        item.observer.observe(item.element);
      });
    }

  });
}



//////////////////////////////////////////////////////////////////////////////////////////



Manager.prototype.update = function() {
  const my = this;

  my.conf.forEach(item => {
    item.rect = item.element.getBoundingClientRect();

    const nowVisible = (
      item.rect.top < window.innerHeight &&
      item.rect.top + item.rect.height > 0 &&
      item.rect.left < window.innerWidth &&
      item.rect.left + item.rect.width > 0
    );

    if (!item.visible && nowVisible) {
      if (DEBUG) console.log('Starting', item);
      item.controller.start.call(item.controller);
    } else if (item.visible && !nowVisible) {
      if (DEBUG) console.log('Stopping', item);
      item.controller.stop.call(item.controller);
    }

    item.visible = nowVisible;
  });
};




(function() {
  if (window.$ && window.$.ajaxPrefilter) {
    $(function() {
      return $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        var csrfToken, csrfTokenEl;
        csrfTokenEl = $('meta[name=csrf-token]');
        csrfToken = csrfTokenEl ? csrfTokenEl.attr('content') : '';
        return jqXHR.setRequestHeader('x-stripe-csrf-token', csrfToken);
      });
    });
  }

}).call(this);







































const DEBUG = false;

const HEADER_VIDEO = new VideoController(HEADER_VIDEO_CONFIG);
const IDE_ANIMATION = new IDEAnimation();
const SCHEMA_UI = new SchemaUI();
const SHARE_ANIMATION = new ShareAnimation();
const PRICING = new PricingCalculator();

const PATTERN_HEADER = new Pattern(PATTERN_SPRINKLES);
const PATTERN_IDE = new Pattern(PATTERN_BUBBLES);
const PATTERN_DATA = new Pattern(PATTERN_WAVES);
const PATTERN_SHARE = new Pattern(PATTERN_ARROWS);
const PATTERN_QUOTE2 = new Pattern(PATTERN_DOTS_PINK);
const PATTERN_QUOTE3 = new Pattern(PATTERN_DOTS_ORANGE);

// Start/stop based on visiblity
new Manager([
  { controller: HEADER_VIDEO, element: HEADER_VIDEO.conf.dom.videoEl },
  { controller: IDE_ANIMATION, element: document.querySelector('.ide-animation') },
  { controller: SCHEMA_UI, element: document.querySelector('.schema-ui') },
  { controller: SHARE_ANIMATION, element: document.querySelector('.share-animation') },
  { controller: PRICING, element: document.querySelector('.sigma-pricing .slider') },
]);

// Wait until fonts have loaded or the card textures might be messed up
Promise.all([
  new FontFaceObserver('Camphor', { weight: 400 }).load(),
  new FontFaceObserver('Camphor', { weight: 500 }).load(),
  new FontFaceObserver('Camphor', { weight: 600 }).load(),
]).then(() => {
  if (DEBUG) console.log('Fonts have loaded');

  window.SCENE = new Scene();
  window.SELECTOR = new Selector();
  SELECTOR.scene = SCENE;
  SCENE.selector = SELECTOR;

  new Manager([{ controller: SCENE, element: SCENE_CONFIG.dom.canvas }]);

  // Because sometimes FontFaceObserver isn't enough
  window.addEventListener('load', SELECTOR.testFontChangeBind);
});
