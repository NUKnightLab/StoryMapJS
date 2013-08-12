/*!
	VCO
*/

(function (root) {
	root.VCO = {
		VERSION: '0.1',
		_originalL: root.VCO
	};
}(this));

/*	VCO.Debug
	Debug mode
================================================== */
VCO.debug = true;



/*	VCO.Bind
================================================== */
VCO.Bind = function (/*Function*/ fn, /*Object*/ obj) /*-> Object*/ {
	return function () {
		return fn.apply(obj, arguments);
	};
};



/* Trace (console.log)
================================================== */
trace = function( msg ) {
	if (VCO.debug) {
		if (window.console) {
			console.log(msg);
		} else if ( typeof( jsTrace ) != 'undefined' ) {
			jsTrace.send( msg );
		} else {
			//alert(msg);
		}
	}
}

/* **********************************************
     Begin VCO.Util.js
********************************************** */

/*	VCO.Util
	Class of utilities
================================================== */
VCO.Util = {
	
	extend: function (/*Object*/ dest) /*-> Object*/ {	// merge src properties into dest
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var j = 0, len = sources.length, src; j < len; j++) {
			src = sources[j] || {};
			for (var i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	},
	
	setOptions: function (obj, options) {
		obj.options = VCO.Util.extend({}, obj.options, options);
		if (obj.options.uniqueid === "") {
			obj.options.uniqueid = VCO.Util.unique_ID(6);
		}
	},
	
	setData: function (obj, data) {
		obj.data = VCO.Util.extend({}, obj.data, data);
		if (obj.data.uniqueid === "") {
			obj.data.uniqueid = VCO.Util.unique_ID(6);
		}
	},
	
	stamp: (function () {
		var lastId = 0, key = '_vco_id';
		return function (/*Object*/ obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),
	
	isArray: (function () {
	    // Use compiler's own isArray when available
	    if (Array.isArray) {
	        return Array.isArray;
	    }
 
	    // Retain references to variables for performance
	    // optimization
	    var objectToStringFn = Object.prototype.toString,
	        arrayToStringResult = objectToStringFn.call([]);
 
	    return function (subject) {
	        return objectToStringFn.call(subject) === arrayToStringResult;
	    };
	}()),
	
	unique_ID: function(size, prefix) {
		
		var getRandomNumber = function(range) {
			return Math.floor(Math.random() * range);
		};

		var getRandomChar = function() {
			var chars = "abcdefghijklmnopqurstuvwxyz";
			return chars.substr( getRandomNumber(32), 1 );
		};

		var randomID = function(size) {
			var str = "";
			for(var i = 0; i < size; i++) {
				str += getRandomChar();
			}
			return str;
		};
		
		if (prefix) {
			return prefix + "-" + randomID(size);
		} else {
			return "vco-" + randomID(size);
		}
	},
	
	htmlify: function(str) {
		if (str.match(/<\s*p[^>]*>([^<]*)<\s*\/\s*p\s*>/)) {
			return str;
		} else {
			return "<p>" + str + "</p>";
		}
	},
	
	getParamString: function (obj) {
		var params = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				params.push(i + '=' + obj[i]);
			}
		}
		return '?' + params.join('&');
	},
	
	template: function (str, data) {
		return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
			var value = data[key];
			if (!data.hasOwnProperty(key)) {
				throw new Error('No value provided for variable ' + str);
			}
			return value;
		});
	}
};

/* **********************************************
     Begin VCO.Class.js
********************************************** */

/*	VCO.Class
	Class powers the OOP facilities of the library.
================================================== */
VCO.Class = function () {};

VCO.Class.extend = function (/*Object*/ props) /*-> Class*/ {

	// extended class with the new prototype
	var NewClass = function () {
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}
	};

	// instantiate class without calling constructor
	var F = function () {};
	F.prototype = this.prototype;
	var proto = new F();

	proto.constructor = NewClass;
	NewClass.prototype = proto;

	// add superclass access
	NewClass.superclass = this.prototype;

	// add class name
	//proto.className = props;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype' && i !== 'superclass') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		VCO.Util.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		VCO.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (props.options && proto.options) {
		props.options = VCO.Util.extend({}, proto.options, props.options);
	}

	// mix given properties into the prototype
	VCO.Util.extend(proto, props);

	// allow inheriting further
	NewClass.extend = VCO.Class.extend;

	// method for adding properties to prototype
	NewClass.include = function (props) {
		VCO.Util.extend(this.prototype, props);
	};

	return NewClass;
};


/* **********************************************
     Begin VCO.Events.js
********************************************** */

