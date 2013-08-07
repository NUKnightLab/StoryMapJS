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
     Begin VCO.Dom.js
********************************************** */

/*	VCO.Dom
	Utilities for working with the DOM
	Library abstraction for jQuery
================================================== */



VCO.Dom = {
	
	initialize: function() {
		if( typeof( jQuery ) != 'undefined' ){
			this.type.jQuery = true;
		} else {
			this.type.jQuery = false;
		}
	},
	
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
	}
	
};

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
				classname: 	VCO.Media.YouTube
			},
			{
				type: 		"vimeo",
				match_str: 	"(player.)?vimeo\.com",
				classname: 	VCO.Media.Vimeo
			},
			{
				type: 		"dailymotion",
				match_str: 	"(www.)?dailymotion\.com",
				classname: 	VCO.Media.IFrame
			},
			{
				type: 		"vine",
				match_str: 	"(www.)?vine\.co",
				classname: 	VCO.Media.Vine
			},
			{
				type: 		"soundcloud",
				match_str: 	"(player.)?soundcloud\.com",
				classname: 	VCO.Media.SoundCloud
			},
			{
				type: 		"twitter",
				match_str: 	"(www.)?twitter\.com",
				classname: 	VCO.Media.Twitter
			},
			{
				type: 		"googlemaps",
				match_str: 	"maps.google",
				classname: 	VCO.Media.Map
			},
			{
				type: 		"googleplus",
				match_str: 	"plus.google",
				classname: 	VCO.Media.GooglePlus
			},
			{
				type: 		"flickr",
				match_str: 	"flickr.com/photos",
				classname: 	VCO.Media.Flickr
			},
			{
				type: 		"instagram",
				match_str: 	"instagr.am/p/",
				classname: 	VCO.Media
			},
			{
				type: 		"image",
				match_str: 	/jpg|jpeg|png|gif/i,
				classname: 	VCO.Media
			},
			{
				type: 		"googledocs",
				match_str: 	/\b.(doc|docx|xls|xlsx|ppt|pptx|pdf|pages|ai|psd|tiff|dxf|svg|eps|ps|ttf|xps|zip|tif)\b/,
				classname: 	VCO.Media.GoogleDoc
			},
			{
				type: 		"wikipedia",
				match_str: 	"(www.)?wikipedia\.org",
				classname: 	VCO.Media.Wikipedia
			},
			{
				type: 		"iframe",
				match_str: 	"iframe",
				classname: 	VCO.Media.IFrame
			},
			{
				type: 		"storify",
				match_str: 	"storify",
				classname: 	VCO.Media.Storify
			},
			{
				type: 		"blockquote",
				match_str: 	"blockquote",
				classname: 	"VCO.Media.Blockquote"
			},
			{
				type: 		"website",
				match_str: 	"http://",
				classname: 	VCO.Media.Website
			},
			{
				type: 		"",
				match_str: 	"",
				classname: 	VCO.Media
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
	
	// Options
	options: {
		uniqueid: 			"",
		url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
		credit:				"Georges Méliès",
		caption:			"Le portrait mystérieux"
	},
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		VCO.Util.setOptions(this, options);
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-media");
		this._el.container.id = this.options.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	/*	Constructor
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
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
	},

	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.options);
	},
	
	onAdd: function() {
		this.fire("added", this.options);
	},

	onRemove: function() {
		this.fire("removed", this.options);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		trace(" _initLayout");
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-media-content-container", this._el.container);
		this._el.content					= VCO.Dom.create("div", "vco-media-content", this._el.content_container);
		
		// Add Shadow
		this._el.content.className += ' vco-media-shadow';
		
		// Credit
		if (this.options.credit != "") {
			this._el.credit					= VCO.Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.options.credit;
		}
		
		// Caption
		if (this.options.caption != "") {
			this._el.caption				= VCO.Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.options.caption;
		}
		
		// Load Media
		//this.mediatype = VCO.MediaType(this.options.url);
		//trace(this.mediatype);
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item", this._el.content);
		this._el.content_item.src			= this.options.url;
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
		
		
	}
	
});

/* **********************************************
     Begin VCO.Text.js
********************************************** */

VCO.Text = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		headline: {}
	},
	
	// Options
	options: {
		uniqueid: 			"",
		headline: 			"Le portrait mystérieux",
		text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
	},
	
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		VCO.Util.setOptions(this, options);
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-text");
		this._el.container.id = this.options.uniqueid;
		
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
		this.fire("loaded", this.options);
	},
	
	onAdd: function() {
		this.fire("added", this.options);
	},

	onRemove: function() {
		this.fire("removed", this.options);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		trace(" _initLayout");
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-text-content-container", this._el.container);
		//this._el.content					= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
		
		// Headline
		if (this.options.headline != "") {
			this._el.headline				= VCO.Dom.create("h2", "vco-headline", this._el.content_container);
			this._el.headline.innerHTML		= this.options.headline;
		}
		
		// Text
		if (this.options.text != "") {
			this._el.content				= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
			this._el.content.innerHTML		= VCO.Util.htmlify(this.options.text);
		}
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
		
		
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
	
	// Components
	_media: {},
	_mediaclass: {},
	_text: {},
	
	// Options
	options: {
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
			caption:			"Le portrait mystérieux",
			mediatype: 			{}
		}
		
	},
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		
		VCO.Util.setOptions(this, options);
		
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-slide");
		this._el.container.id = this.options.uniqueid;
		
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
		this.fire("loaded", this.options);
	},
	
	onAdd: function() {
		this.fire("added", this.options);
	},

	onRemove: function() {
		this.fire("removed", this.options);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		trace(" _initLayout");
		
		// Create Layout
		this._el.content_container		= VCO.Dom.create("div", "vco-slide-content-container", this._el.container);
		this._el.content				= VCO.Dom.create("div", "vco-slide-content", this._el.content_container);
		
		// Style Slide Background
		if (this.options.background) {
			if (this.options.background.url) {
				this._el.container.className += ' vco-full-image-background';
				this._el.container.style.backgroundImage="url('" + this.options.background.url + "')";
			}
			if (this.options.background.color) {
				this._el.container.style.backgroundColor = this.options.background.color;
			}
		} 
		
		// Media
		if (this.options.media) {
			// Determine the media type
			this.options.media.mediatype = VCO.MediaType(this.options.media.url);
			
			// Create a media object using the matched class name
			this._media = new this.options.media.mediatype.classname(this.options.media);
			
			// add the object to the dom
			this._media.addTo(this._el.content);
		}
		
		// Text
		if (this.options.text) {
			this._text = new VCO.Text(this.options.text);
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
// @codekit-prepend "dom/VCO.Dom.js";
// @codekit-prepend "media/VCO.MediaType.js";
// @codekit-prepend "media/VCO.Media.js";
// @codekit-prepend "media/VCO.Text.js";
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
		uniqueid: 				"",
		// state
		full_image_background: 	null,

		// interaction
		dragging: 				true
	},
	
	/*	Private Methods
	================================================== */
	initialize: function (id, options) { // (HTMLElement or String, Object)
		trace("StorySlider Initialized");
		
		VCO.Util.setOptions(this, this.options);
		
		this.options.uniqueid = id;
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
	
	// Initialize the layout
	_initLayout: function () {
		trace(" _initLayout");
		
		this._el.container.className += ' vco-storyslider';
		
		// Create Layout
		this._el.slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._el.slider_container_mask);
		this._el.slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._el.slider_container);
		
		// Create Slides and then add them
		this.createSlides([{test:"yes"}, {test:"yes"}, {test:"yes"}]);
		this.addSlides(this._slides);
		
	},
	
	
	
	
});


