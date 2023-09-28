/*	TyleLayer.Stamen
	Makes Stamen Map tiles available
	http://maps.stamen.com/
    Stamen tiles will no longer be free (2023)
    see http://maps.stamen.com/stadia-partnership/
================================================== */
import { mergeData } from "../../core/Util"


/*	tile.stamen.js v1.2.3
================================================== */
function MAKE_PROVIDER(layer, type, minZoom, maxZoom) {
    layer = layer.replace('-','_') // stadia has a different pattern than stamen
    return {
        "url": ["https://tiles.stadiamaps.com/tiles/", layer, "/{Z}/{X}/{Y}.", type].join(""),
        "type":         type,
        "subdomains":   '',
        "minZoom":      minZoom,
        "maxZoom":      maxZoom,
        "attribution":  [
            "<a href='http://leafletjs.com' title='A JS library for interactive maps'>Leaflet</a> | ",
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, served by ',
            '<a href="https://stadiamaps.com/">Stadia</a> ',
            'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ',
            'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ',
            'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        ].join("")
    };
}

let PROVIDERS =  {
    "toner":        MAKE_PROVIDER("stamen_toner", "png", 0, 20),
    "terrain":      MAKE_PROVIDER("stamen_terrain", "jpg", 4, 18),
    "watercolor": MAKE_PROVIDER("stamen_watercolor", "jpg", 0, 16),
    "ch_watercolor": {
        "url": "https://watercolormaps.collection.cooperhewitt.org/tile/watercolor//{Z}/{X}/{Y}.png",
        "type": 'png',
        "subdomains": '',
        "minZoom": 0,
        "maxZoom": 16,
        "attribution": [
            "<a href='http://leafletjs.com' title='A JS library for interactive maps'>Leaflet</a> | ",
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, served by ',
            '<a href="https://watercolormaps.collection.cooperhewitt.org/">Cooper Hewitt, Smithsonian Design Museum</a> ',
            'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ',
            'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ',
            'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
        ].join("")
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
        PROVIDERS[flavor] = MAKE_PROVIDER(`stamen_${flavor}`, type || provider.type, provider.minZoom, provider.maxZoom);
    }
}

/*	Get the named provider, or throw an exception
    if it doesn't exist.
================================================== */
function getProvider(name) {

    if (name == "trees-cabs-crime") {
        console.log("trees-cabs-crime is not available. Using toner instead")
        name = 'toner'
    }

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
