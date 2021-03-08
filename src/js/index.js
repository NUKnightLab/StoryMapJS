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

/* Transitional references deprecated as of 0.7.7 */
function trace(msg) {
    console.log(msg);
}
window.trace = trace;


function getJSON(url, onload) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                let data = JSON.parse(httpRequest.responseText);
                onload(data);
            } else {
                alert('There was a problem with the request.');
            }
        }
    };
    httpRequest.open('GET', url);
    httpRequest.send();
}

import { loadCSS } from "./core/Load"
import { StoryMap } from "./storymap/StoryMap"

const VCO = {
    Load: {
        css: loadCSS
    },
    getJSON: getJSON,
    StoryMap: StoryMap
}
window.VCO = VCO;
