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
	
	_container: {},
	_slider_container_mask: {},
	_slider_container: {},
	_slider_item_container: {},
	
	includes: VCO.Events,
	
	options: {
		// projection
		scale: function (zoom) {
			return 256 * Math.pow(2, zoom);
		},

		// state
		center: null,
		zoom: null,
		layers: [],

		// interaction
		dragging: true
	},
	
	// Constructer
	initialize: function (id, options) { // (HTMLElement or String, Object)
		trace("StorySlider Initialized");
		
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();


		if (this.options.maxBounds) {
			this.setMaxBounds(this.options.maxBounds);
		}

		var center = this.options.center,
			zoom = this.options.zoom;
	},
	
	// Private Methods
	
	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-storyslider';
		
		// Create Layout
		this._slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._container);
		this._slider_container			= VCO.Dom.create('div', 'vco-slider-container', this._slider_container_mask);
		this._slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._slider_container);
		
		/*
		div.vco-storyslider
			div.vco-slider-container-mask
				div.vco-slider-container
					div.vco-slider-item-container
		*/
		
		
	}
	
});


