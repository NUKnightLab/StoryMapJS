import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"

/*	Media.Website
================================================== */

export default class Website extends Media {
	
	_loadMedia() {
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-iframe", this._el.content);
		this.media_id = this.data.url;
		let iframe = `<iframe src="${this.media_id}" />`;
		this._el.content_item.innerHTML = iframe;
		this.onLoaded();
	}
	
	_updateMediaDisplay() {
		this._el.content_item.style.height = this.options.height + "px";
	}
	
}
