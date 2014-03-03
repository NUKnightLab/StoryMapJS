/*
 Leaflet, a JavaScript library for mobile-friendly interactive maps. http://leafletjs.com
 (c) 2010-2013, Vladimir Agafonkin
 (c) 2010-2011, CloudMade
*/

 
/*	Required Files
	CodeKit Import
	http://incident57.com/codekit/
================================================== */


/*	CORE
	The core of the library, including OOP, events, DOM facilities,
	basic units, projections (EPSG:3857 and EPSG:4326) 
	and the base Map class.
================================================== */
// @codekit-prepend "leaflet-src/Leaflet.js";
// @codekit-prepend "leaflet-src/core/Util.js";
// @codekit-prepend "leaflet-src/core/Class.js";
// @codekit-prepend "leaflet-src/core/Events.js";
// @codekit-prepend "leaflet-src/core/Browser.js";
// @codekit-prepend "leaflet-src/geometry/Point.js";
// @codekit-prepend "leaflet-src/geometry/Bounds.js";
// @codekit-prepend "leaflet-src/geometry/Transformation.js";
// @codekit-prepend "leaflet-src/dom/DomUtil.js";
// @codekit-prepend "leaflet-src/geo/LatLng.js";
// @codekit-prepend "leaflet-src/geo/LatLngBounds.js";
// @codekit-prepend "leaflet-src/geo/projection/Projection.js";
// @codekit-prepend "leaflet-src/geo/projection/Projection.SphericalMercator.js";
// @codekit-prepend "leaflet-src/geo/projection/Projection.LonLat.js";
// @codekit-prepend "leaflet-src/geo/crs/CRS.js";
// @codekit-prepend "leaflet-src/geo/crs/CRS.Simple.js";
// @codekit-prepend "leaflet-src/geo/crs/CRS.EPSG3857.js";
// @codekit-prepend "leaflet-src/geo/crs/CRS.EPSG4326.js";
// @codekit-prepend "leaflet-src/map/Map.js";

// @codekit-prepend "leaflet-src/dom/DomEvent.js";
// @codekit-prepend "leaflet-src/dom/Draggable.js";
// @codekit-prepend "leaflet-src/core/Handler.js";

// @codekit-prepend "leaflet-src/control/Control.js";


/*	Additonal Projections EPSG:3395 projection (used by some map providers).
================================================== */
// "leaflet-src/geo/projection/Projection.Mercator.js";
// "leaflet-src/geo/crs/CRS.EPSG3395.js";


/*	TileLayerWMS WMS tile layer.
================================================== */
// @codekit-prepend "leaflet-src/layer/tile/TileLayer.js";


/*	TileLayerCanvas Tile layer made from canvases (for custom drawing purposes)
================================================== */
// @codekit-prepend "leaflet-src/layer/tile/TileLayer.Canvas.js";


/*	ImageOverlay Used to display an image over a particular rectangular area of the map.
================================================== */
// @codekit-prepend "leaflet-src/layer/ImageOverlay.js";


/*	Marker Markers to put on the map.
================================================== */
// @codekit-prepend "leaflet-src/layer/marker/Icon.js";
// @codekit-prepend "leaflet-src/layer/marker/Icon.Default.js";
// @codekit-prepend "leaflet-src/layer/marker/Marker.js";


/*	DivIcon Lightweight div-based icon for markers.
================================================== */
// @codekit-prepend "leaflet-src/layer/marker/DivIcon.js";


/*	Popup Used to display the map popup (used mostly for binding HTML data to markers and paths on click).
================================================== */
// "leaflet-src/layer/Popup.js";
// "leaflet-src/layer/marker/Marker.Popup.js";


/*	LayerGroup Allows grouping several layers to handle them as one.
================================================== */
// @codekit-prepend "leaflet-src/layer/LayerGroup.js";


/*	FeatureGroup Extends LayerGroup with mouse events and bindPopup method shared between layers.
================================================== */
// @codekit-prepend "leaflet-src/layer/FeatureGroup.js";


/*	Path Vector rendering core (SVG-powered), enables overlaying the map with SVG paths.
================================================== */
// @codekit-prepend "leaflet-src/layer/vector/Path.js";
// @codekit-prepend "leaflet-src/layer/vector/Path.SVG.js";
// "leaflet-src/layer/vector/Path.Popup.js";


/*	PathVML VML fallback for vector rendering core (IE 6-8)
================================================== */
// "leaflet-src/layer/vector/Path.VML.js";


