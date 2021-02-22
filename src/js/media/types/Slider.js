import { Media } from "../Media"
import Dom from "../../dom/Dom"

/*	Media.SLider
	Produces a Slider
	Takes a data object and populates a dom object
	TODO
	Placeholder
================================================== */

export default class Slider extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		
		this._el.content_item				= Dom.create("img", "vco-media-item vco-media-image", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
}
