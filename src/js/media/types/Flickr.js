import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"                              

/*	Media.Flickr

================================================== */

export default class Flickr extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
        console.log('load flickr');
		var api_url,
			self = this;
		
		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		
		// Create Dom element
		this._el.content_item	= Dom.create("img", "vco-media-item vco-media-image vco-media-flickr vco-media-shadow", this._el.content);
		
		// Media Loaded Event
		this._el.content_item.addEventListener('load', function(e) {
			self.onMediaLoaded();
		});
		
		// Get Media ID
		this.establishMediaID();
		
		// API URL
		api_url = "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=" + this.options.api_key_flickr + "&photo_id=" + this.media_id + "&format=json&jsoncallback=?";
		
		// API Call
		VCO.getJSON(api_url, function(d) {
			if (d.stat == "ok") {
				self.createMedia(d);
			} else {
				self.loadErrorDisplay("Photo not found or private.");
			}
		});
		
	}

	establishMediaID() {
		var marker = 'flickr.com/photos/';
		var idx = this.data.url.indexOf(marker);
		if (idx == -1) { throw "Invalid Flickr URL"; }
		var pos = idx + marker.length;
		this.media_id = this.data.url.substr(pos).split("/")[1];
	}
	
	createMedia(d) {
		var best_size 	= this.sizes(this.options.height),
			size 		= d.sizes.size[d.sizes.size.length - 2].source;
		
		for(var i = 0; i < d.sizes.size.length; i++) {
			if (d.sizes.size[i].label == best_size) {
				size = d.sizes.size[i].source;
			}
		}
		
		// Set Image Source
		this._el.content_item.src			= size;
		
		// After Loaded
		this.onLoaded();
	}
	
	sizes(s) {
		var _size = "";
		
		if (s <= 75) {
			if (s <= 0) {
				_size = "Large";
			} else {
				_size = "Thumbnail";
			}
		} else if (s <= 180) {
			_size = "Small";
		} else if (s <= 240) {
			_size = "Small 320";
		} else if (s <= 375) {
			_size = "Medium";
		} else if (s <= 480) {
			_size = "Medium 640";
		} else if (s <= 600) {
			_size = "Large";
		} else {
			_size = "Large";
		}
		
		return _size;
	}
	
}
