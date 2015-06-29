// EditorMap.js
//
// Requires: Google Maps, Leaflet, jquery
//

/*   
OSMMapType for Google Maps API V3
<https://developers.google.com/maps/documentation/javascript/>
This code shadoes code in VCO.Map.Leaflet.js -- keep them in sync or unify into a single source file.
*/
if (typeof(google) != "undefined" && google.maps) {
    google.maps.OSMMapType = function() {
        var map_url = 'https://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png';
        var subdomains = 'ab';
        return google.maps.ImageMapType.call(this, {
            "getTileUrl": function(coord, zoom) {
                var numTiles = 1 << zoom,
                    wx = coord.x % numTiles,
                    x = (wx < 0) ? wx + numTiles : wx,
                    y = coord.y,
                    index = (zoom + x + y) % subdomains.length;
                return map_url
                    .replace("{S}", subdomains[index])
                    .replace("{Z}", zoom)
                    .replace("{X}", x)
                    .replace("{Y}", y);
            },
            "tileSize": new google.maps.Size(256, 256),
            "name":     'OpenStreetMap Standard',
            "minZoom":  0,
            "maxZoom":  19
        });
    }
    google.maps.OSMMapType.prototype = new google.maps.ImageMapType("_");
}

function EditorMap(options) {
    this.name = "";
    this.map = null;       
    this.markers = [];
    this.markerBounds = this.LatLngBounds();
    
    this.zoom_listener = null;
    
    // Default options
    this.options = {
        map_id: options.map_id || 'map',
        map_overlay_id: options.map_overlay_id || 'map_overlay',
        search_id: options.search_id || 'map_search_input',
        handlers: {
            zoom: options.handlers.zoom || function(zoom) {},
            double_click: options.handlers.double_click || function(lat, lng) {},
            marker_drag: options.handlers.marker_drag || function(lat, lng) {},
            search: options.handlers.search || function(lat, lng) {}
        }
    };        
    
    // Shortcut
    this.handlers = this.options.handlers;
}

EditorMap.prototype.onZoom = function() {
    this.handlers.zoom(this.map.getZoom());
}

EditorMap.prototype.getZoom = function() {
    return this.map.getZoom();
}

EditorMap.prototype.setZoom = function(zoom) {
    this.map.setZoom(zoom);
}

EditorMap.prototype.panTo = function(lat, lng) {
    this.map.panTo(this.LatLng(lat, lng));
}

EditorMap.prototype.fitBounds = function(latlngbounds) {
    this.map.fitBounds(latlngbounds);
}

// ------------------------------------------------------------
// Google Maps
// ------------------------------------------------------------

function GoogleEditorMap(options) {
    var self = this;
    
    EditorMap.apply(this, Array.prototype.slice.call(arguments));
    
    this.name = "google";
    this.overlay = null;
     
    this.map = new google.maps.Map(document.getElementById(this.options.map_id), {
        disableDoubleClickZoom: true,
        mapTypeControl: false,
        panControl: false,
        scrollwheel: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT
        },
        mapTypeId: "stamen:toner-lite"
    });
    
    // Preset map types
    this.map.mapTypes.set("stamen:toner-lite", new google.maps.StamenMapType("toner-lite"))
    this.map.mapTypes.set("stamen:toner", new google.maps.StamenMapType("toner"))
    this.map.mapTypes.set("stamen:toner-lines", new google.maps.StamenMapType("toner-lines"))
    this.map.mapTypes.set("stamen:toner-labels", new google.maps.StamenMapType("toner-labels"))
    this.map.mapTypes.set("stamen:toner-background", new google.maps.StamenMapType("toner-background"))
    this.map.mapTypes.set("stamen:terrain", new google.maps.StamenMapType("terrain"))
    this.map.mapTypes.set("stamen:watercolor", new google.maps.StamenMapType("watercolor"))
    this.map.mapTypes.set("osm:standard",new google.maps.OSMMapType());
   
    google.maps.event.addListener(this.map, 'dblclick', function(e) {
        self.handlers.double_click(e.latLng.lat(), e.latLng.lng());
    });
    
    // Search box?
    if(this.options.search_id) {
        var search_box = new google.maps.places.SearchBox(
            document.getElementById(this.options.search_id));
            
        google.maps.event.addListener(search_box, 'places_changed', function() {
            var places = search_box.getPlaces();   
            if(places.length) {
                var location = places[0].geometry.location;
                self.handlers.search(location.lat(), location.lng());        
             } 
        });
    }
}

GoogleEditorMap.prototype = Object.create(EditorMap.prototype);

GoogleEditorMap.prototype.LatLng = function(lat, lng) {
    return new google.maps.LatLng(lat, lng);
}

GoogleEditorMap.prototype.LatLngBounds = function() {
    return new google.maps.LatLngBounds();
}

