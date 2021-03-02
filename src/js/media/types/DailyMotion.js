import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"                              
import { ratio } from "../../core/Util"

/*	Media.DailyMotion
================================================== */

export default class DailyMotion extends Media {

	/*	Load the media
	================================================== */
	_loadMedia() {
		var api_url,
			self = this;

		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);

		// Create Dom element
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-iframe vco-media-dailymotion", this._el.content);

		// Get Media ID
		if (this.data.url.match("video")) {
			this.media_id = this.data.url.split("video\/")[1].split(/[?&]/)[0];
		} else {
			this.media_id = this.data.url.split("embed\/")[1].split(/[?&]/)[0];
		}

		// API URL
		api_url = "https://www.dailymotion.com/embed/video/" + this.media_id+"?api=postMessage";

		// API Call
		this._el.content_item.innerHTML = "<iframe autostart='false' frameborder='0' width='100%' height='100%' src='" + api_url + "'></iframe>"

		// After Loaded
		this.onLoaded();
	}

	// Update Media Display
	_updateMediaDisplay() {
		this._el.content_item.style.height = ratio.r16_9({w:this._el.content_item.offsetWidth}) + "px";
	}

	_stopMedia() {
		this._el.content_item.querySelector("iframe").contentWindow.postMessage('{"command":"pause","parameters":[]}', "*");
	}

}
