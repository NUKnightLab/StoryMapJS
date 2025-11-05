import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"

/*	Media.Vimeo
================================================== */

export default class Audio extends Media {

	/*	Load the media
	================================================== */
	_loadMedia() {
		var api_url,
			self = this;

		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);

		// Create Dom element
		this._el.content_item	= Dom.create("audio", "vco-media-item vco-media-audio vco-media-shadow", this._el.content);
		this._el.content_item.controls = true;
		this._el.source_item = Dom.create("source", "", this._el.content_item);


		// Media Loaded Event
		this._el.content_item.addEventListener('canplay', function (e) {
			console.log('load event', e)
			self.onLoaded();
		});

		this._el.source_item.src = this.data.url;
		this._el.source_item.type = this._getType(this.data.url, this.data.mediatype.match_str);
		this._el.content_item.innerHTML += "Your browser doesn't support HTML5 video with " + this._el.source_item.type;
		this.player_element = this._el.content_item
	}

	// Update Media Display
	_updateMediaDisplay() {
		// left over from Vimeo...
		// this._el.content_item.style.height = ratio.r16_9({w:this._el.content_item.offsetWidth}) + "px";
	}

	_stopMedia() {
		if (this.player_element) {
			this.player_element.pause()
		}
	}

	_getType(url, reg) {
		var ext = url.match(reg);
		var type = "audio/"
		switch (ext[1]) {
			case "mp3":
				type += "mpeg";
				break;
			case "wav":
				type += "wav";
				break;
			case "m4a":
				type += "mp4";
				break;
			default:
				type = "audio";
				break;
		}
		return type
	}

}
