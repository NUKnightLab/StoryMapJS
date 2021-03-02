/*	TyleLayer.Stamen
	Makes Stamen Map tiles available
	http://maps.stamen.com/
================================================== */
import { LeafletModule } from "leaflet";
import { mergeData } from "../../core/Util"


/*	tile.stamen.js v1.2.3
================================================== */

let SUBDOMAINS = "a b c d".split(" ");
function MAKE_PROVIDER(layer, type, minZoom, maxZoom) {
    return {
        "url":          ["//stamen-tiles-{S}.a.ssl.fastly.net/", layer, "/{Z}/{X}/{Y}.", type].join(""),
        "type":         type,
        "subdomains":   SUBDOMAINS.slice(),
        "minZoom":      minZoom,
        "maxZoom":      maxZoom,
        "attribution":  [
            "<a href='http://leafletjs.com' title='A JS library for interactive maps'>Leaflet</a> | ",
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ',
            'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ',
            'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ',
            'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        ].join("")
    };
}

let PROVIDERS =  {
    "toner":        MAKE_PROVIDER("toner", "png", 0, 20),
    "terrain":      MAKE_PROVIDER("terrain", "jpg", 4, 18),
    "watercolor":   MAKE_PROVIDER("watercolor", "jpg", 1, 16),
    "trees-cabs-crime": {
        "url": "http://{S}.tiles.mapbox.com/v3/stamen.trees-cabs-crime/{Z}/{X}/{Y}.png",
        "type": "png",
        "subdomains": "a b c d".split(" "),
        "minZoom": 11,
        "maxZoom": 18,
        "extent": [
            {"lat": 37.853, "lon": -122.577},
            {"lat": 37.684, "lon": -122.313}
        ],
        "attribution": [
            'Design by Shawn Allen at <a href="http://stamen.com">Stamen</a>.',
            'Data courtesy of <a href="http://fuf.net">FuF</a>,',
            '<a href="http://www.yellowcabsf.com">Yellow Cab</a>',
            '&amp; <a href="http://sf-police.org">SFPD</a>.'
        ].join(" ")
    }
};

	// set up toner and terrain flavors
	setupFlavors("toner", ["hybrid", "labels", "lines", "background", "lite"]);
	// toner 2010
	setupFlavors("toner", ["2010"]);
	// toner 2011 flavors
	setupFlavors("toner", ["2011", "2011-lines", "2011-labels", "2011-lite"]);
	setupFlavors("terrain", ["background"]);
	setupFlavors("terrain", ["labels", "lines"], "png");


	/*	Export stamen.tile to the provided namespace.
	================================================== */
	//exports.stamen = exports.stamen || {};
	//exports.stamen.tile = exports.stamen.tile || {};
	//exports.stamen.tile.providers = PROVIDERS;
	//exports.stamen.tile.getProvider = getProvider;


/*	A shortcut for specifying "flavors" of a style, which are assumed to have the
    same type and zoom range.
================================================== */
function setupFlavors(base, flavors, type) {
    var provider = getProvider(base);
    for (var i = 0; i < flavors.length; i++) {
        var flavor = [base, flavors[i]].join("-");
        PROVIDERS[flavor] = MAKE_PROVIDER(flavor, type || provider.type, provider.minZoom, provider.maxZoom);
    }
}

/*	Get the named provider, or throw an exception
    if it doesn't exist.
================================================== */
function getProvider(name) {
    if (name in PROVIDERS) {
        return PROVIDERS[name];
    } else {
        throw 'No such provider (' + name + ')';
    }
}



export default class StamenTileLayer extends L.TileLayer {

    constructor(name, options) {
       super(name, options);
        var provider = getProvider(name),
            url = provider.url.replace(/({[A-Z]})/g, function(s) {
                return s.toLowerCase();
            }),
            _options = {
                minZoom: 		provider.minZoom,
                maxZoom: 		provider.maxZoom,
                subdomains: 	provider.subdomains,
                scheme: 		"xyz",
                attribution: 	provider.attribution
            };

        if (options) {
            mergeData(_options, options);
        }

        L.TileLayer.prototype.initialize.call(this, url, _options);
    }
}
