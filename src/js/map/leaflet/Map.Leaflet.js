import {
  classMixin
} from "../../core/Util";
import { LeafletModule } from "leaflet";
export { LeafletModule }
import * as proj4 from "proj4";
export { proj4 }
import * as proj4leaflet from "proj4leaflet";
import Map from "../Map";
import Events from "../../core/Events";
import ZoomifyTileLayer from "./extensions/Leaflet.TileLayer.Zoomify";
import MiniMapControl from "./extensions/Leaflet.MiniMap.js";
import LeafletMapMarker from "./MapMarker.Leaflet";
import StamenTileLayer from "../tile/TileLayer.Stamen";

/*	Map.Leaflet
	Creates a Map using Leaflet
================================================== */

//export default class Leaflet {
//Map.Leaflet = Map.extend({
export default class Leaflet extends Map {

  //includes: [Events],

  /*	Create the Map
  ================================================== */
  _createMap() {

    // Set the CRS of the Leaflet map. If user has indicated a specific CRS check it against a set of support CRS here
    var map_crs_requested;

    //console.log(this.options);
    var Ll = require('leaflet');
    console.log(Ll);
    var proj4p = require('proj4');
    console.log(proj4p);
    switch (this.options.map_crs) {
      case "EPSG:4326":
      console.log(L);
        map_crs_requested = L.CRS.EPSG4326;
        break;
      case "EPSG:3978":
        var crs_proj4def = "+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
				var crs_options ={
					resolutions: [8192,4096,2048,1024,512,256,128],
					origin: [0,0]
				}
        var EPSG3978 = new L.Proj.CRS(
          crs_code,
          crs_proj4def,
          crs_options
        );
				map_crs_requested = EPSG3978;
				console.log(map_crs_requested);
				break;
      default: //add case for 3978 ****************************************
        map_crs_requested = L.CRS.EPSG3857;
        break;
    }
    console.log(map_crs_requested);

    this._map = new L.map(this._el.map, {
      scrollWheelZoom: false,
      zoomControl: !this.options.map_mini,
      crs: map_crs_requested
    });

    // Detect if base_map has been defined in options object.
    if ((typeof this.options.base_map === "string" && this.options.base_map !== "") ||
      (typeof this.options.base_map === "object" && Object.keys(this.options.base_map).length === 0)) {
      this._base_layer = this._createTileLayer(this.options.base_map);
      this._map.addLayer(this._base_layer);
    }

    this._map.on("load", this._onMapLoaded, this);


    this._map.on("moveend", this._onMapMoveEnd, this);
    this._map.attributionControl.setPrefix("<a href='http://storymap.knightlab.com/' target='_blank' class='vco-knightlab-brand'><span>&#x25a0;</span> StoryMapJS</a>");

    //var map_type_arr = this.options.map_type.split(':');

    // Create Tile Layer
    this._tile_layer = this._createTileLayer(this.options.map_type);
    this._tile_layer.on("load", this._onTilesLoaded, this);

    // Add Tile Layer
    this._map.addLayer(this._tile_layer);

    // Add Zoomify Image Layer
    if (this._image_layer) {
      this._map.addLayer(this._image_layer);
    }
    // Create Overall Connection Line
    this._line = this._createLine(this._line);
    this._line.setStyle({
      color: this.options.line_color_inactive
    });
    this._addLineToMap(this._line);

    // Create Active Line
    this._line_active = this._createLine(this._line_active);
    this._line_active.setStyle({
      opacity: 1
    });
    this._addLineToMap(this._line_active);

    if (this.options.map_as_image) {
      this._line_active.setStyle({
        opacity: 0
      });
      this._line.setStyle({
        opacity: 0
      });
    }



  }

  /*	Create Mini Map
  ================================================== */
  _createMiniMap() {
    if (this.options.map_as_image) {
      this.zoom_min_max.min = 0;
    }

    if (!this.bounds_array) {
      this.bounds_array = this._getAllMarkersBounds(this._markers);
    }

    // Detect if base_map defined in options object, use this as layer on minimap if defined.
    this._tile_layer_mini = this._createTileLayer(this.options.base_map || this.options.map_type);
    this._mini_map = new MiniMapControl(this._tile_layer_mini, {
      width: 150,
      height: 100,
      position: "topleft",
      bounds_array: this.bounds_array,
      zoomLevelFixed: this.zoom_min_max.min,
      zoomAnimation: true,
      aimingRectOptions: {
        fillColor: "#FFFFFF",
        color: "#FFFFFF",
        opacity: 0.4,
        weight: 1,
        stroke: true
      }
    }).addTo(this._map);

    this._mini_map.getContainer().style.backgroundColor = this.options.map_background_color;

  }

