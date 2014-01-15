// ToolMap.js
//
// Requires: Google Maps, Leaflet, jquery
//

function ToolMap(options) {
    this.name = "";
    this.map = null;       
    this.markers = [];
    
    this.zoom_listener = null;
    
    // Default options
    this.options = {
        map_id: 'map',
        map_overlay_id: 'map_overlay',
        handlers: {
            zoom: function(zoom) {},
            double_click: function(lat, lng) {},
            marker_drag: function(lat, lng) {}
        }
    };        
    $.extend(true, this.options, options || {});
    
    // Shortcut
    this.handlers = this.options.handlers;
}

ToolMap.prototype.onZoom = function() {
    this.handlers.zoom(this.map.getZoom());
}

ToolMap.prototype.getZoom = function() {
    return this.map.getZoom();
}

ToolMap.prototype.setZoom = function(zoom) {
    this.map.setZoom(zoom);
}

ToolMap.prototype.panTo = function(lat, lng) {
    this.map.panTo(this.LatLng(lat, lng));
}

ToolMap.prototype.fitBounds = function(latlngbounds) {
    this.map.fitBounds(latlngbounds);
}

// ------------------------------------------------------------
// Google Maps
// ------------------------------------------------------------

function GoogleToolMap(map_element_id, options) {
    var self = this;
    
    ToolMap.apply(this, Array.prototype.slice.call(arguments));
    
    this.name = "google";
    this.overlay = null;
    
    this.map = new google.maps.Map(document.getElementById(this.options.map_id), {
        disableDoubleClickZoom: true,
        mapTypeControl: false,
        panControl: true,
        scrollwheel: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        }
    });
    
    // Preset map types
    this.map.mapTypes.set("stamen:toner", new google.maps.StamenMapType("toner"))
    this.map.mapTypes.set("stamen:toner-lines", new google.maps.StamenMapType("toner-lines"))
    this.map.mapTypes.set("stamen:toner-labels", new google.maps.StamenMapType("toner-labels"))
    this.map.mapTypes.set("stamen:terrain", new google.maps.StamenMapType("terrain"))
    this.map.mapTypes.set("stamen:watercolor", new google.maps.StamenMapType("watercolor"))
    this.map.mapTypes.set("osm:standard",new google.maps.OSMMapType());
   
    google.maps.event.addListener(this.map, 'dblclick', function(e) {
        self.handlers.double_click(e.latLng.lat(), e.latLng.lng());
    });
}

GoogleToolMap.prototype = Object.create(ToolMap.prototype);

GoogleToolMap.prototype.LatLng = function(lat, lng) {
    return new google.maps.LatLng(lat, lng);
}

GoogleToolMap.prototype.LatLngBounds = function() {
    return new google.maps.LatLngBounds();
}

GoogleToolMap.prototype.addPolyLine = function() {
    var that = this;
    var div = null;
    
    this.overlay = new google.maps.OverlayView();   
    
    this.overlay.onAdd = function() {
        div = document.createElement('div');
        div.style.position = 'absolute';
 
        var panes = this.getPanes();
        panes.overlayImage.appendChild(div);    
    };

    this.overlay.draw = function() {
        div.style.left = '0px';
        div.style.top = '0px';
        div.style.width = $(that.map.getDiv()).width()+'px';
        div.style.height = $(that.map.getDiv()).height()+'px';
  
        var overlayProjection = this.getProjection();
 
        var points = [];   
        for(var i = 0; i < that.markers.length; i++) {
            var pixel = overlayProjection.fromLatLngToContainerPixel(that.markers[i].getPosition());
            points.push(pixel.x+','+pixel.y);
        }       
        $('#'+that.options.map_overlay_id+' polyline').attr('points', points.join(' '));
    };

    this.overlay.onRemove = function() {
        div.parentNode.removeChild(div);
        div = null;
        $('#'+that.options.map_overlay_id+' polyline').attr('points', '');
    };
    
    this.overlay.setMap(this.map);
}

GoogleToolMap.prototype.removePolyLine = function() {
    if(this.overlay) {
        this.overlay.setMap(null);
        this.overlay = null;
    }
}

GoogleToolMap.prototype.addMarker = function(lat, lng, draggable) {
    var marker = new google.maps.Marker({
        map: this.map,
        draggable: true,    // always true for display purposes
        position: new google.maps.LatLng(lat, lng)
    });
    
    if(draggable) {
        google.maps.event.addListener(marker, 'dragend', this.onMarkerDrag.bind(this)); 
    }   
    this.markers.push(marker);
    return marker;
}

GoogleToolMap.prototype.clearOverlays = function() {
    this.removePolyLine();
    
    for(var i = this.markers.length - 1; i >=0; i--) {
        this.markers[i].setMap(null);
    } 
    this.markers = [];
}

