/*	StorySlider
	Designed and built by Zach Wise at VéritéCo

	This Source Code Form is subject to the terms of the Mozilla Public
	License, v. 2.0. If a copy of the MPL was not distributed with this
	file, You can obtain one at http://mozilla.org/MPL/2.0/.
	
================================================== */


/*	Required Files
	CodeKit Import
	http://incident57.com/codekit/
================================================== */
// @codekit-prepend "core/VCO.js";
// @codekit-prepend "core/VCO.Util.js";
// @codekit-prepend "data/VCO.Data.js";
// @codekit-prepend "core/VCO.Class.js";
// @codekit-prepend "core/VCO.Events.js";
// @codekit-prepend "core/VCO.Browser.js";
// @codekit-prepend "animation/VCO.Ease.js";
// @codekit-prepend "animation/VCO.Animate.js";

// @codekit-prepend "dom/VCO.Point.js";
// @codekit-prepend "dom/VCO.DomMixins.js";
// @codekit-prepend "dom/VCO.Dom.js";
// @codekit-prepend "dom/VCO.DomUtil.js";
// @codekit-prepend "dom/VCO.DomEvent.js";
// @codekit-prepend "dom/VCO.Draggable.js";

// @codekit-prepend "media/VCO.MediaType.js";
// @codekit-prepend "media/VCO.Media.js";
// @codekit-prepend "media/VCO.Media.Image.js";
// @codekit-prepend "media/VCO.Media.Text.js";
// @codekit-prepend "slider/VCO.Slide.js";
// @codekit-prepend "slider/VCO.SlideNav.js";