/*	VCO.Events
	adds custom events functionality to VCO classes
================================================== */
VCO.Events = {
	addEventListener: function (/*String*/ type, /*Function*/ fn, /*(optional) Object*/ context) {
		var events = this._vco_events = this._vco_events || {};
		events[type] = events[type] || [];
		events[type].push({
			action: fn,
			context: context || this
		});
		return this;
	},

	hasEventListeners: function (/*String*/ type) /*-> Boolean*/ {
		var k = '_vco_events';
		return (k in this) && (type in this[k]) && (this[k][type].length > 0);
	},

	removeEventListener: function (/*String*/ type, /*Function*/ fn, /*(optional) Object*/ context) {
		if (!this.hasEventListeners(type)) {
			return this;
		}

		for (var i = 0, events = this._vco_events, len = events[type].length; i < len; i++) {
			if (
				(events[type][i].action === fn) &&
				(!context || (events[type][i].context === context))
			) {
				events[type].splice(i, 1);
				return this;
			}
		}
		return this;
	},

	fireEvent: function (/*String*/ type, /*(optional) Object*/ data) {
		if (!this.hasEventListeners(type)) {
			return this;
		}

		var event = VCO.Extend({
			type: type,
			target: this
		}, data);

		var listeners = this._vco_events[type].slice();

		for (var i = 0, len = listeners.length; i < len; i++) {
			listeners[i].action.call(listeners[i].context || this, event);
		}

		return this;
	}
};

VCO.Events.on	= VCO.Events.addEventListener;
VCO.Events.off	= VCO.Events.removeEventListener;
VCO.Events.fire = VCO.Events.fireEvent;

/* **********************************************
     Begin VCO.Browser.js
********************************************** */


(function () {
	var ua = navigator.userAgent.toLowerCase(),
		ie = !!window.ActiveXObject,
		webkit = ua.indexOf("webkit") !== -1,
		mobile = typeof orientation !== 'undefined' ? true : false,
		android = ua.indexOf("android") !== -1,
		opera = window.opera;

	VCO.Browser = {
		ie: ie,
		ie6: ie && !window.XMLHttpRequest,

		webkit: webkit,
		webkit3d: webkit && ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()),

		gecko: ua.indexOf("gecko") !== -1,

		opera: opera,

		android: android,
		mobileWebkit: mobile && webkit,
		mobileOpera: mobile && opera,

		mobile: mobile,
		touch: (function () {
			var touchSupported = false,
				startName = 'ontouchstart';

			// WebKit, etc
			if (startName in document.documentElement) {
				return true;
			}

			// Firefox/Gecko
			var e = document.createElement('div');

			// If no support for basic event stuff, unlikely to have touch support
			if (!e.setAttribute || !e.removeAttribute) {
				return false;
			}

			e.setAttribute(startName, 'return;');
			if (typeof e[startName] === 'function') {
				touchSupported = true;
			}

			e.removeAttribute(startName);
			e = null;

			return touchSupported;
		}())
	};

}());

/* **********************************************
     Begin VCO.Ease.js
********************************************** */

/* The equations defined here are open source under BSD License.
 * http://www.robertpenner.com/easing_terms_of_use.html (c) 2003 Robert Penner
 * Adapted to single time-based by
 * Brian Crescimanno <brian.crescimanno@gmail.com>
 * Ken Snyder <kendsnyder@gmail.com>
 */

/** MIT License
 *
 * KeySpline - use bezier curve for transition easing function
 * Copyright (c) 2012 Gaetan Renaudeau <renaudeau.gaetan@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * KeySpline - use bezier curve for transition easing function
 * is inspired from Firefox's nsSMILKeySpline.cpp
 * Usage:
 * var spline = new KeySpline(0.25, 0.1, 0.25, 1.0)
 * spline.get(x) => returns the easing value | x must be in [0, 1] range
 */

VCO.Easings = {
    "ease":        [0.25, 0.1, 0.25, 1.0], 
    "linear":      [0.00, 0.0, 1.00, 1.0],
    "ease-in":     [0.42, 0.0, 1.00, 1.0],
    "ease-out":    [0.00, 0.0, 0.58, 1.0],
    "ease-in-out": [0.42, 0.0, 0.58, 1.0]
};