GoogleEditorMap.prototype.addPolyLine = function() {
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
        var map_div = document.getElementById(that.options.map_id);
        
        div.style.left = '0px';
        div.style.top = '0px';
        //div.style.width = $(that.map.getDiv()).width()+'px';
        //div.style.height = $(that.map.getDiv()).height()+'px';
        div.style.width = map_div.offsetWidth+'px';
        div.style.height = map_div.offsetHeight+'px';
         
        var overlayProjection = this.getProjection();
 
        var points = [];   
        for(var i = 0; i < that.markers.length; i++) {
            var pixel = overlayProjection.fromLatLngToContainerPixel(that.markers[i].getPosition());
            points.push(pixel.x+','+pixel.y);
        }       
        $('#'+that.options.map_overlay_id+' polyline').attr('points', points.join(' '));
        
        /*
        var elem = document.getElementById(that.options.map_overlay_id);
        var poly = elem.getElementsByTagName("polyline")[0];
        */
    };

    this.overlay.onRemove = function() {
        div.parentNode.removeChild(div);
        div = null;
        $('#'+that.options.map_overlay_id+' polyline').attr('points', '');
    };
    
    this.overlay.setMap(this.map);
}

GoogleEditorMap.prototype.removePolyLine = function() {
    if(this.overlay) {
        this.overlay.setMap(null);
        this.overlay = null;
    }
}

GoogleEditorMap.prototype.addMarker = function(lat, lng, draggable) {
    var latlng = new google.maps.LatLng(lat, lng);
    var marker = new google.maps.Marker({
        map: this.map,
        draggable: true,    // always true for display purposes
        position: latlng
    });
    
    if(draggable) {
        google.maps.event.addListener(marker, 'dragend', this.onMarkerDrag.bind(this)); 
    }  
     
    this.markers.push(marker);
    this.markerBounds.extend(latlng); 
    return marker;
}

GoogleEditorMap.prototype.removeMarker = function(i) {
    // Remove marker
    var removed = this.markers.splice(i, 1);
    removed[0].setMap(null);
    
    // Update markerBounds
    this.markerBounds = this.LatLngBounds();
    for(var i = 0; i < this.markers.length; i++) {
        this.markerBounds.extend(this.markers[i].getPosition());
    }
    
    // Update polyline
    if(this.overlay) {
        this.overlay.draw();
    }
}

GoogleEditorMap.prototype.clearOverlays = function() {
    this.removePolyLine();
    
    for(var i = this.markers.length - 1; i >=0; i--) {
        this.markers[i].setMap(null);
    } 
    this.markers = [];
    this.markerBounds = this.LatLngBounds();
}

GoogleEditorMap.prototype.onMarkerDrag = function() {
    var pos = this.markers[0].getPosition();
    this.handlers.marker_drag(pos.lat(), pos.lng());
}

GoogleEditorMap.prototype.zoomEnable = function(enable) {
    if(enable) {
        if(!this.zoom_listener) {
            this.zoom_listener = google.maps.event.addListener(
                this.map, 'zoom_changed', this.onZoom.bind(this)
            );
        }
        this.map.setOptions({zoomControl: true});
    } else {
        if(this.zoom_listener) {
            google.maps.event.removeListener(this.zoom_listener);
            this.zoom_listener = null;
        }
        this.map.setOptions({zoomControl: false});
    }
}

// Set center and zoom
GoogleEditorMap.prototype.setView = function(lat, lng, zoom) {
    this.panTo(lat, lng);
    if(zoom) {
        this.setZoom(zoom);
    }
}

// Default view (bound all markers)
GoogleEditorMap.prototype.setDefaultView = function() {
    if(this.markers.length) {
        this.map.fitBounds(this.markerBounds);
    } else {
        /* OLD CODE
        this.map.fitBounds(this.LatLngBounds(
            this.LatLng(24.0, -124.47), this.LatLng(49.3843, -55.56)
        ));
        */
        this.setView(0, 0, 1);
    }
}

GoogleEditorMap.prototype.getDefaultView = function() {
    return {lat: 0, lng: 0, zoom: 1};
}

