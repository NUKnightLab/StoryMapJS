/*	StoryMap
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

// @codekit-prepend "ui/VCO.SizeBar.js";

// @codekit-prepend "slider/VCO.Slide.js";
// @codekit-prepend "slider/VCO.SlideNav.js";
// @codekit-prepend "slider/VCO.StorySlider.js";

// @codekit-prepend "map/VCO.Leaflet.js";
// @codekit-prepend "map/VCO.Map.js";


VCO.StoryMap = VCO.Class.extend({
	
	includes: VCO.Events,
	
	/*	Private Methods
	================================================== */
	initialize: function (elem, data, options) { // (HTMLElement or String, Object)
		
		// DOM ELEMENTS
		this._el = {
			container: {},
			storyslider: {},
			map: {},
			sizebar: {}
		};
		
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = VCO.Dom.get(elem);
		}
		
		// Slider
		this._storyslider = {};
		
		// Map
		this._map = {};
		
		// SizeBar
		this._sizebar = {};
		
		// Current Slide
		this.current_slide = 0;
		
		// Data Object
		this.data = {
			uniqueid: 				"",
			slides: 				[
				{
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
						headline: 			"Flickr",
						text: 				""
					},
					media: {
						url: 				"http://farm8.staticflickr.com/7076/7074630607_b1c23532e4.jpg",
						credit:				"Zach Wise",
						caption:			"San Francisco"
					}
				},
				{
					uniqueid: 				"",
					background: {			// OPTIONAL
						url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
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
						headline: 			"La Lune",
						text: 				""
					},
					media: {
						url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
						credit:				"ETC",
						caption:			"something"
					}
				}
			]
		};
	
		this.options = {
			start_at_slide: 		2,
			// animation
			duration: 				1000,
			ease: 					VCO.Ease.easeInOutQuint,
			// interaction
			dragging: 				true,
			trackResize: 			true,
			maptype: 				"toner"
		};
		
		// Animation Object
		this.animator = {};
		
		VCO.Util.setOptions(this, this.options);
		VCO.Util.setData(this, this.data);
		
		this._initLayout();
		this._initEvents();
		
	},

	/*	Navigation
	================================================== */
	goTo: function(n) { // number

	},

	
	/*	Private Methods
	================================================== */

	// Initialize the layout
	_initLayout: function () {
		
		this._el.container.className += ' vco-storymap';
		
		// Create Layout
		this._el.map 			= VCO.Dom.create('div', 'vco-map', this._el.container);
		this._el.sizebar		= VCO.Dom.create('div', 'vco-sizebar', this._el.container);
		this._el.storyslider 	= VCO.Dom.create('div', 'vco-storyslider', this._el.container);
		
		
		// Create StorySlider
		this._storyslider = new VCO.StorySlider(this._el.storyslider, this.data, this.options);
		//this._storyslider.on('clicked', this._onNavigation, this);
		
		// Create Map
		this._map = new VCO.Map(this._el.map, this.data, this.options);
		
		// Create SizeBar
		this._sizebar = new VCO.SizeBar(this._el.sizebar, this.data, this.options);
		this._sizebar.on('clicked', this._onSizeBar, this);
		
		this._updateDisplay();
		
		
	},
	
	// Update View
	_updateDisplay: function() {

	},
	
	
	_initEvents: function () {
		
		
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
	
	_onSizeBar: function(e) {
		trace("ON SIZEBAR");
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