VCO.Ease = {

	KeySpline: function(mX1, mY1, mX2, mY2) {
		this.get = function(aX) {
			if (mX1 == mY1 && mX2 == mY2) return aX; // linear
			return CalcBezier(GetTForX(aX), mY1, mY2);
		}

		function A(aA1, aA2) {
			return 1.0 - 3.0 * aA2 + 3.0 * aA1;
		}

		function B(aA1, aA2) {
			return 3.0 * aA2 - 6.0 * aA1;
		}

		function C(aA1) {
			return 3.0 * aA1;
		}

		// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.

		function CalcBezier(aT, aA1, aA2) {
			return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
		}

		// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.

		function GetSlope(aT, aA1, aA2) {
			return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
		}

		function GetTForX(aX) {
			// Newton raphson iteration
			var aGuessT = aX;
			for (var i = 0; i < 4; ++i) {
				var currentSlope = GetSlope(aGuessT, mX1, mX2);
				if (currentSlope == 0.0) return aGuessT;
				var currentX = CalcBezier(aGuessT, mX1, mX2) - aX;
				aGuessT -= currentX / currentSlope;
			}
			return aGuessT;
		}
	},
	
	easeInSpline: function(t) {
		var spline = new VCO.Ease.KeySpline(0.42, 0.0, 1.00, 1.0);
		return spline.get(t);
	},
	easeOut: function(t) {
		trace(t);
		return Math.sin(t * Math.PI / 2);
	},
	easeOutStrong: function(t) {
		return (t == 1) ? 1 : 1 - Math.pow(2, - 10 * t);
	},
	easeIn: function(t) {
		return t * t;
	},
	easeInStrong: function(t) {
		return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1));
	},
	easeOutBounce: function(pos) {
		if ((pos) < (1 / 2.75)) {
			return (7.5625 * pos * pos);
		} else if (pos < (2 / 2.75)) {
			return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
		} else if (pos < (2.5 / 2.75)) {
			return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
		} else {
			return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
		}
	},
	easeInBack: function(pos) {
		var s = 1.70158;
		return (pos) * pos * ((s + 1) * pos - s);
	},
	easeOutBack: function(pos) {
		var s = 1.70158;
		return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
	},
	bounce: function(t) {
		if (t < (1 / 2.75)) {
			return 7.5625 * t * t;
		}
		if (t < (2 / 2.75)) {
			return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
		}
		if (t < (2.5 / 2.75)) {
			return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
		}
		return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
	},
	bouncePast: function(pos) {
		if (pos < (1 / 2.75)) {
			return (7.5625 * pos * pos);
		} else if (pos < (2 / 2.75)) {
			return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
		} else if (pos < (2.5 / 2.75)) {
			return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
		} else {
			return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
		}
	},
	swingTo: function(pos) {
		var s = 1.70158;
		return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
	},
	swingFrom: function(pos) {
		var s = 1.70158;
		return pos * pos * ((s + 1) * pos - s);
	},
	elastic: function(pos) {
		return -1 * Math.pow(4, - 8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
	},
	spring: function(pos) {
		return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
	},
	blink: function(pos, blinks) {
		return Math.round(pos * (blinks || 5)) % 2;
	},
	pulse: function(pos, pulses) {
		return (-Math.cos((pos * ((pulses || 5) - .5) * 2) * Math.PI) / 2) + .5;
	},
	wobble: function(pos) {
		return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
	},
	sinusoidal: function(pos) {
		return (-Math.cos(pos * Math.PI) / 2) + 0.5;
	},
	flicker: function(pos) {
		var pos = pos + (Math.random() - 0.5) / 5;
		return easings.sinusoidal(pos < 0 ? 0 : pos > 1 ? 1 : pos);
	},
	mirror: function(pos) {
		if (pos < 0.5) return easings.sinusoidal(pos * 2);
		else return easings.sinusoidal(1 - (pos - 0.5) * 2);
	},
	// accelerating from zero velocity
	easeInQuad: function (t) { return t*t },
	// decelerating to zero velocity
	easeOutQuad: function (t) { return t*(2-t) },
	// acceleration until halfway, then deceleration
	easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t },
	// accelerating from zero velocity 
	easeInCubic: function (t) { return t*t*t },
	// decelerating to zero velocity 
	easeOutCubic: function (t) { return (--t)*t*t+1 },
	// acceleration until halfway, then deceleration 
	easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 },
	// accelerating from zero velocity 
	easeInQuart: function (t) { return t*t*t*t },
	// decelerating to zero velocity 
	easeOutQuart: function (t) { return 1-(--t)*t*t*t },
	// acceleration until halfway, then deceleration
	easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t },
	// accelerating from zero velocity
	easeInQuint: function (t) { return t*t*t*t*t },
	// decelerating to zero velocity
	easeOutQuint: function (t) { return 1+(--t)*t*t*t*t },
	// acceleration until halfway, then deceleration 
	easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }
};





/* **********************************************
     Begin VCO.Animate.js
********************************************** */



VCO.Animate = function(el, options) {
	var animation = vcoanimate(el, options),
		webkit_timeout;
	/*
		// POSSIBLE ISSUE WITH WEBKIT FUTURE BUILDS
	var onWebKitTimeout = function() {
		
		animation.stop(true);
	}
	if (VCO.Browser.webkit) {
		//webkit_timeout = setTimeout(function(){onWebKitTimeout()}, options.duration);
	}
	*/
	return animation;
};