  /*	Create Background Map
  ================================================== */
  _createBackgroundMap(tiles) {

    // TODO Check width and height
    if (!this._image_layer) {
      // Make Image Layer a Group
      this._image_layer = new L.layerGroup();
      // Add Layer Group to Map
      this._map.addLayer(this._image_layer);

    } else {
      this._image_layer.clearLayers();
    }

    if (tiles) {
      // Create Image Overlay for each tile in the group
      for (let x in tiles) {
        var target_tile = tiles[x],
          image = {},
          tile = {
            x: 0,
            y: 0,
            url: target_tile.src,
            height: parseInt(target_tile.style.height.split("px")[0]),
            width: parseInt(target_tile.style.width.split("px")[0]),
            pos: {
              start: 0,
              end: 0
            }
          };

        if (target_tile.style.left || target_tile.style.top) {
          if (target_tile.style.left) {
            tile.x = parseInt(target_tile.style.left.split("px")[0]);
          }
          if (target_tile.style.top) {
            tile.y = parseInt(target_tile.style.top.split("px")[0]);
          }
        } else if (target_tile.style["-webkit-transform"] || target_tile.style["transform"] || target_tile.style["-ms-transform"]) {
          var t_array;

          if (target_tile.style["-webkit-transform"]) {
            t_array = target_tile.style["-webkit-transform"].split("3d(")[1].split(", 0)")[0].split(", ");
          } else if (target_tile.style["transform"]) {
            t_array = target_tile.style["transform"].split("3d(")[1].split(", 0)")[0].split(", ");
          } else if (target_tile.style["-ms-transform"]) {
            t_array = target_tile.style["-ms-transform"].split("3d(")[1].split(", 0)")[0].split(", ");
          }

          tile.x = parseInt(t_array[0].split("px")[0]);
          tile.y = parseInt(t_array[1].split("px")[0]);
        }


        // If using toner, switch to toner lines
        if (tile.url.match("toner")) {
          //tile.url = tile.url.replace("/toner-lite/","/toner-lines/");
          tile.url = tile.url.replace("/toner-hybrid/", "/toner-lines/");
          tile.url = tile.url.replace("/toner/", "/toner-background/");
        }

        tile.pos.start = this._map.containerPointToLatLng([tile.x, tile.y]);
        tile.pos.end = this._map.containerPointToLatLng([tile.x + tile.width, tile.y + tile.height]);

        image = new L.imageOverlay(tile.url, [tile.pos.start, tile.pos.end]);
        this._image_layer.addLayer(image);

      }
    }

  }

