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
		
		// LOADED
		this._loaded = {
			data: 	false,
			map: 	false
		};
		
		// MAP
		this._map = null;
		
		// Markers
		this._markers = [];
		
		// Line
		this._line = null;
		this._line_active = null;
		
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
			start_at_slide: 	0,
			map_popup: 			false, 
			zoom_distance: 		100,
			calculate_zoom: 	true, // Allow map to determine best zoom level between markers (recommended)
			line_color: 		"#333",
			line_weight: 		5,
			line_opacity: 		0.20,
			line_dash: 			"5,5",
			show_lines: 		true,
			show_history_line: 	true,
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
	
	goTo: function(n, change) {
		if (n < this._markers.length && n >= 0) {
			var zoom = 0,
				previous_marker = this.current_marker;
				
			this.current_marker = n;
			
			var marker = this._markers[this.current_marker];
			
			// Stop animation
			if (this.animator) {
				this.animator.stop();
			}
			
			// Reset Active Markers
			this._resetMarkersActive();
			
			// Check to see if it's an overview
			if (marker.data.type && marker.data.type == "overview") {
				this._markerOverview();
				if (!change) {
					this._onMarkerChange();
				}
			} else {
				// Make marker active
				marker.active(true);
				
				if (change) {
					// Set Map View
					this._viewTo(marker.data.location);
					
				} else {
					// Calculate Zoom
					zoom = this._calculateZoomChange(this._getMapCenter(true), marker.location());
			
					// Set Map View
					this._viewTo(marker.data.location, {calculate_zoom: this.options.calculate_zoom, zoom:zoom});
					
					// Show Line
					if (this.options.show_history_line && marker.data.real_marker && this._markers[previous_marker].data.real_marker) {
						this._replaceLines(this._line_active, [
							{
								lat:marker.data.location.lat,
								lon:marker.data.location.lon
							}, 
							{
								lat:this._markers[previous_marker].data.location.lat,
								lon:this._markers[previous_marker].data.location.lon
							}
						])
					}
					
					// Fire Event
					this._onMarkerChange();
					
				}
				
			}
			
		}
	},
	
	panTo: function(loc, animate) {
		this._panTo(loc, animate);
	},
	
	zoomTo: function(z, animate) {
		this._zoomTo(z, animate);
	},
	
	viewTo: function(loc, opts) {
		this._viewTo(loc, opts);
	},
	
	getBoundsZoom: function(m1, m2, inside, padding) {
		this.__getBoundsZoom(m1, m2, inside, padding); // (LatLngBounds[, Boolean, Point]) -> Number
	},
	
	markerOverview: function() {
		this._markerOverview();
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
			if (array[i].location && this.options.show_lines) {
				this._addToLine(this._line, array[i]);
			}
		};
	},
	
	_createLines: function(array) {
		
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
		
		_createLine: function(d) {
			return {data: d};
		},
		
		_addToLine: function(line, d) {
			
		},
		
		_replaceLines: function(line, d) {
		
		},
		
		_addLineToMap: function(line) {
			
		},
		
		/*	Map Specific Methods
		================================================== */
		
		_panTo: function(loc, animate) {
			
		},
		
		_zoomTo: function(z, animate) {
		
		},
		
		_viewTo: function(loc, opts) {
		
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
		
		_markerOverview: function() {
			
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
	
	_onMapLoaded: function(e) {
		trace("MAP LOADED");
		this._loaded.map = true;
		this._initialMapLocation();
		this.fire("loaded", this.data);
	},
	
	_initialMapLocation: function() {
		trace("_initialMapLocation 1")
		if (this._loaded.data && this._loaded.map) {
			trace("_initialMapLocation")
			trace(this.options.start_at_slide)
			this.goTo(this.options.start_at_slide, true);
		}
	},
	
	/*	Private Methods
	================================================== */
	
	_calculateZoomChange: function(origin, destination) {
		return this._getBoundsZoom(origin, destination, true);
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
			this._loaded.data = true;
			this._initialMapLocation();
			
		}
	},
	
	_initEvents: function() {
		
	}
	
});