!function (name, definition) {
  if (typeof define == 'function') {
	  define(definition)
  } else if (typeof module != 'undefined') {
	  module.exports = definition()
  } else {
	  this[name] = definition()
  }
}('vcoanimate', function () {

	var doc = document,
		win = window,
		perf = win.performance,
		perfNow = perf && (perf.now || perf.webkitNow || perf.msNow || perf.mozNow),
		now = perfNow ? function () { return perfNow.call(perf) } : function () { return +new Date() },
		html = doc.documentElement,
		thousand = 1000,
		rgbOhex = /^rgb\(|#/,
		relVal = /^([+\-])=([\d\.]+)/,
		numUnit = /^(?:[\+\-]=?)?\d+(?:\.\d+)?(%|in|cm|mm|em|ex|pt|pc|px)$/,
		rotate = /rotate\(((?:[+\-]=)?([\-\d\.]+))deg\)/,
		scale = /scale\(((?:[+\-]=)?([\d\.]+))\)/,
		skew = /skew\(((?:[+\-]=)?([\-\d\.]+))deg, ?((?:[+\-]=)?([\-\d\.]+))deg\)/,
		translate = /translate\(((?:[+\-]=)?([\-\d\.]+))px, ?((?:[+\-]=)?([\-\d\.]+))px\)/,
		// these elements do not require 'px'
		unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, transform: 1};

  // which property name does this browser use for transform
	var transform = function () {
		var styles = doc.createElement('a').style,
			props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'],
			i;
			
		for (i = 0; i < props.length; i++) {
			if (props[i] in styles) return props[i]
		};
	}();

	// does this browser support the opacity property?
	var opasity = function () {
		return typeof doc.createElement('a').style.opacity !== 'undefined'
	}();

	// initial style is determined by the elements themselves
	var getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
	function (el, property) {
		property = property == 'transform' ? transform : property
		var value = null,
			computed = doc.defaultView.getComputedStyle(el, '');
		computed && (value = computed[camelize(property)]);
		return el.style[property] || value;
	} : html.currentStyle ?

    function (el, property) {
		property = camelize(property)

		if (property == 'opacity') {
			var val = 100
			try {
				val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
			} catch (e1) {
				try {
					val = el.filters('alpha').opacity
				} catch (e2) {
					
				}
			}
			return val / 100
		}
		var value = el.currentStyle ? el.currentStyle[property] : null
		return el.style[property] || value
	} :
	
    function (el, property) {
		return el.style[camelize(property)]
    }

  var frame = function () {
    // native animation frames
    // http://webstuff.nfshost.com/anim-timing/Overview.html
    // http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
    return win.requestAnimationFrame  ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame    ||
      win.msRequestAnimationFrame     ||
      win.oRequestAnimationFrame      ||
      function (callback) {
        win.setTimeout(function () {
          callback(+new Date())
        }, 17) // when I was 17..
      }
  }()

  var children = []

  function has(array, elem, i) {
    if (Array.prototype.indexOf) return array.indexOf(elem)
    for (i = 0; i < array.length; ++i) {
      if (array[i] === elem) return i
    }
  }

  function render(timestamp) {
    var i, count = children.length
    // if we're using a high res timer, make sure timestamp is not the old epoch-based value.
    // http://updates.html5rocks.com/2012/05/requestAnimationFrame-API-now-with-sub-millisecond-precision
    if (perfNow && timestamp > 1e12) timestamp = now()
    for (i = count; i--;) {
      children[i](timestamp)
    }
    children.length && frame(render)
  }

  function live(f) {
    if (children.push(f) === 1) frame(render)
  }

  function die(f) {
    var rest, index = has(children, f)
    if (index >= 0) {
      rest = children.slice(index + 1)
      children.length = index
      children = children.concat(rest)
    }
  }

  function parseTransform(style, base) {
    var values = {}, m
    if (m = style.match(rotate)) values.rotate = by(m[1], base ? base.rotate : null)
    if (m = style.match(scale)) values.scale = by(m[1], base ? base.scale : null)
    if (m = style.match(skew)) {values.skewx = by(m[1], base ? base.skewx : null); values.skewy = by(m[3], base ? base.skewy : null)}
    if (m = style.match(translate)) {values.translatex = by(m[1], base ? base.translatex : null); values.translatey = by(m[3], base ? base.translatey : null)}
    return values
  }

  function formatTransform(v) {
    var s = ''
    if ('rotate' in v) s += 'rotate(' + v.rotate + 'deg) '
    if ('scale' in v) s += 'scale(' + v.scale + ') '
    if ('translatex' in v) s += 'translate(' + v.translatex + 'px,' + v.translatey + 'px) '
    if ('skewx' in v) s += 'skew(' + v.skewx + 'deg,' + v.skewy + 'deg)'
    return s
  }

  function rgb(r, g, b) {
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)
  }

  // convert rgb and short hex to long hex
  function toHex(c) {
    var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    return (m ? rgb(m[1], m[2], m[3]) : c)
      .replace(/#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3') // short skirt to long jacket
  }

  // change font-size => fontSize etc.
  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase()
    })
  }

  // aren't we having it?
  function fun(f) {
    return typeof f == 'function'
  }

  function nativeTween(t) {
    // default to a pleasant-to-the-eye easeOut (like native animations)
    return Math.sin(t * Math.PI / 2)
  }

  /**
    * Core tween method that requests each frame
    * @param duration: time in milliseconds. defaults to 1000
    * @param fn: tween frame callback function receiving 'position'
    * @param done {optional}: complete callback function
    * @param ease {optional}: easing method. defaults to easeOut
    * @param from {optional}: integer to start from
    * @param to {optional}: integer to end at
    * @returns method to stop the animation
    */
  function tween(duration, fn, done, ease, from, to) {
    ease = fun(ease) ? ease : morpheus.easings[ease] || nativeTween
    var time = duration || thousand
      , self = this
      , diff = to - from
      , start = now()
      , stop = 0
      , end = 0

    function run(t) {
      var delta = t - start
      if (delta > time || stop) {
        to = isFinite(to) ? to : 1
        stop ? end && fn(to) : fn(to)
        die(run)
        return done && done.apply(self)
      }
      // if you don't specify a 'to' you can use tween as a generic delta tweener
      // cool, eh?
      isFinite(to) ?
        fn((diff * ease(delta / time)) + from) :
        fn(ease(delta / time))
    }

    live(run)

    return {
      stop: function (jump) {
        stop = 1
        end = jump // jump to end of animation?
        if (!jump) done = null // remove callback if not jumping to end
      }
    }
  }

  /**
    * generic bezier method for animating x|y coordinates
    * minimum of 2 points required (start and end).
    * first point start, last point end
    * additional control points are optional (but why else would you use this anyway ;)
    * @param points: array containing control points
       [[0, 0], [100, 200], [200, 100]]
    * @param pos: current be(tween) position represented as float  0 - 1
    * @return [x, y]
    */
  function bezier(points, pos) {
    var n = points.length, r = [], i, j
    for (i = 0; i < n; ++i) {
      r[i] = [points[i][0], points[i][1]]
    }
    for (j = 1; j < n; ++j) {
      for (i = 0; i < n - j; ++i) {
        r[i][0] = (1 - pos) * r[i][0] + pos * r[parseInt(i + 1, 10)][0]
        r[i][1] = (1 - pos) * r[i][1] + pos * r[parseInt(i + 1, 10)][1]
      }
    }
    return [r[0][0], r[0][1]]
  }

  // this gets you the next hex in line according to a 'position'
  function nextColor(pos, start, finish) {
    var r = [], i, e, from, to
    for (i = 0; i < 6; i++) {
      from = Math.min(15, parseInt(start.charAt(i),  16))
      to   = Math.min(15, parseInt(finish.charAt(i), 16))
      e = Math.floor((to - from) * pos + from)
      e = e > 15 ? 15 : e < 0 ? 0 : e
      r[i] = e.toString(16)
    }
    return '#' + r.join('')
  }

  // this retreives the frame value within a sequence
  function getTweenVal(pos, units, begin, end, k, i, v) {
    if (k == 'transform') {
      v = {}
      for (var t in begin[i][k]) {
        v[t] = (t in end[i][k]) ? Math.round(((end[i][k][t] - begin[i][k][t]) * pos + begin[i][k][t]) * thousand) / thousand : begin[i][k][t]
      }
      return v
    } else if (typeof begin[i][k] == 'string') {
      return nextColor(pos, begin[i][k], end[i][k])
    } else {
      // round so we don't get crazy long floats
      v = Math.round(((end[i][k] - begin[i][k]) * pos + begin[i][k]) * thousand) / thousand
      // some css properties don't require a unit (like zIndex, lineHeight, opacity)
      if (!(k in unitless)) v += units[i][k] || 'px'
      return v
    }
  }

  // support for relative movement via '+=n' or '-=n'
  function by(val, start, m, r, i) {
    return (m = relVal.exec(val)) ?
      (i = parseFloat(m[2])) && (start + (m[1] == '+' ? 1 : -1) * i) :
      parseFloat(val)
  }

  /**
    * morpheus:
    * @param element(s): HTMLElement(s)
    * @param options: mixed bag between CSS Style properties & animation options
    *  - {n} CSS properties|values
    *     - value can be strings, integers,
    *     - or callback function that receives element to be animated. method must return value to be tweened
    *     - relative animations start with += or -= followed by integer
    *  - duration: time in ms - defaults to 1000(ms)
    *  - easing: a transition method - defaults to an 'easeOut' algorithm
    *  - complete: a callback method for when all elements have finished
    *  - bezier: array of arrays containing x|y coordinates that define the bezier points. defaults to none
    *     - this may also be a function that receives element to be animated. it must return a value
    */
  function morpheus(elements, options) {
    var els = elements ? (els = isFinite(elements.length) ? elements : [elements]) : [], i
      , complete = options.complete
      , duration = options.duration
      , ease = options.easing
      , points = options.bezier
      , begin = []
      , end = []
      , units = []
      , bez = []
      , originalLeft
      , originalTop

    if (points) {
      // remember the original values for top|left
      originalLeft = options.left;
      originalTop = options.top;
      delete options.right;
      delete options.bottom;
      delete options.left;
      delete options.top;
    }

    for (i = els.length; i--;) {

      // record beginning and end states to calculate positions
      begin[i] = {}
      end[i] = {}
      units[i] = {}

      // are we 'moving'?
      if (points) {

        var left = getStyle(els[i], 'left')
          , top = getStyle(els[i], 'top')
          , xy = [by(fun(originalLeft) ? originalLeft(els[i]) : originalLeft || 0, parseFloat(left)),
                  by(fun(originalTop) ? originalTop(els[i]) : originalTop || 0, parseFloat(top))]

        bez[i] = fun(points) ? points(els[i], xy) : points
        bez[i].push(xy)
        bez[i].unshift([
          parseInt(left, 10),
          parseInt(top, 10)
        ])
      }

      for (var k in options) {
        switch (k) {
        case 'complete':
        case 'duration':
        case 'easing':
        case 'bezier':
          continue
        }
        var v = getStyle(els[i], k), unit
          , tmp = fun(options[k]) ? options[k](els[i]) : options[k]
        if (typeof tmp == 'string' &&
            rgbOhex.test(tmp) &&
            !rgbOhex.test(v)) {
          delete options[k]; // remove key :(
          continue; // cannot animate colors like 'orange' or 'transparent'
                    // only #xxx, #xxxxxx, rgb(n,n,n)
        }

        begin[i][k] = k == 'transform' ? parseTransform(v) :
          typeof tmp == 'string' && rgbOhex.test(tmp) ?
            toHex(v).slice(1) :
            parseFloat(v)
        end[i][k] = k == 'transform' ? parseTransform(tmp, begin[i][k]) :
          typeof tmp == 'string' && tmp.charAt(0) == '#' ?
            toHex(tmp).slice(1) :
            by(tmp, parseFloat(v));
        // record original unit
        (typeof tmp == 'string') && (unit = tmp.match(numUnit)) && (units[i][k] = unit[1])
      }
    }
    // ONE TWEEN TO RULE THEM ALL
    return tween.apply(els, [duration, function (pos, v, xy) {
      // normally not a fan of optimizing for() loops, but we want something
      // fast for animating
      for (i = els.length; i--;) {
        if (points) {
          xy = bezier(bez[i], pos)
          els[i].style.left = xy[0] + 'px'
          els[i].style.top = xy[1] + 'px'
        }
        for (var k in options) {
          v = getTweenVal(pos, units, begin, end, k, i)
          k == 'transform' ?
            els[i].style[transform] = formatTransform(v) :
            k == 'opacity' && !opasity ?
              (els[i].style.filter = 'alpha(opacity=' + (v * 100) + ')') :
              (els[i].style[camelize(k)] = v)
        }
      }
    }, complete, ease])
  }

  // expose useful methods
  morpheus.tween = tween
  morpheus.getStyle = getStyle
  morpheus.bezier = bezier
  morpheus.transform = transform
  morpheus.parseTransform = parseTransform
  morpheus.formatTransform = formatTransform
  morpheus.easings = {}

  return morpheus

});