/*	VCO.StorySlider
	is the central class of the API - it is used to create a StorySlider

	Events
	slideDisplayUpdate
	loaded
	slideAdded
	slideLoaded
	slideRemoved
================================================== */
VCO.StorySlider = VCO.Class.extend({
	
	includes: VCO.Events,
	
	/*	Private Methods
	================================================== */
	initialize: function (id, data) { // (HTMLElement or String, Object)
		
		// DOM ELEMENTS
		this._el = {
			container: VCO.Dom.get(id),
			slider_container_mask: {},
			slider_container: {},
			slider_item_container: {}
		};
		
		
		this._nav = {};
		this._nav.previous = {};
		this._nav.next = {};
		
		// Slides Array
		this._slides = [];
		
		// Current Slide
		this.current_slide = 0;
		
		// Data Object
		this.data = {
			uniqueid: 				id,
		};
	
		this.options = {
			start_at_slide: 		2,
			// animation
			duration: 				1000,
			ease: 					VCO.Ease.easeInOutQuint,
			// interaction
			dragging: 				true,
			trackResize: 			true
		};
		
		// Animation Object
		this.animator = {};
		
		VCO.Util.setOptions(this, this.options);
		VCO.Util.setData(this, this.data);
		
		this._initLayout();
		this._initEvents();
		
	},
	
	/*	Create Slides
	================================================== */
	createSlides: function(slides) { // array of objects
		for (var i = 0; i < slides.length; i++) {
			var slide = new VCO.Slide(slides[i]);
			slide.addTo(this._el.slider_item_container);
			slide.on('added', this._onSlideAdded, this);
			this._slides.push(slide);
		};
	},
	
	/*	Adding and Removing Slide Methods
	================================================== */
	
	// Add a slide or slides to the slider
	addSlides: function(slides) { // array of objects
		for (var i = 0; i < slides.length; i++) {
			slides[i].addTo(this._el.slider_item_container);
		};
		this.fire("slideAdded", slides);
	},
	
	// Remove a slide or slides to the slider
	removeSlides: function(slides) { // array of objects
		for (var i = 0; i < slides.length; i++) {
			slides[i].removeFrom(this._el.slider_item_container);
		};
		this.fire("slideRemoved", slides);
	},
	
	/*	Navigation
	TODO Update Navigation content
	================================================== */
	goTo: function(n) { // number
		if (n < this._slides.length && n >= 0) {
			this.current_slide = n;
			this.animator = VCO.Animate(this._el.slider_container, {
				left: 		-(this._el.container.offsetWidth * n) + "px",
				duration: 	this.options.duration,
				easing: 	this.options.ease,
				complete: 	this._onSlideDisplay()
			});
		}
	},
	
	next: function() {
		this.goTo(this.current_slide +1);
		
	},
	
	previous: function() {
		this.goTo(this.current_slide -1);
	},
	
	/*	Private Methods
	================================================== */

	// Initialize the layout
	_initLayout: function () {
		
		this._el.container.className += ' vco-storyslider';
		
		// Create Layout
		this._el.slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._el.slider_container_mask);
		this._el.slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._el.slider_container);
		
		// Create Navigation
		
		this._nav.previous = new VCO.SlideNav({
			uniqueid: 			"",
			title: 				"Left Title",
			date:				"1899",
			location:			"Chicago",
			direction: 			"previous"
		});
		this._nav.next = new VCO.SlideNav({
			uniqueid: 			"",
			title: 				"Right Title",
			date:				"1900",
			location:			"New York",
			direction: 			"next"
		});
		
		// add the navigation to the dom
		this._nav.next.addTo(this._el.container);
		this._nav.previous.addTo(this._el.container);
		
		// Create Slides and then add them
		this.createSlides([{test:"yes"}, {test:"yes"}, {test:"yes"}]);
		this.addSlides(this._slides);
		
		this._updateDisplay();
		
		this._el.slider_container.style.left="0px";
		this.goTo(this.options.start_at_slide);
		
	},
	
	// Layout the slides
	_updateDisplay: function() {
		var w 			= this._el.container.offsetWidth,
			nav_pos 	= this._el.container.offsetTop + (this._el.container.offsetHeight/2);
			
		// position navigation
		this._nav.next.setPosition({top:nav_pos});
		this._nav.previous.setPosition({top:nav_pos});
		
		// Position slides
		for (var i = 0; i < this._slides.length; i++) {
			this._slides[i].setPosition({left:(w * i), top:0});
		};
	},
	
	
	_initEvents: function () {
		
		this._nav.next.on('clicked', this._onNavigation, this);
		this._nav.previous.on('clicked', this._onNavigation, this);
		
		VCO.DomEvent.addListener(this._el.container, 'click', this._onMouseClick, this);

		var events = ['dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'contextmenu'];

		var i, len;

		for (i = 0, len = events.length; i < len; i++) {
			VCO.DomEvent.addListener(this._el.container, events[i], this._fireMouseEvent, this);
		}

		if (this.options.trackResize) {
			VCO.DomEvent.addListener(window, 'resize', this._onResize, this);
		}
	},
	
	/*	Events
	================================================== */
	_onResize: function(e) {
		trace("RESIZE");
		this._updateDisplay();
	},
	
	_onNavigation: function(e) {
		if (e.direction == "next") {
			trace("NEXT");
			this.next();
		} else if (e.direction == "previous") {
			trace("PREVIOUS");
			this.previous();
		}
	},
	
	_onSlideAdded: function(e) {
		this.fire("slideAdded", this.data);
	},
	
	_onSlideRemoved: function(e) {
		this.fire("slideAdded", this.data);
	},
	
	_onSlideDisplay: function() {
		this.fire("slideDisplayUpdate", this.current_slide);
	},
	
	_onMouseClick: function(e) {
		trace("_onMouseClick");
	},
	
	_fireMouseEvent: function (e) {
		if (!this._loaded) {
			return;
		}

		var type = e.type;
		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) {
			return;
		}

		if (type === 'contextmenu') {
			VCO.DomEvent.preventDefault(e);
		}
		
		this.fire(type, {
			latlng: "something", //this.mouseEventToLatLng(e),
			layerPoint: "something else" //this.mouseEventToLayerPoint(e)
		});
	},
	
	_onLoaded: function() {
		this.fire("loaded", this.data);
	}
	
	
});


