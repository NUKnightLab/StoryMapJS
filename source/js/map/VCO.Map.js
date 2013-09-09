/*	VCO.Map
	Makes a Map

	Events:
	markerAdded
	markerRemoved
================================================== */
 
VCO.Map = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(elem, data, options) {
		// DOM ELEMENTS
		this._el = {
			container: {},
			map: {},
			map_mask: {}
		};
		
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = VCO.Dom.get(elem);
		}
		
		// MAP
		this._map = null;
		
		// Markers
		this._markers = [];
		
		// Line
		this._line = null;
		
		// Current Marker
		this.current_marker = 0;
	
		// Data
		this.data = {
			uniqueid: 			"",
			slides: 				[{test:"yes"}, {test:"yes"}, {test:"yes"}]
		};
	
		//Options
		this.options = {
			map_type: 			"toner",
			path_gfx: 			"gfx",
			map_popup: 			false, 
			zoom_distance: 		100,
			calculate_zoom: 	true, // Allow map to determine best zoom level between markers (recommended)
			default_map_location: {
				lat: 	51.505,
				lon: 	-0.09,
				zoom: 	13
			},
			line_color: 		"#03f",
			line_weight: 		5,
			line_opacity: 		0.5,
			map_center_offset:  10
		};
		
		// Animation
		this.animator = null;
		
		// Timer
		this.timer = null;
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._initLayout();
		this._initEvents();
		this._createMap();
		this._initData();
		
	},
	
	/*	Public
	================================================== */
	updateDisplay: function(w, h, animate, d, offset) {
		this._updateDisplay(w, h, animate, d, offset);
	},
	
	goTo: function(n, fast) {
		if (n < this._markers.length && n >= 0) {
			var zoom = 0;
			this.current_marker = n;
			
			var marker = this._markers[this.current_marker];
			
			// Stop animation
			if (this.animator) {
				this.animator.stop();
			}
			
			// Make marker active
			this._resetMarkersActive();
			marker.active(true);
			
			// Calculate Zoom
			zoom = this._calculateZoomChange(this._getMapCenter(true), marker.location());
			
			// Set Map View
			this._viewTo(marker.data.location, {calculate_zoom: this.options.calculate_zoom, zoom:zoom});
			
			this._onMarkerChange();
		}
	},
	
	panTo: function(loc, animate) {
		this._panTo(loc, animate);
	},
	
	zoomTo: function(z, animate) {
		this._zoomTo(z, animate);
	},
	
	viewTo: function(loc, duration) {
		this._viewTo(loc, duration);
	},
	
	getBoundsZoom: function(m1, m2, inside, padding) {
		this.__getBoundsZoom(m1, m2, inside, padding); // (LatLngBounds[, Boolean, Point]) -> Number
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
	
	/*	Adding and Removing Markers
	================================================== */
	createMarkers: function(array) {
		this._createMarkers(array)
	},
	
	createMarker: function(d) {
		this._createMarker(d);
	},
	
	_destroyMarker: function(marker) {
		this._removeMarker(marker);
		for (var i = 0; i < this._markers.length; i++) {
			if (this._markers[i] == marker) {
				this._markers.splice(i, 1);
			}
		}
		this.fire("markerRemoved", marker);
	},
	
	_createMarkers: function(array) {
		for (var i = 0; i < array.length; i++) {
			this._createMarker(array[i]);
			if (array[i].location.line) {
				this._addToLine(this._line, array[i])
			}
		};
	},
	
	
	/*	Map Specific
	================================================== */
	
		/*	Map Specific Create
		================================================== */
		// Extend this map class and use this to create the map using preferred API
		_createMap: function() {
			trace("Create Map")
		},
	
		/*	Map Specific Marker
		================================================== */
		
		// Specific Marker Methods based on preferred Map API
		_createMarker: function(d) {
			var marker = {};
			marker.on("markerclick", this._onMarkerClick);
			this._addMarker(marker);
			this._markers.push(marker);
			marker.marker_number = this._markers.length - 1;
			this.fire("markerAdded", marker);
		},
	
		_addMarker: function(marker) {
		
		},
	
		_removeMarker: function(marker) {
		
		},
		
		_resetMarkersActive: function() {
			for (var i = 0; i < this._markers.length; i++) {
				this._markers[i].active(false);
			};
		},
	
		/*	Map Specific Line
		================================================== */
		
		_createLine: function() {
			this.line = {};
		},
		
		_addToLine: function(line, d) {
			if (!this._line) {
				this._createLine(line, d);
			}
			
			
		},
		
		/*	Map Specific Methods
		================================================== */
		
		_panTo: function(loc, animate) {
			
		},
		
		_zoomTo: function(z, animate) {
		
		},
		
		_viewTo: function(loc, duration) {
		
		},
		
		_updateMapDisplay: function(w, h, animate, d) {
			
		},
		
		_refreshMap: function() {
			
		},
		
		_getMapLocation: function(m) {
			return {x:0, y:0};
		},
		
		_getMapZoom: function() {
			return 1;
		},
		
		_getMapCenter: function() {
			return {lat:0, lng:0};
		},
		
		_getBoundsZoom: function(m1, m2, inside, padding) {
		
		},
	
	/*	Events
	================================================== */
	_onMarkerChange: function(e) {
		this.fire("change", {current_marker:this.current_marker});
	},
	
	_onMarkerClick: function(e) {
		if (this.current_marker != e.marker_number) {
			this.goTo(e.marker_number);
		}
	},
	
	/*	Private Methods
	================================================== */
	
	_calculateZoomChange: function(origin, destination) {
		return this._getBoundsZoom(origin, destination, true);
		
		/*
		var _m1 	= this._getMapLocation(m1),
			_m2 	= this._getMapLocation(m2),
			zoom 	= {
				in: 	false,
				out: 	false,
				amount: 1,
				current: this._getMapZoom(),
				max: 	16,
				min: 	4
			};
			
		// Calculate Zoom in or zoom out
		if (Math.abs(_m1.x - _m2.x) >= (this._el.container.offsetWidth / 2)) {
			zoom.out 	= true;
			zoom.in 	= false;
		} else if (Math.abs(_m1.x - _m2.x) <= this.options.zoom_distance) {
			zoom.in 	= true;
		}
		
		if (Math.abs(_m1.y - _m2.y) >= (this._el.container.offsetHeight)) {
			zoom.out	= true;
			zoom.in		= false;
			zoom.amount = Math.round(Math.abs(_m1.y - _m2.y) / (this._el.container.offsetHeight));

		} else if ((Math.abs(_m1.y - _m2.y) <= this.options.zoom_distance)) {
		
		} else {
			zoom.in = false;
		}
		
		// Return New Zoom Number
		if (zoom.in) {
			if (zoom.current < zoom.max) {
				return zoom.current + zoom.amount;
			}
		} else if (zoom.out) {
			if (zoom.current > zoom.min) {
				return zoom.current - zoom.amount;
			}
		} else {
			return zoom.current;
		}
		*/
		
	},
	
	_updateDisplay: function(w, h, animate, d, offset) {
		
		if (h) {
			//this._el.map.style.height = ((h *2) - offset) + "px";
			//this._el.map_mask.style.height = (h + offset) + "px";
			this._el.map.style.height = h + "px";
			this._el.map_mask.style.height = h + "px";
		}
		
		
		// Update Map Display
		this._updateMapDisplay();
	},
	
	_initLayout: function() {
		
		// Create Layout
		this._el.map_mask = VCO.Dom.create("div", "vco-map-mask", this._el.container);
		this._el.map = VCO.Dom.create("div", "vco-map-display", this._el.map_mask);
		
	},
	
	_initData: function() {
		if (this.data.slides) {
			this._createMarkers(this.data.slides);
			this._resetMarkersActive();
			this._markers[this.current_marker].active(true);
		}
	},
	
	_initEvents: function() {
		
	}
	
});