/* **********************************************
     Begin VCO.Dom.js
********************************************** */

/*	VCO.Dom
	Utilities for working with the DOM
	Library abstraction for jQuery
================================================== */



VCO.Dom = {

	get: function(id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},
	
	create: function(tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className;
		if (container) {
			container.appendChild(el);
		}
		return el;
	},
	
	createText: function(content, container) {
		var el = document.createTextNode(content);
		if (container) {
			container.appendChild(el);
		}
		return el;
	},
	
	getTranslateString: function (point) {
		return VCO.Dom.TRANSLATE_OPEN +
				point.x + 'px,' + point.y + 'px' +
				VCO.Dom.TRANSLATE_CLOSE;
	},
	
	setPosition: function (el, point) {
		el._vco_pos = point;
		if (VCO.Browser.webkit3d) {
			el.style[VCO.Dom.TRANSFORM] =  VCO.Dom.getTranslateString(point);

			if (VCO.Browser.android) {
				el.style['-webkit-perspective'] = '1000';
				el.style['-webkit-backface-visibility'] = 'hidden';
			}
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	},

	getPosition: function (el) {
		return el._leaflet_pos;
	},
	
	testProp: function(props) {
		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	}
	
};

VCO.Util.extend(VCO.Dom, {
	TRANSITION: VCO.Dom.testProp(['transition', 'webkitTransition', 'OTransition', 'MozTransition', 'msTransition']),
	TRANSFORM: VCO.Dom.testProp(['transformProperty', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']),

	TRANSLATE_OPEN: 'translate' + (VCO.Browser.webkit3d ? '3d(' : '('),
	TRANSLATE_CLOSE: VCO.Browser.webkit3d ? ',0)' : ')'
});

/* **********************************************
     Begin VCO.MediaType.js
********************************************** */

/*	VCO.MediaType
	Determines the type of media the url string is.
	returns an object with .type and .id
	You can add new media types by adding a regex 
	to match and the media class name to use to 
	render the media 
================================================== */
VCO.MediaType = function(url) {
	var media = {}, 
		media_types = 	[
			{
				type: 		"youtube",
				match_str: 	"(www.)?youtube|youtu\.be",
				cls: 		VCO.Media.YouTube
			},
			{
				type: 		"vimeo",
				match_str: 	"(player.)?vimeo\.com",
				cls: 		VCO.Media.Vimeo
			},
			{
				type: 		"dailymotion",
				match_str: 	"(www.)?dailymotion\.com",
				cls: 		VCO.Media.IFrame
			},
			{
				type: 		"vine",
				match_str: 	"(www.)?vine\.co",
				cls: 		VCO.Media.Vine
			},
			{
				type: 		"soundcloud",
				match_str: 	"(player.)?soundcloud\.com",
				cls: 		VCO.Media.SoundCloud
			},
			{
				type: 		"twitter",
				match_str: 	"(www.)?twitter\.com",
				cls: 		VCO.Media.Twitter
			},
			{
				type: 		"googlemaps",
				match_str: 	"maps.google",
				cls: 		VCO.Media.Map
			},
			{
				type: 		"googleplus",
				match_str: 	"plus.google",
				cls: 		VCO.Media.GooglePlus
			},
			{
				type: 		"flickr",
				match_str: 	"flickr.com/photos",
				cls: 		VCO.Media.Flickr
			},
			{
				type: 		"instagram",
				match_str: 	"instagr.am/p/",
				cls: 		VCO.Media
			},
			{
				type: 		"image",
				match_str: 	/jpg|jpeg|png|gif/i,
				cls: 		VCO.Media.Image
			},
			{
				type: 		"googledocs",
				match_str: 	/\b.(doc|docx|xls|xlsx|ppt|pptx|pdf|pages|ai|psd|tiff|dxf|svg|eps|ps|ttf|xps|zip|tif)\b/,
				cls: 		VCO.Media.GoogleDoc
			},
			{
				type: 		"wikipedia",
				match_str: 	"(www.)?wikipedia\.org",
				cls: 		VCO.Media.Wikipedia
			},
			{
				type: 		"iframe",
				match_str: 	"iframe",
				cls: 		VCO.Media.IFrame
			},
			{
				type: 		"storify",
				match_str: 	"storify",
				cls: 		VCO.Media.Storify
			},
			{
				type: 		"blockquote",
				match_str: 	"blockquote",
				cls: 		VCO.Media.Blockquote
			},
			{
				type: 		"website",
				match_str: 	"http://",
				cls: 		VCO.Media.Website
			},
			{
				type: 		"",
				match_str: 	"",
				cls: 		VCO.Media
			}
		];
	
	for (var i = 0; i < media_types.length; i++) {
		if (url.match(media_types[i].match_str)) {
			media 		= media_types[i];
			media.url 	= url;
			return media;
			break;
		}
	};
	
	return false;
	
}

/* **********************************************
     Begin VCO.Media.js
********************************************** */

/*	VCO.Media
	Main media template for media assets.
	Takes a data object and populates a dom object
================================================== */
 
VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		content_item: {},
		caption: {},
		credit: {}
	},
	
	// Media Type
	mediatype: {},
	
	// Data
	data: {
		uniqueid: 			"",
		url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
		credit:				"Georges Méliès",
		caption:			"Le portrait mystérieux"
	},
	
	//Options
	options: {
		something: 			""
	},
	
	animator: {},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		//animator = new VCO.Animator();
		VCO.Util.setData(this, data);
		if (options) {
			VCO.Util.setOptions(this, this.options);
		};
		
		this._el.container = VCO.Dom.create("div", "vco-media");
		this._el.container.id = this.data.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	
	/*	Load the media
	================================================== */
	loadMedia: function(url) {
		
	},
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
		this.onRemove();
	},

	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.data);
	},
	
	onAdd: function() {
		this.fire("added", this.data);
	},

	onRemove: function() {
		this.fire("removed", this.data);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-media-content-container", this._el.container);
		this._el.content					= VCO.Dom.create("div", "vco-media-content", this._el.content_container);
		
		// Add Shadow
		this._el.content.className += ' vco-media-shadow';
		
		// Credit
		if (this.data.credit != "") {
			this._el.credit					= VCO.Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.data.credit;
		}
		
		// Caption
		if (this.data.caption != "") {
			this._el.caption				= VCO.Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.data.caption;
		}
		
	}
	
});

