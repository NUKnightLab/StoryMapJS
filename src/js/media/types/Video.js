import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"
import { Browser } from "../../core/Browser"

export default class Video extends Media {

    /*	Load the media
    ================================================== */
    _loadMedia() {
        var self = this,
            video_class = "tl-media-item tl-media-video tl-media-shadow";

        // Link
        this._el.content_item = Dom.create("video", video_class, this._el.content);

        this._el.content_item.controls = true;
        this._el.source_item = Dom.create("source", "", this._el.content_item);

        // Media Loaded Event
        this._el.content_item.addEventListener('load', function(e) {
            self.onMediaLoaded();
        });

        this._el.source_item.src = this.data.url;
        this._el.source_item.type = this._getType(this.data.url, this.data.mediatype.match_str);
        this._el.content_item.innerHTML += "Your browser doesn't support HTML5 video with " + this._el.source_item.type;
        this.player_element = this._el.content_item

        this.onLoaded();
    }

    _updateMediaDisplay(layout) {

        if (Browser.firefox) {
            //this._el.content_item.style.maxWidth = (this.options.width/2) - 40 + "px";
            this._el.content_item.style.width = "auto";
        }
    }

    _stopMedia() {
        if (this.player_element) {
            this.player_element.pause()
        }
    }

    _getType(url, reg) {
        var ext = url.match(reg);
        var type = "video/"
        switch (ext[1]) {
            case "mp4":
                type += "mp4";
                break;
            case "webm":
                type += "webm";
                break;
            default:
                type = "video";
                break;
        }
        return type
    }

}