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