/* **********************************************
     Begin VCO.Media.Image.js
********************************************** */

/*	VCO.Media.Image
	Produces image assets.
	Takes a data object and populates a dom object
================================================== */

VCO.Media.Image = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	//Options
	options: {
		something: 			""
	},
	
	/*	Load the media
	================================================== */
	loadMedia: function(url) {
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
});

/* **********************************************
     Begin VCO.Media.Text.js
********************************************** */

VCO.Media.Text = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		headline: {}
	},
	
	// Data
	data: {
		uniqueid: 			"",
		headline: 			"Le portrait mystérieux",
		text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
	},
	
	// Options
	options: {
		something: 			""
	},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		VCO.Util.setData(this, data);
		if (options) {
			VCO.Util.setOptions(this, this.options);
		};
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-text");
		this._el.container.id = this.data.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
	},
	
	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.data);
	},
	
	onAdd: function() {
		this.fire("added", this.data);
	},

	onRemove: function() {
		this.fire("removed", this.data);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-text-content-container", this._el.container);
		//this._el.content					= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
		
		// Headline
		if (this.data.headline != "") {
			this._el.headline				= VCO.Dom.create("h2", "vco-headline", this._el.content_container);
			this._el.headline.innerHTML		= this.data.headline;
		}
		
		// Text
		if (this.data.text != "") {
			this._el.content				= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
			this._el.content.innerHTML		= VCO.Util.htmlify(this.data.text);
		}
		
		// Fire event that the slide is loaded
		this.onLoaded();
		
		
		
	}
	
});

