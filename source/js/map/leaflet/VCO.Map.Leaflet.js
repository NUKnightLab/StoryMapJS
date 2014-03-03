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
		this._tile_layer_mini = this._createTileLayer();
		this._mini_map = new L.Control.MiniMap(this._tile_layer_mini, {
			width: 				150,
			height: 			100,
			position: 			"bottomleft",
			zoomLevelFixed: 	false,
			zoomLevelOffset: 	-6,
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

		// Set Tiles
		switch(_map_type_arr[0]) {
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
			
			if (this.options.map_center_offset) {
				trace("marker overview offset")
				_location = this._getMapCenterOffset(_location, _center_zoom.zoom);
			}
			
			this._map.setView(_location, _center_zoom.zoom, {
				pan:{animate: true, duration: this.options.duration/1000, easeLinearity:.10},
				zoom:{animate: true, duration: this.options.duration/1000, easeLinearity:.10}
			});
			
		} else {
			var bounds_array = [];
		
			for (var i = 0; i < this._markers.length; i++) {
				if (this._markers[i].data.real_marker) {
					bounds_array.push( [this._markers[i].data.location.lat, this._markers[i].data.location.lon]);
				}
			};
			
			if (this.options.map_center_offset) {
				trace("marker overview offset")
				var the_bounds 	= new L.latLngBounds(bounds_array);
				_location 		= the_bounds.getCenter();
				_zoom 			= this._map.getBoundsZoom(the_bounds)
				
				_location = this._getMapCenterOffset(_location, _zoom);
				
				this._map.setView(_location, _zoom, {
					pan:{animate: true, duration: this.options.duration/1000, easeLinearity:.10},
					zoom:{animate: true, duration: this.options.duration/1000, easeLinearity:.10}
				});
				
				
			} else {
				this._map.fitBounds(bounds_array, {padding:[15,15]});
			}
			
		}
		
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
		
			if (opts.zoom && opts.calculate_zoom) {
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
		
		if (this._mini_map) {
			this._mini_map.updateDisplay(_location, _zoom, _duration);
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
		
		
		/*
		var point, offset_y;
		
		offset_y = (this._map.getSize().y/2);
		
		if (add) {
			offset_y = offset_y + this.options.map_center_offset;
			point = this._map.project(location, zoom).add([0, offset_y]);
		} else {
			offset_y = offset_y - this.options.map_center_offset;
			point = this._map.project(location, zoom).subtract([0, offset_y]);
		}

		return this._map.unproject(point, zoom);
		*/

	},
	
	_getBoundsZoom: function(origin, destination, correct_for_center) {
		var _origin = origin;
		
		if (this.options.map_center_offset) {
			//_origin = this._getMapCenterOffset(origin, this._getMapZoom(), true);
		}
		
		if (correct_for_center) {
			var _lat = _origin.lat + (_origin.lat - destination.lat)/2,
				_lng = _origin.lng + (_origin.lng - destination.lng)/2;
			_origin = new L.LatLng(_lat, _lng);
		}
		
		var bounds = new L.LatLngBounds([_origin, destination]);
		return this._map.getBoundsZoom(bounds, false, this.padding);
	},
	
	_getZoomifyZoom: function() {

	},
	
	/*	Display
	================================================== */
	_updateMapDisplay: function(w, h, animate, d) {
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
	},
	
	_refreshMap: function() {
		if (this._map) {
			//this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			};
			
			this._map.invalidateSize();
			//this._viewTo(this._markers[this.current_marker].data.location);
			//this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			// Check to see if it's an overview
			if (this._markers[this.current_marker].data.type && this._markers[this.current_marker].data.type == "overview") {
				this._markerOverview();
			} else {
				this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			}
		};
	}
	
	
});
