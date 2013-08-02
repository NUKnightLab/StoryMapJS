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
	},
	
	stamp: (function () {
		var lastId = 0, key = '_vco_id';
		return function (/*Object*/ obj) {
			obj[key] = obj[key] || ++lastId;
			return obj[key];
		};
	}()),
	
	unique_ID: function(size) {
		
		var getRandomNumber = function(range) {
			return Math.floor(Math.random() * range);
		};

		var getRandomChar = function() {
			var chars = "abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
			return chars.substr( getRandomNumber(62), 1 );
		};

		var randomID = function(size) {
			var str = "";
			for(var i = 0; i < size; i++) {
				str += getRandomChar();
			}
			return str;
		};
		
		return randomID(size);
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
     Begin VCO.Dom.js
********************************************** */

/*	VCO.Dom
	Utilities for working with the DOM
	Library abstraction for jQuery
================================================== */



VCO.Dom = {
	
	initialize: function () {
		if( typeof( jQuery ) != 'undefined' ){
			this.type.jQuery = true;
		} else {
			this.type.jQuery = false;
		}
	},
	
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},
	
	create: function (tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className;
		if (container) {
			container.appendChild(el);
		}
		return el;
	}
	
};

/* **********************************************
     Begin VCO.Media.js
********************************************** */

VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	_container: {},
	
	options: {
		stroke: true,
		color: '#0033ff',
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2
	},

	initialize: function (id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},

	onAdd: function (map) {
		
	},

	onRemove: function (map) {
		
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-media';
		
		
	}
	
});

/* **********************************************
     Begin VCO.Slide.js
********************************************** */

// TODO Create slide element

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events],
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {}
	},
	_container: {},
	_content_container: {},
	_content: {},
	
	options: {
		uniqueid: 				VCO.Util.unique_ID(6),
		headline: 				"Le portrait mystérieux",
		date: 					null,
		lat: 					-9.143962,
		lon: 					38.731094,
		zoom: 					13,
		icon: 					"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png",
		asset: {
			media: 				"http://youtu.be/lIvftGgps24",
			credit:				"Georges Méliès",
			caption:			"Le portrait mystérieux"
		},
		full_image_background:	false // Use media image as a background
		
	},

	initialize: function(id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},
	
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	onAdd: function() {
		this.fire('slide_added', this.options);
	},

	onRemove: function() {
		this.fire('slide_removed', this.options);
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		this._el.container.className += ' vco-slide';
		
		// Create Layout
		this._el.content_container		= VCO.Dom.create('div', 'vco-content-container', this._el.container);
		this._el.content				= VCO.Dom.create('div', 'vco-content', this._el.content_container);
		this.onAdd();
		
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
// @codekit-prepend "dom/VCO.Dom.js";
// @codekit-prepend "media/VCO.Media.js";
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
	
	options: {
		
		// state
		full_image_background: null,

		// interaction
		dragging: true
	},
	
	// Constructer
	initialize: function (id, options) { // (HTMLElement or String, Object)
		trace("StorySlider Initialized");
		
		VCO.Util.setOptions(this, options);
		
		this._el.container = VCO.Dom.get(id);
		this._initLayout();


		if (this.options.maxBounds) {
			this.setMaxBounds(this.options.maxBounds);
		}

		var center = this.options.center,
			zoom = this.options.zoom;
	},
	
	// Add a slide or slides to the slider
	addSlides: function(slides) { // array of objects
		trace("addSlides");
		trace(slides);
		for (var i = 0; i < slides.length; i++) {
			trace("TEST");
			var slide = new VCO.Slide(this._el.slider_item_container, slides[i]);
			slide.on('slide_added', this._onSLideAdded, this);
			this._slides.push(slide);
		};
		
	},
	
	// Add a slide or slides to the slider
	removeSlides: function(slides) { // array of objects

		for (var i = 0; i < slides.length; i++) {
			//var slide = new VCO.Slide();
			//this._slides.push(slide);
		}
	},
	
	
	
	// Private Methods
	_onSLideAdded: function(e) {
		trace(e);
	},
	
	_initLayout: function () {
		trace(" _initLayout");
		
		this._el.container.className += ' vco-storyslider';
		
		// Create Layout
		this._el.slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._el.slider_container_mask);
		this._el.slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._el.slider_container);
		
		/*
		div.vco-storyslider
			div.vco-slider-container-mask
				div.vco-slider-container
					div.vco-slider-item-container
		*/
		this.addSlides([{test:"yes"}, {test:"yes"}, {test:"yes"}]);
		
	},
	
	
	
	
});


