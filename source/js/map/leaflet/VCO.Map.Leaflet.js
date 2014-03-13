/*	VCO.Map.Leaflet
	Creates a Map using Leaflet
================================================== */

VCO.Map.Leaflet = VCO.Map.extend({
	
	includes: [VCO.Events],
	
	/*	Create the Map
	================================================== */
	_createMap: function() {
		
		// Set Marker Path
		L.Icon.Default.imagePath = this.options.path_gfx;
		
		this._map = new L.map(this._el.map, {scrollWheelZoom:false, zoomControl:!this.options.map_mini});
		this._map.on("load", this._onMapLoaded, this);
		
		this._map.on("moveend", this._onMapMoveEnd, this);
			
		var map_type_arr = this.options.map_type.split(':');		

		// Create Tile Layer
		this._tile_layer = this._createTileLayer();
		
		// Add Tile Layer
		this._map.addLayer(this._tile_layer);
		
		// Add Zoomify Image Layer
		if (this._image_layer) {
			this._map.addLayer(this._image_layer);
		}
		// Create Overall Connection Line
		this._line = this._createLine(this._line);
		this._line.setStyle({color:this.options.line_color_inactive});
		this._addLineToMap(this._line);
		
		// Create Active Line
		this._line_active = this._createLine(this._line_active);
		this._line_active.setStyle({opacity:1});
		this._addLineToMap(this._line_active);
		
		if (this.options.map_as_image) {
			this._line_active.setStyle({opacity:0});
			this._line.setStyle({opacity:0});
		}

		
	},
	
	/*	Create Mini Map
	================================================== */
	_createMiniMap: function() {
		if (this.options.map_as_image) {
			this.zoom_min_max.min = 0;
		}
		
		if (!this.bounds_array) {
			this.bounds_array = this._getAllMarkersBounds(this._markers);
		} 
		
		this._tile_layer_mini = this._createTileLayer();
		this._mini_map = new L.Control.MiniMap(this._tile_layer_mini, {
			width: 				150,
			height: 			100,
			position: 			"bottomleft",
			bounds_array: 		this.bounds_array,
			zoomLevelFixed: 	this.zoom_min_max.min,
			zoomAnimation: 		true,
			aimingRectOptions: 	{
				fillColor: 		"#FFFFFF",
				color: 			"#da0000",
				opacity: 		1,
				weight: 		2
			}
		}).addTo(this._map);
		
	},
	
	/*	Create Tile Layer
	================================================== */
	_createTileLayer: function() {
		var _tilelayer,
			_map_type_arr = this.options.map_type.split(':');		
		
		
			// map_type: "http://{s}.tiles.mapbox.com/v3/milwaukeejournalsentinel.map-fy8dzs4n/{z}/{x}/{y}.png",
			// map_subdomains: "ab"
		// Set Tiles
		switch(_map_type_arr[0]) {
			case 'mapbox':
				var mapbox_name = _map_type_arr[1] || 'zachwise.hgmmh8ho';
				//_tilelayer = new L.TileLayer.Mapbox(_map_type_arr[1] || 'zachwise.hgn59jb1');
				_tilelayer = new L.TileLayer("https://{s}.tiles.mapbox.com/v2/" + mapbox_name + "/{z}/{x}/{y}.png", {
					subdomains: 'abcd',
					attribution: "<div class='mapbox-maplogo'></div><a href='https://www.mapbox.com/about/maps/' target='_blank'>© Mapbox © OpenStreetMap</a> <a class='mapbox-improve-map' href='https://www.mapbox.com/map-feedback/#zachwise.hgmmh8ho/-81.80419921875/39.58875727696545/5' target='_blank'>Improve this map</a>"
				});
				// "http://{s}.tiles.mapbox.com/v3/milwaukeejournalsentinel.map-fy8dzs4n/{z}/{x}/{y}.png",
				//https://d.tiles.mapbox.com/v3/zachwise.hgmmh8ho/5/8/11.png
				break;
			case 'stamen':
				_tilelayer = new L.StamenTileLayer(_map_type_arr[1] || 'toner-lite');
				break;
			case 'zoomify':
				_tilelayer = new L.tileLayer.zoomify(this.options.zoomify.path, {
					width: 			this.options.zoomify.width,
					height: 		this.options.zoomify.height,
					tolerance: 		this.options.zoomify.tolerance,
					attribution: 	this.options.zoomify.attribution,
				});
				this._image_layer = new L.imageOverlay(this.options.zoomify.path + "TileGroup0/0-0-0.jpg", _tilelayer.getZoomifyBounds(this._map));
				break;
			case 'osm':
				_tilelayer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {subdomains: 'ab'});
				break;
		    
			case 'http':
			case 'https':
				_tilelayer = new L.TileLayer(this.options.map_type, {subdomains: this.options.map_subdomains});
				break;
		        
			default:
				_tilelayer = new L.StamenTileLayer('toner');
				break;		
		}
		
		return _tilelayer;
	},
	
	/*	Event
	================================================== */
	_onMapMoveEnd: function(e) {
		
	},
	
	/*	Marker
	================================================== */
	_createMarker: function(d) {
		var marker = new VCO.MapMarker.Leaflet(d, this.options);
		marker.on('markerclick', this._onMarkerClick, this);
		this._addMarker(marker);
		this._markers.push(marker);
		marker.marker_number = this._markers.length - 1;
		this.fire("markerAdded", marker);
		
	},

	_addMarker: function(marker) {
		marker.addTo(this._map);
	},

	_removeMarker: function(marker) {
	
	},
	
	_markerOverview: function() {
		var _location, _zoom;
		// Hide Active Line
		this._line_active.setStyle({opacity:0});
		
		if (this.options.map_type == "zoomify" && this.options.map_as_image) {
			
			var _center_zoom 	= this._tile_layer.getCenterZoom(this._map);
			
			_location = _center_zoom.center;
			
			if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
				_center_zoom.zoom = _center_zoom.zoom - 1;
				_location = this._getMapCenterOffset(_location, _center_zoom.zoom);
			}
			
			this._map.setView(_location, _center_zoom.zoom, {
				pan:{animate: true, duration: this.options.duration/1000, easeLinearity:.10},
				zoom:{animate: true, duration: this.options.duration/1000, easeLinearity:.10}
			});
			
			
			
		} else {
			this.bounds_array = this._getAllMarkersBounds(this._markers);
			
			if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
				var the_bounds 	= new L.latLngBounds(this.bounds_array);
				_location 		= the_bounds.getCenter();
				_zoom 			= this._map.getBoundsZoom(the_bounds)
				
				_location = this._getMapCenterOffset(_location, _zoom - 1);
				
				this._map.setView(_location, _zoom -1, {
					pan:{animate: true, duration: this.options.duration/1000, easeLinearity:.10},
					zoom:{animate: true, duration: this.options.duration/1000, easeLinearity:.10}
				});
				
				
			} else {
				this._map.fitBounds(this.bounds_array, {padding:[15,15]});
			}
			
		}
		
		if (this._mini_map) {
			this._mini_map.minimize();
		}
		
	},
	
	_getAllMarkersBounds: function(markers_array) {
		var bounds_array = [];
		for (var i = 0; i < markers_array.length; i++) {
			if (markers_array[i].data.real_marker) {
				bounds_array.push( [markers_array[i].data.location.lat, markers_array[i].data.location.lon]);
			}
		};
		return bounds_array;
	},
	
	_calculateMarkerZooms: function() {
		for (var i = 0; i < this._markers.length; i++) {
			
			if (this._markers[i].data.location) {
				var marker = this._markers[i],
					prev_marker,
					next_marker,
					marker_location,
					prev_marker_zoom,
					next_marker_zoom,
					calculated_zoom;
				
				
				// MARKER LOCATION
				if (marker.data.type && marker.data.type == "overview") {
					marker_location = this._getMapCenter(true);
				} else {
					marker_location = marker.location();
				}
				// PREVIOUS MARKER ZOOM
				if (i > 0 ) {
					prev_marker = this._markers[i-1].location();
				} else {
					prev_marker = this._getMapCenter(true);
				}
				prev_marker_zoom = this._calculateZoomChange(prev_marker, marker_location);
			
				// NEXT MARKER ZOOM
				if (i < (this._markers.length - 1)) {
					next_marker = this._markers[i+1].location();
				} else {
					next_marker = this._getMapCenter(true);
				}
				next_marker_zoom = this._calculateZoomChange(next_marker, marker_location);
			
			
				if (prev_marker_zoom && prev_marker_zoom < next_marker_zoom) {
					calculated_zoom = prev_marker_zoom;
				} else if (next_marker_zoom){
					calculated_zoom = next_marker_zoom;
					
				} else {
					calculated_zoom = prev_marker_zoom;
				}
				
				if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
					calculated_zoom = calculated_zoom -1;
				}
			
				marker.data.location.zoom = calculated_zoom;
			}
			

		};
		
		
	},
	
	
	
	/*	Line
	================================================== */
	
	_createLine: function(d) {
		return new L.Polyline([], {
			clickable: false,
			color: 		this.options.line_color,
			weight: 	this.options.line_weight,
			opacity: 	this.options.line_opacity,
			dashArray: 	this.options.line_dash,
			lineJoin: 	this.options.line_join,
			className: 	"vco-map-line"
		} );
		
	},
	
	_addLineToMap: function(line) {
		this._map.addLayer(line);
	},
	
	_addToLine: function(line, d) {
		line.addLatLng({lon: d.location.lon, lat: d.location.lat});
	},
	
	_replaceLines: function(line, array) {
		line.setLatLngs(array);
	},
	
	/*	Map
	================================================== */
	_panTo: function(loc, animate) {
		this._map.panTo({lat:loc.lat, lon:loc.lon}, {animate: true, duration: this.options.duration/1000, easeLinearity:.10});
	},
	
	_zoomTo: function(z, animate) {
		this._map.setZoom(z);
	},
	
	_viewTo: function(loc, opts) {
		var _animate 	= true,
			_duration 	= this.options.duration/1000,
			_zoom 		= this._getMapZoom(),
			_location 	= {lat:loc.lat, lon:loc.lon};
		
		// Show Active Line
		if (!this.options.map_as_image) {
			this._line_active.setStyle({opacity:1});
		}
			
		if (loc.zoom) {
			_zoom = loc.zoom;
		}
		
		// Options
		if (opts) {
			if (opts.duration) {
				if (opts.duration == 0) {
					_animate = false;
				} else {
					_duration = duration;
				}
			}
			
			if (opts.zoom && this.options.calculate_zoom) {
				_zoom = opts.zoom;
			}
			
			
			
		}	
		
		// OFFSET
		if (this.options.map_center_offset) {
			_location = this._getMapCenterOffset(_location, _zoom);
		}
		
		this._map.setView(
			_location, 
			_zoom,
			{
				pan:{animate: _animate, duration: _duration, easeLinearity:.10},
				zoom:{animate: _animate, duration: _duration, easeLinearity:.10}
			}
		)
		
		if (this._mini_map && this.options.width > this.options.skinny_size) {
			if ((_zoom - 1) <= this.zoom_min_max.min ) {
				this._mini_map.minimize();
			} else {
				this._mini_map.restore();
				//this._mini_map.updateDisplay(_location, _zoom, _duration);
			}
		} 
		
	},
	
	_getMapLocation: function(m) {
		return this._map.latLngToContainerPoint(m);
	},
	
	_getMapZoom: function() {
		return this._map.getZoom();
	},
	
	_getMapCenter: function(offset) {
		if (offset) {
			
		}
		return this._map.getCenter();
	},
	
	_getMapCenterOffset: function(location, zoom) {
		var target_point,
			target_latlng;
		
		target_point 	= this._map.project(location, zoom).subtract([this.options.map_center_offset.left, this.options.map_center_offset.top]);
		target_latlng 	= this._map.unproject(target_point, zoom);
		
		return target_latlng;

	},
	
	_getBoundsZoom: function(origin, destination, correct_for_center) {
		var _origin = origin;
		
		if (correct_for_center) {
			var _lat = _origin.lat + (_origin.lat - destination.lat)/2,
				_lng = _origin.lng + (_origin.lng - destination.lng)/2;
			_origin = new L.LatLng(_lat, _lng);
		}
		
		var bounds = new L.LatLngBounds([_origin, destination]);
		return this._map.getBoundsZoom(bounds, false);
	},
	
	_getZoomifyZoom: function() {

	},
	
	/*	Display
	================================================== */
	_updateMapDisplay: function(animate, d) {
		if (animate) {
			var duration = this.options.duration,
				self = this;
				
			if (d) {duration = d };
			if (this.timer) {clearTimeout(this.timer)};
			
			this.timer = setTimeout(function() {
				self._refreshMap();
			}, duration);
			
		} else {
			if (!this.timer) {
				this._refreshMap();
			};
		}
		
		if (this._mini_map && this._el.container.offsetWidth < this.options.skinny_size ) {
			this._mini_map.true_hide = true;
			//this._mini_map.minimize();
		} else if (this._mini_map) {
			this._mini_map.true_hide = false;
		}
	},
	
	_refreshMap: function() {
		if (this._map) {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			};
			
			this._map.invalidateSize();
			
			// Check to see if it's an overview
			if (this._markers[this.current_marker].data.type && this._markers[this.current_marker].data.type == "overview") {
				this._markerOverview();
			} else {
				this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom()});
			}
		};
	}
	
	
});

/*	Overwrite and customize Leaflet functions
================================================== */
L.Map.include({
	_tryAnimatedPan: function (center, options) {
		var offset = this._getCenterOffset(center)._floor();

		this.panBy(offset, options);

		return true;
	},
	
	_tryAnimatedZoom: function (center, zoom, options) {
		if (this._animatingZoom) { return true; }

		options = options || {};

		// offset is the pixel coords of the zoom origin relative to the current center
		var scale = this.getZoomScale(zoom),
		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale),
			origin = this._getCenterLayerPoint()._add(offset);

		this
		    .fire('movestart')
		    .fire('zoomstart');

		this._animateZoom(center, zoom, origin, scale, null, true);

		return true;
	}
});