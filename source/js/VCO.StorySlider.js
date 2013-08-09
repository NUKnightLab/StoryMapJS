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
// @codekit-prepend "data/VCO.Data.js";
// @codekit-prepend "core/VCO.Class.js";
// @codekit-prepend "core/VCO.Events.js";
// @codekit-prepend "core/VCO.Animate.js";
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


