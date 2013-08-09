/*	VCO.Animate
	adds custom animation functionality to VCO classes
	based on http://www.schillmania.com/projects/javascript-animation-3/
================================================== */
VCO.Animate = {};


VCO.Animator = function() {
	var intervalRate = 20;
	
	this.tweenTypes = {
		'default': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
		'blast': [12, 12, 11, 10, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
		'linear': [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
	}
	this.queue = [];
	this.queueHash = [];
	this.active = false;
	this.timer = null;
	
	this.createTween = function(start, end, type) {
		// return array of tween coordinate data (start->end)
		type = type || 'default';
		var tween = [start];
		var tmp = start;
		var diff = end - start;
		var x = this.tweenTypes[type].length;
		for (var i = 0; i < x; i++) {
		    tmp += diff * this.tweenTypes[type][i] * 0.01;
		    tween[i] = {};
		    tween[i].data = tmp;
		    tween[i].event = null;
		}
		return tween;
    }
	
	this.enqueue = function(o, fMethod, fOnComplete) {
		// add object and associated methods to animation queue
		trace('animator.enqueue()');
		if (!fMethod) {
			trace('animator.enqueue(): missing fMethod');
		}

		this.queue.push(o);
		o.active = true;
	}
	
	this.animate = function() {
		var active = 0;
		for (var i = 0, j = this.queue.length; i < j; i++) {
			if (this.queue[i].active) {
				this.queue[i].animate();
				active++;
			}
		}
		if (active == 0 && this.timer) {
			// all animations finished
			trace('Animations complete');
			this.stop();
		} else {
			trace(active+' active');
		}
	}
	
	this.start = function() {
		if (this.timer || this.active) {
			trace('animator.start(): already active');
			return false;
		}
		trace('animator.start()'); // report only if started
		this.active = true;
		this.timer = setInterval(this.animate, intervalRate);
	}
	
    this.stop = function() {
		trace('animator.stop()', true);
		// reset some things, clear for next batch of animations
		clearInterval(this.timer);
		this.timer = null;
		this.active = false;
		this.queue = [];
	}
	
};

VCO.Animation = function(oParams) {
	// unique animation object
	/*
		oParams = {
			from: 200,
			to: 300,
			tweenType: 'default',
			ontween: function(value) { ... }, // method called each time
			oncomplete: function() { ... } // when finished
		}
	*/
	this.animator = new VCO.Animator();
	
	if (typeof oParams.tweenType == 'undefined') {
		oParams.tweenType = 'default';
	}
	this.ontween = (oParams.ontween || null);
	this.oncomplete = (oParams.oncomplete || null);
	this.tween = this.animator.createTween(oParams.from, oParams.to, oParams.tweenType);
	this.frameCount = this.animator.tweenTypes[oParams.tweenType].length;
	this.frame = 0;
	this.active = false;
	
    this.animate = function() {
		// generic animation method
		if (this.active) {
			if (this.ontween && this.tween[this.frame]) {
				this.ontween(this.tween[this.frame].data);
			}
			if (this.frame++ >= this.frameCount - 1) {
				trace('animation(): end');
				this.active = false;
				this.frame = 0;
				if (this.oncomplete) {
					this.oncomplete();
					// this.oncomplete = null;
				}
				return false;
			}
			return true;
		}
		return false;
	}
	this.start = function() {
		// add this to the main animation queue
		this.animator.enqueue(this, this.animate, this.oncomplete);
		if (!this.animator.active) {
			this.animator.start();
		}
	}

	this.stop = function() {
		this.active = false;
	}
};

/*
 * VCO.Transition native implementation that powers  animation
 * in browsers that support CSS3 Transitions
 */
/*
VCO.Transition = VCO.Class.extend({
	statics: (function () {
		var transition = L.DomUtil.TRANSITION,
			transitionEnd = (transition === 'webkitTransition' || transition === 'OTransition' ?
				transition + 'End' : 'transitionend');

		return {
			NATIVE: !!transition,

			TRANSITION: transition,
			PROPERTY: transition + 'Property',
			DURATION: transition + 'Duration',
			EASING: transition + 'TimingFunction',
			END: transitionEnd,

			// transition-property value to use with each particular custom property
			CUSTOM_PROPS_PROPERTIES: {
				position: L.Browser.webkit ? L.DomUtil.TRANSFORM : 'top, left'
			}
		};
	}()),

	options: {
		fakeStepInterval: 100
	},

	initialize: function (el, options) {
		this._el = el;
		L.Util.setOptions(this, options);

		L.DomEvent.addListener(el, L.Transition.END, this._onTransitionEnd, this);
		this._onFakeStep = L.Util.bind(this._onFakeStep, this);
	},

	run: function (props) {
		var prop,
			propsList = [],
			customProp = L.Transition.CUSTOM_PROPS_PROPERTIES;

		for (prop in props) {
			if (props.hasOwnProperty(prop)) {
				prop = customProp[prop] ? customProp[prop] : prop;
				prop = this._dasherize(prop);
				propsList.push(prop);
			}
		}

		this._el.style[L.Transition.DURATION] = this.options.duration + 's';
		this._el.style[L.Transition.EASING] = this.options.easing;
		this._el.style[L.Transition.PROPERTY] = propsList.join(', ');

		for (prop in props) {
			if (props.hasOwnProperty(prop)) {
				this._setProperty(prop, props[prop]);
			}
		}

		this._inProgress = true;

		this.fire('start');

		if (L.Transition.NATIVE) {
			clearInterval(this._timer);
			this._timer = setInterval(this._onFakeStep, this.options.fakeStepInterval);
		} else {
			this._onTransitionEnd();
		}
	},

	_dasherize: (function () {
		var re = /([A-Z])/g;

		function replaceFn(w) {
			return '-' + w.toLowerCase();
		}

		return function (str) {
			return str.replace(re, replaceFn);
		};
	}()),

	_onFakeStep: function () {
		this.fire('step');
	},

	_onTransitionEnd: function () {
		if (this._inProgress) {
			this._inProgress = false;
			clearInterval(this._timer);

			this._el.style[L.Transition.PROPERTY] = 'none';

			this.fire('step');
			this.fire('end');
		}
	}
});
*/

/*
 * L.Transition fallback implementation that powers Leaflet animation
 * in browsers that don't support CSS3 Transitions
 */
/*
VCO.Transition = VCO.Transition.NATIVE ? VCO.Transition : VCO.Transition.extend({
	statics: {
		getTime: Date.now || function () {
			return +new Date();
		},

		TIMER: true,

		EASINGS: {
			'ease': [0.25, 0.1, 0.25, 1.0],
			'linear': [0.0, 0.0, 1.0, 1.0],
			'ease-in': [0.42, 0, 1.0, 1.0],
			'ease-out': [0, 0, 0.58, 1.0],
			'ease-in-out': [0.42, 0, 0.58, 1.0]
		},

		CUSTOM_PROPS_GETTERS: {
			position: L.DomUtil.getPosition
		},

		//used to get units from strings like "10.5px" (->px)
		UNIT_RE: /^[\d\.]+(\D*)$/
	},

	options: {
		fps: 50
	},

	initialize: function (el, options) {
		this._el = el;
		L.Util.extend(this.options, options);

		var easings = L.Transition.EASINGS[this.options.easing] || L.Transition.EASINGS.ease;

		this._p1 = new L.Point(0, 0);
		this._p2 = new L.Point(easings[0], easings[1]);
		this._p3 = new L.Point(easings[2], easings[3]);
		this._p4 = new L.Point(1, 1);

		this._step = L.Util.bind(this._step, this);
		this._interval = Math.round(1000 / this.options.fps);
	},

	run: function (props) {
		this._props = {};

		var getters = L.Transition.CUSTOM_PROPS_GETTERS,
			re = L.Transition.UNIT_RE;

		this.fire('start');

		for (var prop in props) {
			if (props.hasOwnProperty(prop)) {
				var p = {};
				if (prop in getters) {
					p.from = getters[prop](this._el);
				} else {
					var matches = this._el.style[prop].match(re);
					p.from = parseFloat(matches[0]);
					p.unit = matches[1];
				}
				p.to = props[prop];
				this._props[prop] = p;
			}
		}

		clearInterval(this._timer);
		this._timer = setInterval(this._step, this._interval);
		this._startTime = L.Transition.getTime();
	},

	_step: function () {
		var time = L.Transition.getTime(),
			elapsed = time - this._startTime,
			duration = this.options.duration * 1000;

		if (elapsed < duration) {
			this._runFrame(this._cubicBezier(elapsed / duration));
		} else {
			this._runFrame(1);
			this._complete();
		}
	},

	_runFrame: function (percentComplete) {
		var setters = L.Transition.CUSTOM_PROPS_SETTERS,
			prop, p, value;

		for (prop in this._props) {
			if (this._props.hasOwnProperty(prop)) {
				p = this._props[prop];
				if (prop in setters) {
					value = p.to.subtract(p.from).multiplyBy(percentComplete).add(p.from);
					setters[prop](this._el, value);
				} else {
					this._el.style[prop] =
							((p.to - p.from) * percentComplete + p.from) + p.unit;
				}
			}
		}
		this.fire('step');
	},

	_complete: function () {
		clearInterval(this._timer);
		this.fire('end');
	},

	_cubicBezier: function (t) {
		var a = Math.pow(1 - t, 3),
			b = 3 * Math.pow(1 - t, 2) * t,
			c = 3 * (1 - t) * Math.pow(t, 2),
			d = Math.pow(t, 3),
			p1 = this._p1.multiplyBy(a),
			p2 = this._p2.multiplyBy(b),
			p3 = this._p3.multiplyBy(c),
			p4 = this._p4.multiplyBy(d);

		return p1.add(p2).add(p3).add(p4).y;
	}
});
*/