  /*	Create Tile Layer
  ================================================== */
  _createTileLayer(map_type, options) {
    var _tilelayer = null,
      // Set the map type by detecting the type, if an object the type is passed in url attribute
      _map_type_arr = (typeof map_type === "object") ? map_type.url.split(':') : map_type.split(':'),
      // Set the map options by decting type, if object the map options are passed in options attribute
      _map_options = (typeof map_type === "object") ? map_type.options : {},
      _options = {},
      _attribution_knightlab = "<a href='http://leafletjs.com' title='A JS library for interactive maps'>Leaflet</a> | "

    if (options) {
      _options = options; // WARNING this is just a reference not a copy. If the idea was to protect options it isn't doing that.
    }

    // Set Tiles
    switch (_map_type_arr[0]) {
      case 'mapbox':
        var mapbox_url;
        _options.attribution = _attribution_knightlab + "<div class='mapbox-maplogo'></div><a href='https://www.mapbox.com/about/maps/' target='_blank'>© Mapbox © OpenStreetMap</a>";
        if (_map_type_arr.length > 2) {
          // new form mapbox URL:
          // mapbox://styles/nuknightlab/cjl6w8oio0agu2sltd04tp1kx
          var this_mapbox_map = _map_type_arr[2].substr('//styles/'.length);
          mapbox_url = "https://api.mapbox.com/styles/v1/" + this_mapbox_map + "/tiles/256/{z}/{x}/{y}@2x?access_token=" + this.options.map_access_token;
        } else {
          // legacy configuration
          // nuknightlab.cjl6w8oio0agu2sltd04tp1kx
          var mapbox_name = _map_type_arr[1];
          mapbox_url = "https://api.tiles.mapbox.com/v4/" + mapbox_name + "/{z}/{x}/{y}.png?access_token=" + this.options.map_access_token;
        }
        _tilelayer = new L.TileLayer(mapbox_url, _options);
        break;
      case 'stamen':
        _tilelayer = new StamenTileLayer(_map_type_arr[1] || 'toner-lite', _options);
        this._map.getContainer().style.backgroundColor = "#FFFFFF";
        break;
      case 'zoomify':
        _options.width = this.options.zoomify.width;
        _options.height = this.options.zoomify.height;
        _options.tolerance = this.options.zoomify.tolerance || 0.9;
        _options.attribution = _attribution_knightlab + this.options.zoomify.attribution;

        _tilelayer = new ZoomifyTileLayer(this.options.zoomify.path, _options);
        //this._image_layer = new L.imageOverlay(this.options.zoomify.path + "TileGroup0/0-0-0.jpg", _tilelayer.getZoomifyBounds(this._map));
        break;
      case 'osm':
        _options.subdomains = 'ab';
        _options.attribution = _attribution_knightlab + "© <a target='_blank' href='http://www.openstreetmap.org'>OpenStreetMap</a> and contributors, under an <a target='_blank' href='http://www.openstreetmap.org/copyright'>open license</a>";
        _tilelayer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', _options);
        break;
        // Adding support for WMS layer by calling TileLayer.WMS Leaflet function
      case 'wms':
        _options.attribution = _attribution_knightlab + this.options.attribution;
        // Force the transparency of the WMS layer so either the map background or base map are visible
        _map_options.transparent = true;
        _tilelayer = new L.TileLayer.WMS(map_type.url.slice(4), _map_options);
        break;
        // Adding support for WMTS layer by calling TileLayer Leaflet function
      case 'wmts':
        _tilelayer = new L.TileLayer(map_type.url.slice(5), _map_options);
        break;
      case 'http':
      case 'https':
        _options.subdomains = this.options.map_subdomains;
        _options.attribution = _attribution_knightlab + this.options.attribution;
        _tilelayer = new L.TileLayer(this.options.map_type, _options);
        break;

      default:
        _tilelayer = new StamenTileLayer('toner', _options);
        break;
    }

    return _tilelayer;
  }

  /*	Events
  ================================================== */
  _onMapMoveEnd(e) {

  }

  _onTilesLoaded(e) {
    this._createBackgroundMap(e.target._tiles);
    this._tile_layer.off("load", this._onTilesLoaded, this);
  }

  _onMapZoomed(e) {
    this._map.off("zoomend", this._onMapZoomed, this);

  }

  _onMapZoom(e) {

  }

  /*	Marker
  ================================================== */
  _createMarker(d) {
    var marker = new LeafletMapMarker(d, this.options);
    marker.on('markerclick', this._onMarkerClick, this);
    this._addMarker(marker);
    this._markers.push(marker);
    marker.marker_number = this._markers.length - 1;
    this.fire("markerAdded", marker);

  }

  _addMarker(marker) {
    marker.addTo(this._map);
  }

  _removeMarker(marker) {

  }

