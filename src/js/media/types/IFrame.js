import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"                              

/*	Media.IFrame
================================================== */

export default class IFrame extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		self = this;
		
		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		

        console.log('content:');
        console.log(this._el.content);

		// Create Dom element
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-iframe", this._el.content);
		
		// Get Media ID
		this.media_id = this.data.url;
		
		// API URL
		let iframe = this.media_id;

		// API Call
		this._el.content_item.innerHTML = iframe;
		
		// After Loaded
		this.onLoaded();
	}
	
	// Update Media Display
	_updateMediaDisplay() {
		this._el.content_item.style.height = this.options.height + "px";
	}
	
}