GoogleToolMap.prototype.onMarkerDrag = function() {
    var pos = this.markers[0].getPosition();
    this.handlers.marker_drag(pos.lat, pos.lng);
}

GoogleToolMap.prototype.zoomEnable = function(enable) {
    if(enable) {
        if(!this.zoom_listener) {
            this.zoom_listener = google.maps.event.addListener(
                this.map, 'zoom_changed', this.onZoom.bind(this)
            );
        }
        this.map.setOptions({panControl: true, zoomControl: true});
    } else {
        if(this.zoom_listener) {
            google.maps.event.removeListener(this.zoom_listener);
            this.zoom_listener = null;
        }
        this.map.setOptions({panControl: false, zoomControl: false});
    }
}

// Set center and zoom
GoogleToolMap.prototype.setView = function(lat, lng, zoom) {
    this.panTo(lat, lng);
    this.setZoom(zoom);
}

// Set mapTypeId
GoogleToolMap.prototype.setMapType = function(map_type, map_subdomains) {    
    if(map_type && map_type.match("http://")) {
        this.map.mapTypes.set("custom", new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                var index = (coord.x + coord.y) % map_subdomains.length;                        
                return map_type
                    .replace('{s}', map_subdomains[index])
                    .replace('{z}', zoom)
                    .replace('{x}', coord.x)
                    .replace('{y}', coord.y);
            },
            tileSize: new google.maps.Size(256, 256),
            name: "Custom",
            maxZoom: 18
        }));
    } else {
        switch(map_type) {
            case "stamen:toner":
            case "stamen:toner-lines":
            case "stamen:toner-labels":
            case "stamen:watercolor":
            case "stamen:terrain":
            case "osm:standard":
                this.map.setOptions({mapTypeId: map_type});
                break;    
            
            default:
                this.map.setOptions({mapTypeId: "stamen:toner"});
                break;
        }
    }
}

// ------------------------------------------------------------
// Leaflet
// ------------------------------------------------------------

function LeafletToolMap(map_element_id, options) {
    var self = this;
        
    ToolMap.apply(this, Array.prototype.slice.call(arguments));

    this.name = "leaflet";
    
    this.map = L.map(this.options.map_id, {
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        zoomControl: false
    });
    
    this.map.on('dblclick', function(e) {
        self.handlers.double_click(e.latlng.lat, e.latlng.lng);
    });

    this.zoom_listener = this.onZoom.bind(this);
    this.zoom_control = null;
    this.polyline = null;
}

LeafletToolMap.prototype = Object.create(ToolMap.prototype);

LeafletToolMap.prototype.LatLng = function(lat, lng) {
    return L.latLng(lat, lng);
}

LeafletToolMap.prototype.LatLngBounds = function() {
    return L.latLngBounds([]);
}

LeafletToolMap.prototype.addPolyLine = function() {
    this.polyline = L.polyline([], {  
        color: '#cc0000',
        weight: 2,
        opacity: 1,
        fill: false
    });
    for(var i = 0; i < this.markers.length; i++) {
        this.polyline.addLatLng(this.markers[i].getLatLng());
    }
    
    this.polyline.addTo(this.map);  
}

LeafletToolMap.prototype.removePolyLine = function() {
    if(this.polyline) {
        this.map.removeLayer(this.polyline);
        this.polyline = null;
    }
}

LeafletToolMap.prototype.addMarker = function(lat, lng, draggable) {
    var latlng = L.latLng(lat, lng);
    var marker = L.marker(latlng, {draggable: (draggable || false)})
    marker.addTo(this.map);
    
    if(draggable) {
        marker.on('drag', this.onMarkerDrag.bind(this))
    }
    this.markers.push(marker);
    return marker;
}

LeafletToolMap.prototype.clearOverlays = function() {
    this.removePolyLine();
    
    for(var i = this.markers.length - 1; i >=0; i--) {
        this.map.removeLayer(this.markers[i]);
    } 
    this.markers = [];
}

LeafletToolMap.prototype.onMarkerDrag = function() {
    var pos = this.markers[0].getLatLng();
    this.handlers.marker_drag(pos.lat, pos.lng);
}

LeafletToolMap.prototype.zoomEnable = function(enable) {    
    if(enable) {
        if(!this.zoom_control) {
            this.zoom_control = L.control.zoom();
            this.map.addControl(this.zoom_control);
            this.map.on('zoomend', this.zoom_listener);
        }  
    } else {
        if(this.zoom_control) {
            this.map.off('zoomend', this.zoom_listener);
            this.map.removeControl(this.zoom_control);
            this.zoom_control = null;
         }
    }
}

// Set center and zoom
LeafletToolMap.prototype.setView = function(lat, lng, zoom) {
    this.map.setView(L.latLng(lat, lng), zoom);
}