/* **********************************************
     Begin VCO.Slide.js
********************************************** */

/*	VCO.Slide
	Creates a slide. Takes a data object and
	populates the slide with content.
================================================== */

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {}
	},
	
	// Components
	_media: {},
	_mediaclass: {},
	_text: {},
	
	// Data
	data: {
		uniqueid: 				"",
		background: {			// OPTIONAL
			url: 				null, //"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
			color: 				"#cdbfe3",
			opacity: 			50
		},
		date: 					null,
		location: {
			lat: 				-9.143962,
			lon: 				38.731094,
			zoom: 				13,
			icon: 				"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png"
		},
		text: {
			headline: 			"Le portrait mystérieux",
			text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
		},
		media: {
			url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
			credit:				"Georges Méliès",
			caption:			"Le portrait mystérieux"
		}
		
	},
	
	// Options
	options: {
		something: 				""
	},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		
		VCO.Util.setData(this, data);
		
		if (options) {
			VCO.Util.setOptions(this, this.options);
		}
		
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-slide");
		this._el.container.id = this.data.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		}
		
		//return this;
	},
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
	},
	
	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.data);
	},
	
	onAdd: function() {
		this.fire("added", this.data);
	},

	onRemove: function() {
		this.fire("removed", this.data);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container		= VCO.Dom.create("div", "vco-slide-content-container", this._el.container);
		this._el.content				= VCO.Dom.create("div", "vco-slide-content", this._el.content_container);
		
		// Style Slide Background
		if (this.data.background) {
			if (this.data.background.url) {
				this._el.container.className += ' vco-full-image-background';
				this._el.container.style.backgroundImage="url('" + this.data.background.url + "')";
			}
			if (this.data.background.color) {
				this._el.container.style.backgroundColor = this.data.background.color;
			}
		} 
		
		// Media
		if (this.data.media) {
			// Determine the media type
			this.data.media.mediatype = VCO.MediaType(this.data.media.url);
			
			// Create a media object using the matched class name
			this._media = new this.data.media.mediatype.cls(this.data.media);
			
			// add the object to the dom
			this._media.addTo(this._el.content);
			this._media.loadMedia();
		}
		
		// Text
		if (this.data.text) {
			this._text = new VCO.Media.Text(this.data.text);
			this._text.addTo(this._el.content);
		}
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
	}
	
});


