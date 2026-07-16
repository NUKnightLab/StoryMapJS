import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"
import { sanitizeBlockquote } from "../EmbedUtil"


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

		// The url field holds user-pasted blockquote markup. Sanitize it
		// instead of injecting the raw markup, which would allow stored
		// XSS via the storymap JSON.
		this._el.content_item.appendChild(sanitizeBlockquote(this.media_id));

		// After Loaded
		this.onLoaded();
	}
	
	updateMediaDisplay() {
		
	}
	
	_updateMediaDisplay() {
		
	}
	
}