  _markerOverview() {
    var _location, _zoom;
    // Hide Active Line
    this._line_active.setStyle({
      opacity: 0
    });

    if (this.options.map_type == "zoomify" && this.options.map_as_image) {

      var _center_zoom = this._tile_layer.getCenterZoom(this._map);

      _location = _center_zoom.center;

      if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
        _center_zoom.zoom = _center_zoom.zoom - 1;
        _location = this._getMapCenterOffset(_location, _center_zoom.zoom);
      }

      this._map.setView(_location, _center_zoom.zoom, {
        pan: {
          animate: true,
          duration: this.options.duration / 1000,
          easeLinearity: .10
        },
        zoom: {
          animate: true,
          duration: this.options.duration / 1000,
          easeLinearity: .10
        }
      });



    } else {
      this.bounds_array = this._getAllMarkersBounds(this._markers);

      if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
        var the_bounds = new L.latLngBounds(this.bounds_array);
        _location = the_bounds.getCenter();
        _zoom = this._map.getBoundsZoom(the_bounds)

        _location = this._getMapCenterOffset(_location, _zoom - 1);

        this._map.setView(_location, _zoom - 1, {
          pan: {
            animate: true,
            duration: this.options.duration / 1000,
            easeLinearity: .10
          },
          zoom: {
            animate: true,
            duration: this.options.duration / 1000,
            easeLinearity: .10
          }
        });


      } else {
        this._map.fitBounds(this.bounds_array, {
          padding: [15, 15]
        });
      }

    }

    if (this._mini_map) {
      this._mini_map.minimize();
    }

  }

  _getAllMarkersBounds(markers_array) {
    var bounds_array = [];
    for (var i = 0; i < markers_array.length; i++) {
      if (markers_array[i].data.real_marker) {
        bounds_array.push([markers_array[i].data.location.lat, markers_array[i].data.location.lon]);
      }
    };
    return bounds_array;
  }

  _calculateMarkerZooms() {
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
        if (i > 0) {
          prev_marker = this._markers[i - 1].location();
        } else {
          prev_marker = this._getMapCenter(true);
        }
        prev_marker_zoom = this._calculateZoomChange(prev_marker, marker_location);

        // NEXT MARKER ZOOM
        if (i < (this._markers.length - 1)) {
          next_marker = this._markers[i + 1].location();
        } else {
          next_marker = this._getMapCenter(true);
        }
        next_marker_zoom = this._calculateZoomChange(next_marker, marker_location);


        if (prev_marker_zoom && prev_marker_zoom < next_marker_zoom) {
          calculated_zoom = prev_marker_zoom;
        } else if (next_marker_zoom) {
          calculated_zoom = next_marker_zoom;

        } else {
          calculated_zoom = prev_marker_zoom;
        }

        if (this.options.map_center_offset && this.options.map_center_offset.left != 0 || this.options.map_center_offset.top != 0) {
          calculated_zoom = calculated_zoom - 1;
        }

        marker.data.location.zoom = calculated_zoom;
      }


    };


  }



  /*	Line
  ================================================== */

  _createLine(d) {
    return new L.Polyline([], {
      clickable: false,
      color: this.options.line_color,
      weight: this.options.line_weight,
      opacity: this.options.line_opacity,
      dashArray: this.options.line_dash,
      lineJoin: this.options.line_join,
      className: "vco-map-line"
    });

  }

  _addLineToMap(line) {
    this._map.addLayer(line);
  }

  _addToLine(line, d) {
    line.addLatLng({
      lon: d.location.lon,
      lat: d.location.lat
    });
  }

  _replaceLines(line, array) {
    line.setLatLngs(array);
  }

  /*	Map
  ================================================== */
  _panTo(loc, animate) {
    this._map.panTo({
      lat: loc.lat,
      lon: loc.lon
    }, {
      animate: true,
      duration: this.options.duration / 1000,
      easeLinearity: .10
    });
  }

  _zoomTo(z, animate) {
    this._map.setZoom(z);
  }

  _updateLayer(nl) {
    this._map.removeLayer(this._tile_layer);
    this._tile_layer = this._createTileLayer(nl);
    this._map.addLayer(this._tile_layer);
  }

  _viewTo(loc, opts) {
    var _animate = true,
      _duration = this.options.duration / 1000,
      _zoom = this._getMapZoom(),
      _location = {
        lat: loc.lat,
        lon: loc.lon
      };

    // Show Active Line
    if (!this.options.map_as_image) {
      this._line_active.setStyle({
        opacity: 1
      });
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
      _zoom, {
        pan: {
          animate: _animate,
          duration: _duration,
          easeLinearity: .10
        },
        zoom: {
          animate: _animate,
          duration: _duration,
          easeLinearity: .10
        }
      }
    )

    if (this._mini_map && this.options.width > this.options.skinny_size) {
      if ((_zoom - 1) <= this.zoom_min_max.min) {
        this._mini_map.minimize();
      } else {
        this._mini_map.restore();
        //this._mini_map.updateDisplay(_location, _zoom, _duration);
      }
    }

  }

  _getMapLocation(m) {
    return this._map.latLngToContainerPoint(m);
  }

  _getMapZoom() {
    return this._map.getZoom();
  }

  _getMapCenter(offset) {
    if (offset) {

    }
    return this._map.getCenter();
  }

  _getMapCenterOffset(location, zoom) {
    var target_point,
      target_latlng;

    target_point = this._map.project(location, zoom).subtract([this.options.map_center_offset.left, this.options.map_center_offset.top]);
    target_latlng = this._map.unproject(target_point, zoom);

    return target_latlng;

  }

  _getBoundsZoom(origin, destination, correct_for_center) {
    var _origin = origin,
      _padding = [(Math.abs(this.options.map_center_offset.left) * 3), (Math.abs(this.options.map_center_offset.top) * 3)];


    //_padding = [0,0];
    //_padding = [0,0];
    if (correct_for_center) {
      var _lat = _origin.lat + (_origin.lat - destination.lat) / 2,
        _lng = _origin.lng + (_origin.lng - destination.lng) / 2;
      _origin = new L.LatLng(_lat, _lng);
    }

    var bounds = new L.LatLngBounds([_origin, destination]);
    if (this.options.less_bounce) {
      return this._map.getBoundsZoom(bounds, false, _padding);
    } else {
      return this._map.getBoundsZoom(bounds, true, _padding);
    }
  }

  _getZoomifyZoom() {

  }

  _initialMapLocation() {
    this._map.on("zoomend", this._onMapZoomed, this);
  }

  /*	Display
  ================================================== */
  _updateMapDisplay(animate, d) {
    if (animate) {
      var duration = this.options.duration,
        self = this;

      if (d) {
        duration = d
      };
      if (this.timer) {
        clearTimeout(this.timer)
      };

      this.timer = setTimeout(function() {
        self._refreshMap();
      }, duration);

    } else {
      if (!this.timer) {
        this._refreshMap();
      };
    }

    if (this._mini_map && this._el.container.offsetWidth < this.options.skinny_size) {
      this._mini_map.true_hide = true;
      //this._mini_map.minimize();
    } else if (this._mini_map) {
      this._mini_map.true_hide = false;
    }
  }

  _refreshMap() {
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
        this._viewTo(this._markers[this.current_marker].data.location, {
          zoom: this._getMapZoom()
        });
      }
    };
  }


}

