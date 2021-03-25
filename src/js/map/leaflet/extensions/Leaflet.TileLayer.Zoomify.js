import { LeafletModule } from "leaflet";
/*
 * L.TileLayer.Zoomify display Zoomify tiles with Leaflet
 * Modified from https://github.com/turban/Leaflet.Zoomify
 */

let defaultZoomifyOptions = {
    continuousWorld: true,
    tolerance: 0.8
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;

export default class ZoomifyTileLayer extends L.TileLayer {

	constructor(url, options=defaultZoomifyOptions) {
        super(url, options);
		options = L.setOptions(this, options);
		this._url = url;

        if (!options.width) { options.width = DEFAULT_WIDTH; }
        if (!options.height) { options.width = DEFAULT_HEIGHT; }

  	    var imageSize = L.point(options.width, options.height),
    	    tileSize = options.tileSize;

		this._imageSize = [imageSize];
		this._gridSize = [this._getGridSize(imageSize)];

        while (imageSize.x > tileSize || imageSize.y > tileSize) {
    	    imageSize = imageSize.divideBy(2).floor();
    	    this._imageSize.push(imageSize);
    	    this._gridSize.push(this._getGridSize(imageSize));
        }
    
		this._imageSize.reverse();
		this._gridSize.reverse();

        this.options.maxZoom = this._gridSize.length - 1;
	}

	onAdd(map) {
		L.TileLayer.prototype.onAdd.call(this, map);
		var mapSize = map.getSize(),
			zoom = this._getBestFitZoom(mapSize),
			imageSize = this._imageSize[zoom];
        var x = imageSize.x ? imageSize.x : 0;
        var y = imageSize.y ? imageSize.y : 0;
	  	var center = map.options.crs.pointToLatLng(L.point(x / 2, y / 2), zoom);
	}

	getZoomifyBounds(map) {
		var imageSize 	= this._imageSize[0],
			topleft 	= map.options.crs.pointToLatLng(L.point(0, 0), 0),
		    bottomright = map.options.crs.pointToLatLng(L.point(imageSize.x, imageSize.y), 0),
		    bounds 		= L.latLngBounds(topleft, bottomright);
		return bounds;
	}

	getCenterZoom(map) {
		var mapSize = map.getSize(),
			zoom = this._getBestFitZoom(mapSize),
			imageSize = this._imageSize[zoom];
        var x = imageSize.x ? imageSize.x : 0;
        var y = imageSize.y ? imageSize.y : 0;
	    var center = map.options.crs.pointToLatLng(L.point(x / 2, y / 2), zoom);

		return {
			center: center,
			lat: 	center.lat,
			lon: 	center.lng,
			zoom: 	zoom
		};
	}

	_getGridSize(imageSize) {
		var tileSize = this.options.tileSize;
        var x = imageSize.x ? imageSize.x : 0;
        var y = imageSize.y ? imageSize.y : 0;
		return L.point(Math.ceil(x / tileSize), Math.ceil(y / tileSize));
	}

	_getBestFitZoom(mapSize) {
		var tolerance = this.options.tolerance,
			zoom = this._imageSize.length - 1,
			imageSize, zoom;

		while (zoom) {
			imageSize = this._imageSize[zoom];
			if (imageSize.x * tolerance < mapSize.x && imageSize.y * tolerance < mapSize.y) {
				return zoom;
			}
			zoom--;
		}

		return zoom;
	}

	_tileShouldBeLoaded(tilePoint) {
		var gridSize = this._gridSize[this._map.getZoom()];
		if (gridSize) {
			return (tilePoint.x >= 0 && tilePoint.x < gridSize.x && tilePoint.y >= 0 && tilePoint.y < gridSize.y);
		} else {
			console.log("_tileShouldBeLoaded: No gridSize for " + this._map.getZoom());
			return false;
		}
	}

	_addTile(tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint),
			tile = this._getTile(),
			zoom = this._map.getZoom(),
			imageSize = this._imageSize[zoom],
			gridSize = this._gridSize[zoom],
			tileSize = this.options.tileSize;

		if (tilePoint.x === gridSize.x - 1) {
			tile.style.width = imageSize.x - (tileSize * (gridSize.x - 1)) + 'px';
		}

		if (tilePoint.y === gridSize.y - 1) {
			tile.style.height = imageSize.y - (tileSize * (gridSize.y - 1)) + 'px';
		}

		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

		this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
		this._loadTile(tile, tilePoint);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	}

	getTileUrl(tilePoint) {
		return this._url + 'TileGroup' + this._getTileGroup(tilePoint) + '/' + this._map.getZoom() + '-' + tilePoint.x + '-' + tilePoint.y + '.jpg';
	}
	_getTileGroup(tilePoint) {
		var zoom = this._map.getZoom(),
			num = 0,
			gridSize;
		for (let z = 0; z < zoom; z++) {
			gridSize = this._gridSize[z];
			num += gridSize.x * gridSize.y;
		}
		num += tilePoint.y * this._gridSize[zoom].x + tilePoint.x;
      	return Math.floor(num / 256);;
	}
}
