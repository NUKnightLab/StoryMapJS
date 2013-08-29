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

// @codekit-prepend "media/types/VCO.Media.Image.js";
// @codekit-prepend "media/types/VCO.Media.Text.js";

// @codekit-prepend "ui/VCO.SizeBar.js";

// @codekit-prepend "slider/VCO.Slide.js";
// @codekit-prepend "slider/VCO.SlideNav.js";
// @codekit-prepend "slider/VCO.StorySlider.js";

// @codekit-prepend "map/leaflet/VCO.Leaflet.js";

// @codekit-prepend "map/VCO.StamenMaps.js";
// @codekit-prepend "map/VCO.MapMarker.js";
// @codekit-prepend "map/VCO.Map.js";

// @codekit-prepend "map/leaflet/VCO.MapMarker.Leaflet.js";
// @codekit-prepend "map/leaflet/VCO.Map.Leaflet.js";


VCO.StoryMap = VCO.Class.extend({
	
	includes: VCO.Events,
	
	/*	Private Methods
	================================================== */
	initialize: function (elem, data, options) {
		
		// DOM ELEMENTS
		this._el = {
			container: {},
			storyslider: {},
			map: {},
			sizebar: {}
		};
		
		// Determine Container Element
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
						lat: 				51.5,
						lon: 				-0.09,
						zoom: 				13,
						icon: 				"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png"
					},
					text: {
						headline: 			"Flickr",
						text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing. Morbi commodo, ipsum sed pharetra gravida, orci magna rhoncus neque, id pulvinar odio lorem non turpis. Nullam sit amet enim."
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
						url: 				null, //"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
						color: 				"#8b4513",
						opacity: 			50
					},
					date: 					null,
					location: {
						lat: 				51.5,
						lon: 				-0.099,
						zoom: 				13,
						icon: 				"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png"
					},
					text: {
						headline: 			"Flickr",
						text: 				"blah blah"
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
						url: 				null, //"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
						color: 				null,
						opacity: 			50
					},
					date: 					null,
					location: {
						lat: 				51.5,
						lon: 				-0.08,
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
						lat: 				51.5,
						lon: 				-0.07,
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
			height: 				this._el.container.offsetHeight,
			width: 					this._el.container.offsetWidth,
			map_size_sticky: 		3, // Set as division 1/3 etc
			start_at_slide: 		0,
			// animation
			duration: 				1000,
			ease: 					VCO.Ease.easeInOutQuint,
			// interaction
			dragging: 				true,
			trackResize: 			true,
			map_type: 				"toner-lite",
			map_height: 			300,
			storyslider_height: 	600,
			sizebar_default_y: 		300,
			path_gfx: 				"gfx",
			map_popup: 				true
		};
		
		// Animation Objects
		this.animator_map = null;
		this.animator_storyslider = null;
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._initLayout();
		this._initEvents();
		
	},

	/*	Navigation
	================================================== */
	goTo: function(n) { // number

	},

	updateDisplay: function() {
		this._updateDisplay();
	},
	
	/*	Private Methods
	================================================== */

	// Initialize the layout
	_initLayout: function () {
		
		this._el.container.className += ' vco-storymap';
		
		// Create Layout
		this._el.sizebar		= VCO.Dom.create('div', 'vco-sizebar', this._el.container);
		this._el.map 			= VCO.Dom.create('div', 'vco-map', this._el.container);
		this._el.storyslider 	= VCO.Dom.create('div', 'vco-storyslider', this._el.container);
		
		// Create Map using preferred Map API
		this._map = new VCO.Map.Leaflet(this._el.map, this.data, this.options);
		
		// Create SizeBar
		this._sizebar = new VCO.SizeBar(this._el.sizebar, this._el.container, this.options);
		
		// Create StorySlider
		this._storyslider = new VCO.StorySlider(this._el.storyslider, this.data, this.options);
		
		// Initial Default Layout
		this.options.width = this._el.container.offsetWidth;
		this.options.height = this._el.container.offsetHeight;
		this._el.map.style.height = "1px";
		this._el.storyslider.style.top = "1px";
		
		// Set Default Component Sizes
		this.options.map_height = (this.options.height / this.options.map_size_sticky);
		this.options.storyslider_height = (this.options.height - this._el.sizebar.offsetHeight - this.options.map_height - 1);
		this._sizebar.setSticky(this.options.map_height);
		
		// Update Display
		this._updateDisplay(this.options.map_height, true, 2000);
		
		// Animate Sizebar to Default Location
		this._sizebar.show(2000);
		
		
	},
	
	_initEvents: function () {
		
		// Sidebar Events
		this._sizebar.on('clicked', this._onSizeBar, this);
		this._sizebar.on('move', this._onSizeBarMove, this);
		this._sizebar.on('swipe', this._onSizeBarSwipe, this);
		this._sizebar.on('momentum', this._onSizeBarSwipe, this);
		
		// StorySlider Events
		this._storyslider.on('change', this._onSlideChange, this);
		
		// Map Events
		this._map.on('change', this._onMapChange, this);
	},
	
	// Update View
	_updateDisplay: function(map_height, animate, d) {
		
		var duration = this.options.duration;
		
		if (d) {
			duration = d;
		}
		
		this.options.width = this._el.container.offsetWidth;
		this.options.height = this._el.container.offsetHeight;
		
		// Set Sticky state of SizeBar
		this._sizebar.setSticky(this._el.container.offsetHeight/this.options.map_size_sticky);
		
		// Map Height
		if (map_height) {
			this.options.map_height = map_height;
		}
		
		// StorySlider Height
		this.options.storyslider_height = (this.options.height - this._el.sizebar.offsetHeight - this.options.map_height- 1);
		
		if (animate) {
			
			// Animate Map
			if (this.animator_map) {
				this.animator_map.stop();
			}
			this.animator_map = VCO.Animate(this._el.map, {
				height: 	(map_height- 1) + "px",
				duration: 	duration,
				easing: 	VCO.Ease.easeOutStrong
			});
			
			// Animate StorySlider
			if (this.animator_storyslider) {
				this.animator_storyslider.stop();
			}
			this.animator_storyslider = VCO.Animate(this._el.storyslider, {
				height: 	this.options.storyslider_height + "px",
				top: 		this._el.sizebar.offsetHeight + "px",
				duration: 	duration,
				easing: 	VCO.Ease.easeOutStrong
			});
			
		} else {
			// Map
			this._el.map.style.height = map_height + "px";
			
			// StorySlider
			this._el.storyslider.style.height = this.options.storyslider_height + "px";
			this._el.storyslider.style.top = this._el.sizebar.offsetHeight + "px";
		}
		
		// Update Component Displays
		this._map.updateDisplay(this.options.width, this.options.map_height, animate, d);
		this._storyslider.updateDisplay(this.options.width, this.options.storyslider_height, animate);
		this._sizebar.updateDisplay(this.options.width, this.options.height, animate);
		
	},
	
	/*	Events
	================================================== */
	
	_onSlideChange: function(e) {
		trace("_onSlideChange");
		if (this.current_slide != e.current_slide) {
			this.current_slide = e.current_slide;
			this._map.goTo(this.current_slide);
		}
	},
	
	_onMapChange: function(e) {
		trace("_onMapChange");
		if (this.current_slide != e.current_marker) {
			this.current_slide = e.current_marker;
			this._storyslider.goTo(this.current_slide);
		}
	},
	
	_onSizeBar: function(e) {
		trace("ON SIZEBAR");
	},
	
	_onSizeBarMove: function(e) {
		this._updateDisplay(e.y);
	},
	
	_onSizeBarSwipe: function(e) {
		this._updateDisplay(e.y, true);
	},
	
	_onMouseClick: function(e) {
		
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


