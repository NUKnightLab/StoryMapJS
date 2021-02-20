require('../less/VCO.StoryMap.less')
export { StoryMap } from "./storymap/StoryMap"
export { loadCSS } from "./core/Load"

/* Used by the editor: */
import StamenTileLayer from "./map/tile/TileLayer.Stamen"
export { StamenTileLayer }
import MediaType from "./media/MediaType"
export { MediaType }

export { setLanguage } from "./language/Language"

import ZoomifyTileLayer from "./map/leaflet/extensions/Leaflet.TileLayer.Zoomify"
export { ZoomifyTileLayer }