/* **********************************************
     Begin VCO.StorySlider.js
********************************************** */

/**
	* StorySlider
	* Designed and built by Zach Wise at VéritéCo

	* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/ 

/*	* CodeKit Import
	* http://incident57.com/codekit/
================================================== */
// @codekit-prepend "core/VCO.js";
// @codekit-prepend "core/VCO.Util.js";
// @codekit-prepend "core/VCO.Class.js";
// @codekit-prepend "core/VCO.Events.js";
// @codekit-prepend "core/VCO.Browser.js";
// @codekit-prepend "animation/VCO.Ease.js";
// @codekit-prepend "animation/VCO.Animate.js";

// @codekit-prepend "dom/VCO.Dom.js";
// @codekit-prepend "media/VCO.MediaType.js";
// @codekit-prepend "media/VCO.Media.js";
// @codekit-prepend "media/VCO.Media.Image.js";
// @codekit-prepend "media/VCO.Media.Text.js";
// @codekit-prepend "slider/VCO.Slide.js";



/*	VCO.StorySlider
	is the central class of the API - it is used to create a StorySlider
================================================== */
VCO.StorySlider = VCO.Class.extend({
	
	// DOM ELEMENTS
	_el: {
		container: {},
		slider_container_mask: {},
		slider_container: {},
		slider_item_container: {}
	},
	
	// Slides Array
	_slides: [],
	
	includes: VCO.Events,
	
	data: {
		uniqueid: 				"",
	},
	
	options: {
		something: 				"",
		
		// interaction
		dragging: 				true
	},
	
	/*	Private Methods
	================================================== */
	initialize: function (id, data) { // (HTMLElement or String, Object)
		trace("StorySlider Initialized");
		
		VCO.Util.setOptions(this, this.options);
		VCO.Util.setData(this, this.data);
		
		this.data.uniqueid = id;
		this._el.container = VCO.Dom.get(id);
		this._initLayout();
		
	},
	
	/*	Create Slides
	================================================== */
	createSlides: function(slides) { // array of objects
		trace("createSlides");
		for (var i = 0; i < slides.length; i++) {
			trace("TEST");
			var slide = new VCO.Slide(slides[i]);
			slide.addTo(this._el.slider_item_container);
			slide.on('added', this._onSLideAdded, this);
			this._slides.push(slide);
			
		};
	},
	
	/*	Adding and Removing Slide Methods
	================================================== */
	
	// Add a slide or slides to the slider
	addSlides: function(slides) { // array of objects
		trace("addSlides");
		for (var i = 0; i < slides.length; i++) {
			slides[i].addTo(this._el.slider_item_container);
		};
		this._el.slider_container.style.left="-900px";
		// TODO add timeout for safari
		var anim = VCO.Animate(this._el.slider_container, {
			left: "0px",
			duration: 1000,
			easing: VCO.Ease.easeInSpline,
			complete: function () {
				trace("DONE");
			}
		});
		//anim.stop(true);
		
	},
	
	// Remove a slide or slides to the slider
	removeSlides: function(slides) { // array of objects
		for (var i = 0; i < slides.length; i++) {
			slides[i].removeFrom(this._el.slider_item_container);
		};
	},
	
	/*	Private Methods
	================================================== */
	
	// Events
	_onSLideAdded: function(e) {
		
	},
	
	_onResize: function(e) {
		trace("RESIZE");
	},
	
	// Initialize the layout
	_initLayout: function () {
		trace(" _initLayout");
		
		this._el.container.className += ' vco-storyslider';
		
		// Create Layout
		this._el.slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._el.slider_container_mask);
		this._el.slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._el.slider_container);
		
		// Listen for Resize Event
		window.addEventListener ("resize", this._onResize);
		
		// Create Slides and then add them
		this.createSlides([{test:"yes"}, {test:"yes"}, {test:"yes"}]);
		this.addSlides(this._slides);
		
		
		
	},
	
	
	
	
});


