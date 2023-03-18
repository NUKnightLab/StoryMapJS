import { classMixin, mergeData } from "../core/Util"
import Dom from "../dom/Dom"
import Events from "../core/Events"
import DomMixins from "../dom/DomMixins"
import { Browser } from "../core/Browser"
/*	Map
	Makes a Map

	Events:
	markerAdded
	markerRemoved


================================================== */

/*
Map = VCO.Class.extend({

	includes: [VCO.Events, VCO.DomMixins],

	_el: {},
*/

export default class Map {
	constructor(elem, data, options) {

		// DOM ELEMENTS
		this._el = {
			container: {},
			map: {},
			map_mask: {}
		};

		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = Dom.get(elem);
		}

		// LOADED
		this._loaded = {
			data: 	false,
			map: 	false
		};

		// MAP
		this._map = null;

		// MINI MAP
		this._mini_map = null;

		// Markers
		this._markers = [];

		// Marker Zoom Miniumum and Maximum
		this.zoom_min_max = {
			min: null,
			max: null
		};

		// Line
		this._line = null;
		this._line_active = null;

		// Current Marker
		this.current_marker = 0;

		// Markers Bounds Array
		this.bounds_array = null;

		// Map Tiles Layer
		this._tile_layer = null;

		// Map Tiles Layer for Mini Map
		this._tile_layer_mini = null;

		// Image Layer (for zoomify)
		this._image_layer = null;

		// Data
		this.data = {
			uniqueid: 			"",
			slides: 				[{test:"yes"}, {test:"yes"}, {test:"yes"}]
		};

		//Options
		this.options = {
      // WMS/WMTS support
      // =====================
      // Storymap is the JSON object holding the storymap data
      // storymap.map_type, storymap.base_map, or storymap.slides.location.layer can be defined as either a string with one of the stamen,osm,mapbox etc TYPES
      // if a WMS or WMTS layer is required, the map_type can be an object with the following structure:
      // {
      //   “url”: “[wms | wmts]:https://ca.nfis.org/mapserver….”,
      //   “options”: {
      //     “layers”:
      //     “transparent”
      //     “format”
      //     “time”
      //   }
      // }
      // url is required, and wms or wmts must be prefixed to the web map service URL
      // options is optional, and if defined can contain any options supported by the web map service
      // options is passed to the appropriate createTileLayer function which uses the attributes to compose the request URL
			map_type: 			"stamen:toner-lite",
			map_as_image: 		false,									// If true, default icons will display on hover, lines and history lines are suppressed. If false, default icons and lines will always display
			map_mini: 			false,										// If true, a mini-map with the base layer or stamen:toner-lite will be displayed. If false, a zoom control is displayed
			map_background_color: "#d9d9d9",
			map_subdomains: 	"",
			map_access_token:   "",
			zoomify: {
				path: 			"",
				width: 			"",
				height: 		"",
				tolerance: 		0.8,
				attribution: 	""
			},
			skinny_size: 		650,
			less_bounce: 		true,
			path_gfx: 			"gfx",
			start_at_slide: 	0,
			map_popup: 			false,
			zoom_distance: 		100,
			calculate_zoom: 	true,  										// Allow map to determine best zoom level between markers (recommended)
			line_follows_path: 	true,  									// Map history path follows default line, if false it will connect previous and current only
			line_color: 		"#333",
			line_color_inactive: "#000",
			line_weight: 		5,
			line_opacity: 		0.20,
			line_dash: 			"5,5",
			line_join: 			"miter",										// Shape to use for corner of stroke can be any options for Leaflet Path
			show_lines: 		true,												// If true, will display edges joining map points
			show_history_line: 	true, 									// If true, will highlight the last edge of map points
			map_center_offset:  null, 									// takes object {top:0,left:0}

      // Basemap support
      base_map: "",
      // Extended CRS Support
      map_crs: "",

			use_custom_markers: false		// If use_custom_markers is true, the program will seek a location.icon or location.image URL definition. If detected will display them.
																	// If no icon or image URL is defined, a default marker will be displayed.
																	// If you want to suppress default markers, define an empty string or dummy image/icon


		};

		// Animation
		this.animator = null;

		// Timer
		this.timer = null;

		// Touchpad Events
		this.touch_scale = 1;
		this.scroll = {
			start_time: null
		};

		// Merge Data and Options
		mergeData(this.options, options);
		mergeData(this.data, data);


