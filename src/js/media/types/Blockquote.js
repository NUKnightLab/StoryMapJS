import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"                              


/*	Media.Blockquote
================================================== */

export default class Blockquote extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		
		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		
		// Create Dom element
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-blockquote", this._el.content);
		
		// Get Media ID
		this.media_id = this.data.url;
		
		// API Call
		this._el.content_item.innerHTML = this.media_id;
		
		// After Loaded
		this.onLoaded();
	}
	
	updateMediaDisplay() {
		
	}
	
	_updateMediaDisplay() {
		
	}
	
}