/*	Path Canvas fallback for vector rendering core (makes it work on Android 2+)
================================================== */
// @codekit-prepend "leaflet-src/layer/vector/canvas/Path.Canvas.js";


/*	Polyline Polyline overlays.
================================================== */
// @codekit-prepend "leaflet-src/geometry/LineUtil.js";
// @codekit-prepend "leaflet-src/layer/vector/Polyline.js";


/*	Polygon Polygon overlays
================================================== */
// @codekit-prepend "leaflet-src/geometry/PolyUtil.js";
// @codekit-prepend "leaflet-src/layer/vector/Polygon.js";


/*	MultiPoly MultiPolygon and MultyPolyline layers.
================================================== */
// @codekit-prepend "leaflet-src/layer/vector/MultiPoly.js";


/*	Rectangle
================================================== */
// @codekit-prepend "leaflet-src/layer/vector/Rectangle.js";


/*	Circle
================================================== */
// "leaflet-src/layer/vector/Circle.js";


/*	CircleMarker
================================================== */
// "leaflet-src/layer/vector/CircleMarker.js";


/*	VectorsCanvas Canvas fallback for vector layers (polygons, polylines, circles, circlemarkers)
================================================== */
// @codekit-prepend "leaflet-src/layer/vector/canvas/Polyline.Canvas.js";
// "leaflet-src/layer/vector/canvas/Polygon.Canvas.js";
// "leaflet-src/layer/vector/canvas/Circle.Canvas.js";
// "leaflet-src/layer/vector/canvas/CircleMarker.Canvas.js";


/*	GeoJSON GeoJSON layer, parses the data and adds corresponding layers above.
================================================== */
// "leaflet-src/layer/GeoJSON.js";


/*	MapDrag Makes the map draggable (by mouse or touch).
================================================== */
// @codekit-prepend "leaflet-src/map/handler/Map.Drag.js";


/*	MouseZoom Scroll wheel zoom and double click zoom on the map.
================================================== */
// @codekit-prepend "leaflet-src/map/handler/Map.DoubleClickZoom.js";
// @codekit-prepend "leaflet-src/map/handler/Map.ScrollWheelZoom.js";


/*	TouchZoom Enables smooth touch zoom / tap / longhold / doubletap on iOS, IE10, Android
================================================== */
// @codekit-prepend "leaflet-src/dom/DomEvent.DoubleTap.js";
// @codekit-prepend "leaflet-src/dom/DomEvent.Pointer.js";
// @codekit-prepend "leaflet-src/map/handler/Map.TouchZoom.js";
// @codekit-prepend "leaflet-src/map/handler/Map.Tap.js";


/*	BoxZoom Enables zooming to bounding box by shift-dragging the map.
================================================== */
// "leaflet-src/map/handler/Map.BoxZoom.js";


/*	Keyboard Enables keyboard pan/zoom when the map is focused.
================================================== */
// "leaflet-src/map/handler/Map.Keyboard.js";


/*	ControlZoom Basic zoom control with two buttons (zoom in / zoom out).
================================================== */
// @codekit-prepend "leaflet-src/control/Control.Zoom.js";


/*	ControlAttrib Attribution control.
================================================== */
// @codekit-prepend "leaflet-src/control/Control.Attribution.js";


/*	ControlScale Scale control.
================================================== */
// "leaflet-src/control/Control.Scale.js";


/*	ControlLayers
	Layer Switcher control.
================================================== */
// "leaflet-src/control/Control.Layers.js";


/*	AnimationPan Core panning animation support.
================================================== */
// @codekit-prepend "leaflet-src/dom/PosAnimation.js";
// @codekit-prepend "leaflet-src/map/anim/Map.PanAnimation.js";


/*	AnimationTimer Timer-based pan animation fallback for browsers that don\'t support CSS3 transitions.
================================================== */
// @codekit-prepend "leaflet-src/dom/PosAnimation.Timer.js";


/*	AnimationZoom Smooth zooming animation. Works only on browsers that support CSS3 Transitions.
================================================== */
// @codekit-prepend "leaflet-src/map/anim/Map.ZoomAnimation.js";
// @codekit-prepend "leaflet-src/layer/tile/TileLayer.Anim.js";


/*	Geolocation Adds Map#locate method and related events to make geolocation easier.'
================================================== */
// "leaflet-src/map/ext/Map.Geolocation.js";