		this._initLayout();
		this._initEvents();
		this._createMap();
		this._initData();


	}

	/*	Public
	================================================== */
	updateDisplay(w, h, animate, d, offset) {
		this._updateDisplay(w, h, animate, d, offset);
	}

	goTo(n, change) {
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
					if (marker.data.location) {
						this._viewTo(marker.data.location);
					} else {
					}


				} else {
					if (marker.data.location && marker.data.location.lat) {

						// Calculate Zoom
						zoom = this._calculateZoomChange(this._getMapCenter(true), marker.location());

            // Check if new layer has been requested for slide
            // If so, Set Map Layer
            if (marker.data.location.layer) {
							trace(marker.data.location.layer);
              this._updateLayer(marker.data.location.layer);
            } else { }

						// Set Map View
						this._viewTo(marker.data.location, {calculate_zoom: this.options.calculate_zoom, zoom:zoom});

						// Show Line
						if (this.options.line_follows_path) {
							if (this.options.show_history_line && marker.data.real_marker && this._markers[previous_marker].data.real_marker) {
								var lines_array = [],
									line_num = previous_marker,
									point;

								if (line_num < this.current_marker) {
									while (line_num < this.current_marker) {
										if (this._markers[line_num].data.location && this._markers[line_num].data.location.lat) {
											point = {
												lat:this._markers[line_num].data.location.lat,
												lon:this._markers[line_num].data.location.lon
											}
											lines_array.push(point);
										}

										line_num++;
									}
								} else if (line_num > this.current_marker) {
									while (line_num > this.current_marker) {
										if (this._markers[line_num].data.location && this._markers[line_num].data.location.lat) {
											point = {
												lat:this._markers[line_num].data.location.lat,
												lon:this._markers[line_num].data.location.lon
											}
											lines_array.push(point);
										}

										line_num--;
									}
								}

								lines_array.push({
									lat:marker.data.location.lat,
									lon:marker.data.location.lon
								});

								this._replaceLines(this._line_active, lines_array);
							}
						} else {
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

						}
					} else {
						this._markerOverview();
						if (!change) {
							this._onMarkerChange();
						}

					}

					// Fire Event
					this._onMarkerChange();

				}

			}

		}
	}

	panTo(loc, animate) {
		this._panTo(loc, animate);
	}

	zoomTo(z, animate) {
		this._zoomTo(z, animate);
	}

	viewTo(loc, opts) {
		this._viewTo(loc, opts);
	}

	getBoundsZoom(m1, m2, inside, padding) {
		this.__getBoundsZoom(m1, m2, inside, padding); // (LatLngBounds[, Boolean, Point]) -> Number
	}

	markerOverview() {
		this._markerOverview();
	}

	calculateMarkerZooms() {
		this._calculateMarkerZooms();
	}

	createMiniMap() {
		this._createMiniMap();
	}

	setMapOffset(left, top) {
		// Update Component Displays
		this.options.map_center_offset.left = left;
		this.options.map_center_offset.top 	= top;
	}

	calculateMinMaxZoom() {
		for (var i = 0; i < this._markers.length; i++) {

			if (this._markers[i].data.location && this._markers[i].data.location.zoom) {
				this.updateMinMaxZoom(this._markers[i].data.location.zoom);
			}

		}
	}

	updateMinMaxZoom(zoom) {
		if (!this.zoom_min_max.max) {
			this.zoom_min_max.max = zoom;
		}

		if (!this.zoom_min_max.min) {
			this.zoom_min_max.min = zoom;
		}

		if (this.zoom_min_max.max < zoom) {
			this.zoom_min_max.max = zoom;
		}
		if (this.zoom_min_max.min > zoom) {
			this.zoom_min_max.min = zoom;
		}
	}

	initialMapLocation() {
		if (this._loaded.data && this._loaded.map) {
			this.goTo(this.options.start_at_slide, true);
			this._initialMapLocation();
		}
	}

	/*	Adding, Hiding, Showing etc
	================================================== */
	show() {

	}

	hide() {

	}

	addTo(container) {
		container.appendChild(this._el.container);
		this.onAdd();
	}

	removeFrom(container) {
		container.removeChild(this._el.container);
		this.onRemove();
	}

	/*	Adding and Removing Markers
	================================================== */
	createMarkers(array) {
		this._createMarkers(array)
	}

	createMarker(d) {
		this._createMarker(d);
	}

	_destroyMarker(marker) {
		this._removeMarker(marker);
		for (var i = 0; i < this._markers.length; i++) {
			if (this._markers[i] == marker) {
				this._markers.splice(i, 1);
			}
		}
		this.fire("markerRemoved", marker);
	}

	_createMarkers(array) {
		for (var i = 0; i < array.length; i++) {
			this._createMarker(array[i]); // this must be called even for overview which has no marker or other logic must be fixed.
			if (array[i].location && array[i].location.lat && this.options.show_lines) {
				this._addToLine(this._line, array[i]);
			}
		};

	}

	_createLines(array) {

	}


	/*	Map Specific
	================================================== */

		/*	Map Specific Create
		================================================== */
		// Extend this map class and use this to create the map using preferred API
		_createMap() {

		}

		/*	Mini Map Specific Create
		================================================== */
		// Extend this map class and use this to create the map using preferred API
		_createMiniMap() {

		}

		/*	Map Specific Marker
		================================================== */

		// Specific Marker Methods based on preferred Map API
		_createMarker(d) {
			var marker = {};
			marker.on("markerclick", this._onMarkerClick);
			this._addMarker(marker);
			this._markers.push(marker);
			marker.marker_number = this._markers.length - 1;
			this.fire("markerAdded", marker);
		}

		_addMarker(marker) {

		}

		_removeMarker(marker) {

		}

		_resetMarkersActive() {
			for (var i = 0; i < this._markers.length; i++) {
				this._markers[i].active(false);
			};
		}

		_calculateMarkerZooms() {

		}

		/*	Map Specific Line
		================================================== */

		_createLine(d) {
			return {data: d};
		}

		_addToLine(line, d) {

		}

		_replaceLines(line, d) {

		}

		_addLineToMap(line) {

		}


		/*	Map Specific Methods
		================================================== */

		_panTo(loc, animate) {

		}

		_zoomTo(z, animate) {

		}

		_viewTo(loc, opts) {

		}

		_updateMapDisplay(animate, d) {

		}

		_refreshMap() {

		}

		_getMapLocation(m) {
			return {x:0, y:0};
		}

		_getMapZoom() {
			return 1;
		}

		_getMapCenter() {
			return {lat:0, lng:0};
		}

		_getBoundsZoom(m1, m2, inside, padding) {

		}

		_markerOverview() {

		}

		_initialMapLocation() {

		}

	/*	Events
	================================================== */
	_onMarkerChange(e) {
		this.fire("change", {current_marker:this.current_marker});
	}

	_onMarkerClick(e) {
		if (this.current_marker != e.marker_number) {
			this.goTo(e.marker_number);
		}
	}

	_onMapLoaded(e) {
		this._loaded.map = true;


		if (this.options.calculate_zoom) {
			this.calculateMarkerZooms();
		}

		this.calculateMinMaxZoom();

		if (this.options.map_mini && !Browser.touch) {
			this.createMiniMap();
		}

		this.initialMapLocation();
		this.fire("loaded", this.data);
	}

	_onWheel(e) {
		// borrowed from http://jsbin.com/qiyaseza/5/edit
		var self = this;

		if (e.ctrlKey) {
			var s = Math.exp(-e.deltaY/100);
			this.touch_scale *= s;
			e.preventDefault();
			e.stopPropagation(e);
		}

		if (!this.scroll.start_time) {
			this.scroll.start_time = +new Date();
		};

		var time_left = Math.max(40 - (+new Date() - this.scroll.start_time), 0);

		clearTimeout(this.scroll.timer);

		this.scroll.timer = setTimeout(function() {
			self._scollZoom();
			//e.preventDefault();
			//e.stopPropagation(e);
		}, time_left);


	}

	_scollZoom(e) {
		var self = this,
			current_zoom = this._getMapZoom();

		this.scroll.start_time = null;
		//VCO.DomUtil.addClass(this._el.container, 'vco-map-touch-zoom');
		clearTimeout(this.scroll.timer);
		clearTimeout(this.scroll.timer_done);

		this.scroll.timer_done = setTimeout(function() {
			self._scollZoomDone();
		}, 1000);

		this.zoomTo(Math.round(current_zoom * this.touch_scale));
	}

	_scollZoomDone(e) {
		//VCO.DomUtil.removeClass(this._el.container, 'vco-map-touch-zoom');
		this.touch_scale = 1;
	}

	/*	Private Methods
	================================================== */

	_calculateZoomChange(origin, destination, correct_for_center) {
		return this._getBoundsZoom(origin, destination, correct_for_center);
	}

	_updateDisplay(w, h, animate, d) {

		// Update Map Display
		this._updateMapDisplay(animate, d);
	}

	_initLayout() {

		// Create Layout
		this._el.map_mask 	= Dom.create("div", "vco-map-mask", this._el.container);

		if (this.options.map_as_image) {
			this._el.map 	= Dom.create("div", "vco-map-display vco-mapimage-display", this._el.map_mask);
		} else {
			this._el.map 	= Dom.create("div", "vco-map-display", this._el.map_mask);
		}


	}

	_initData() {
		if (this.data.slides) {
			this._createMarkers(this.data.slides);
			this._resetMarkersActive();
			this._markers[this.current_marker].active(true);
			this._loaded.data = true;
			this._initialMapLocation();

		}
	}

	_initEvents() {
		var self = this;

		this._el.map.addEventListener('wheel', function(e) {
			self._onWheel(e);
		});

		//this.on("wheel", this._onWheel, this);
	}

}

classMixin(Map, Events, DomMixins)
export { Map }
