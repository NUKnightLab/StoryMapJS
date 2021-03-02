import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"
import { loadJS } from "../../core/Load"

/*	Media.SoundCloud
================================================== */

var soundCoudCreated = false;


export default class SoundCloud extends Media {

	/*	Load the media
	================================================== */
	_loadMedia() {
		var api_url,
			self = this;

		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);

		// Create Dom element
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-iframe vco-media-soundcloud vco-media-shadow", this._el.content);

		// Get Media ID
		this.media_id = this.data.url;

		// API URL
		api_url = "https://soundcloud.com/oembed?url=" + this.media_id + "&format=json";

		// API Call
        fetch(api_url).then(r => r.json().then(d => {
		    loadJS("https://w.soundcloud.com/player/api.js", function() {//load soundcloud api for pausing.
				self.createMedia(d);
			});
        }));

	}

	createMedia(d) {
		this._el.content_item.innerHTML = d.html;

		this.soundCloudCreated = true;

 		self.widget = SC.Widget(this._el.content_item.querySelector("iframe"));//create widget for api use

		// After Loaded
		this.onLoaded();

	}

	_stopMedia() {
        if (this.soundCloudCreated)
        {
            self.widget.pause();
        }
	}

}