classMixin(Leaflet, Events)

/*	Overwrite and customize Leaflet functions
================================================== */
L.Map.include({
  _tryAnimatedPan: function(center, options) {
    var offset = this._getCenterOffset(center)._floor();

    this.panBy(offset, options);

    return true;
  },

  _tryAnimatedZoom: function(center, zoom, options) {
    if (typeof this._animateZoom == "undefined") {
      return false;
    }
    if (this._animatingZoom) {
      return true;
    }

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
  },

  getBoundsZoom: function(bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
    bounds = L.latLngBounds(bounds);

    var zoom = this.getMinZoom() - (inside ? 1 : 0),
      minZoom = this.getMinZoom(),
      maxZoom = this.getMaxZoom(),
      size = this.getSize(),

      nw = bounds.getNorthWest(),
      se = bounds.getSouthEast(),

      zoomNotFound = true,
      boundsSize,
      zoom_array = [],
      best_zoom = {
        x: 0,
        y: 0
      },
      smallest_zoom = {},
      final_zoom = 0;

    padding = L.point(padding || [0, 0]);
    size = this.getSize();


    // Calculate Zoom Level Differences
    for (var i = 0; i < maxZoom; i++) {
      zoom++;
      boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
      zoom_array.push({
        x: Math.abs(size.x - boundsSize.x),
        y: Math.abs(size.y - boundsSize.y)
      })
    }

    // Determine closest match
    smallest_zoom = zoom_array[0];
    for (var j = 0; j < zoom_array.length; j++) {
      if (zoom_array[j].y <= smallest_zoom.y) {
        smallest_zoom.y = zoom_array[j].y;
        best_zoom.y = j;
      }
      if (zoom_array[j].x <= smallest_zoom.x) {
        smallest_zoom.x = zoom_array[j].x;
        best_zoom.x = j;
      }

    }
    final_zoom = Math.round((best_zoom.y + best_zoom.x) / 2)
    return final_zoom;

  }

});

L.TileLayer.include({
  getTiles: function() {
    return this._tiles;
  }
});