GoogleEditorMap.prototype.setMapType = function(map_type, map_subdomains, map_access_token) {     
    if(map_type && map_type.match('^(http|https|//)')) {
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
        this.map.setOptions({mapTypeId: 'custom'}); 
    } else if(map_type && map_type.match('^mapbox:.+')) {
        mapbox_name = map_type.split(':')[1];
        mapbox_access_token = map_access_token || 'pk.eyJ1IjoibnVrbmlnaHRsYWIiLCJhIjoiczFmd0hPZyJ9.Y_afrZdAjo3u8sz_r8m2Yw';
               
        this.map.mapTypes.set("mapbox", new google.maps.ImageMapType({
            getTileUrl: function(coord, zoom) {
                var index = (coord.x + coord.y) % map_subdomains.length;                        
                return ('https://api.tiles.mapbox.com/v4/'+mapbox_name+'/{z}/{x}/{y}.png?access_token='+mapbox_access_token)
                    .replace('{s}', map_subdomains[index])
                    .replace('{z}', zoom)
                    .replace('{x}', coord.x)
                    .replace('{y}', coord.y);
            },
            tileSize: new google.maps.Size(256, 256),
            name: "Mapbox",
            maxZoom: 18
        }));  
        this.map.setOptions({mapTypeId: 'mapbox'});               
    } else {
        switch(map_type) {
            case "stamen:toner-lite":
            case "stamen:toner":
            case "stamen:toner-lines":
            case "stamen:toner-labels":
            case "stamen:toner-background":
            case "stamen:watercolor":
            case "stamen:terrain":
            case "osm:standard":
                this.map.setOptions({mapTypeId: map_type});
                break;    
            
            default:
                this.map.setOptions({mapTypeId: "stamen:toner-lite"});
                break;
        }
    }
}

// ------------------------------------------------------------
// Leaflet
// ------------------------------------------------------------

function LeafletEditorMap(options) {
    var self = this;
        
    EditorMap.apply(this, Array.prototype.slice.call(arguments));

    this.name = "leaflet";
    this.tilelayer = null;
    
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

LeafletEditorMap.prototype = Object.create(EditorMap.prototype);

LeafletEditorMap.prototype.LatLng = function(lat, lng) {
    return L.latLng(lat, lng);
}

LeafletEditorMap.prototype.LatLngBounds = function() {
    return L.latLngBounds([]);
}

LeafletEditorMap.prototype.addPolyLine = function() {
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

LeafletEditorMap.prototype.removePolyLine = function() {
    if(this.polyline) {
        this.map.removeLayer(this.polyline);
        this.polyline = null;
    }
}

LeafletEditorMap.prototype.addMarker = function(lat, lng, draggable) {
    var latlng = L.latLng(lat, lng);
    var marker = L.marker(latlng, {draggable: (draggable || false)})
    marker.addTo(this.map);
    
    if(draggable) {
        marker.on('drag', this.onMarkerDrag.bind(this))
    }
    
    this.markers.push(marker);
    this.markerBounds.extend(latlng); 
    return marker;
}

LeafletEditorMap.prototype.removeMarker = function(i) {
    // Remove marker
    var removed = this.markers.splice(i, 1);
    this.map.removeLayer(removed[0]);
   
    // Update marker bounds
    this.markerBounds = this.LatLngBounds();
    for(var i = 0; i < this.markers.length; i++) {
        this.markerBounds.extend(this.markers[i].getLatLng());
    }
   
    // Update polyline
    if(this.polyline) {
        // Doesn't redraw properly when manipulating points via polyline object,
        // even with explicit call to redraw.  So, remove and recreate.
        this.removePolyLine();
        this.addPolyLine();
    }
}


LeafletEditorMap.prototype.clearOverlays = function() {
    this.removePolyLine();
    
    for(var i = this.markers.length - 1; i >=0; i--) {
        this.map.removeLayer(this.markers[i]);
    } 
    this.markers = [];
    this.markerBounds = this.LatLngBounds();
}

LeafletEditorMap.prototype.onMarkerDrag = function() {
    var pos = this.markers[0].getLatLng();
    this.handlers.marker_drag(pos.lat, pos.lng);
}

LeafletEditorMap.prototype.zoomEnable = function(enable) {    
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
LeafletEditorMap.prototype.setView = function(lat, lng, zoom) {
    // Need to use reset option, else map doesn't update properly  
    if(zoom) { 
        this.map.setView(L.latLng(lat, lng), zoom, {reset: true});
    } else {
        this.map.setView(L.latLng(lat, lng), {reset: true});
    }
}

// Default view (center zoom)
LeafletEditorMap.prototype.setDefaultView = function() {
    var d = this.tilelayer.getCenterZoom(this.map)
    // Need to use reset option, else map doesn't update properly   
    this.map.setView(L.latLng(d.lat, d.lon), d.zoom, {reset: true});
}

LeafletEditorMap.prototype.getDefaultView = function() {
    var d = this.tilelayer.getCenterZoom(this.map)
    return {lat: d.lat, lng: d.lon, zoom: d.zoom};
}

LeafletEditorMap.prototype.setMapType = function(map_type, zoomify_data) {  
    if(this.tilelayer) {
        this.map.removeLayer(this.tilelayer);
        this.tilelayer = null;
    }
    
    this.tilelayer = L.tileLayer.zoomify(
        zoomify_data.path, 
        zoomify_data
    );
    this.tilelayer.addTo(this.map);    
}  


