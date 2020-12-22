import { Media } from "../Media"
import Dom from "../../dom/Dom"
/*	VCO.Media.Image
	Produces image assets.
	Takes a data object and populates a dom object
================================================== */

export default class Image extends Media {
	
	//includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		var self = this;
		// Loading Message
		this.message.updateMessage(VCO.Language.messages.loading + " " + this.options.media_name);
		
		// Link
		if (this.data.link) {
			this._el.content_link 				= VCO.Dom.create("a", "", this._el.content);
			this._el.content_link.href 			= this.data.link;
			this._el.content_link.target 		= "_blank";
			this._el.content_item				= VCO.Dom.create("img", "vco-media-item vco-media-image vco-media-shadow", this._el.content_link);
		} else {
			this._el.content_item				= VCO.Dom.create("img", "vco-media-item vco-media-image vco-media-shadow", this._el.content);
		}
		
		// Media Loaded Event
		this._el.content_item.addEventListener('load', function(e) {
			self.onMediaLoaded();
		});
		
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
	_updateMediaDisplay(layout) {
		
		if(VCO.Browser.firefox) { 
			//this._el.content_item.style.maxWidth = (this.options.width/2) - 40 + "px";
			this._el.content_item.style.width = "auto";
		}
	}
	
}
