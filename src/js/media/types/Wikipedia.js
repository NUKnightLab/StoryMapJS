import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"
import { getObjectAttributeByIndex } from "../../core/Util"

/*	Media.Wikipedia
================================================== */

export default class Wikipedia extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		var api_url,
			api_language,
			self = this;
		
		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		
		// Create Dom element
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-wikipedia", this._el.content);
		
		// Get Media ID
		this.media_id	 = this.data.url.split("wiki\/")[1].split("#")[0].replace("_", " ");
		this.media_id	 = this.media_id.replace(" ", "%20");
		api_language	 = this.data.url.split("//")[1].split(".wikipedia")[0];

        let callbackPrefix = 'wikipediaCallback_';
        let maxIDLength = 512 - callbackPrefix.length;
        let callbackName = callbackPrefix + this.media_id.replace(/[^0-9a-z]/gi, '').slice(0, maxIDLength);
		api_url = `https://${api_language}.wikipedia.org/w/api.php?action=query&prop=extracts&redirects=&titles=${this.media_id}&exintro=1&format=json&callback=${callbackName}`;
        let callbackScript = document.createElement('script');
        window[callbackName] = function(data) {
            self.createMedia(data);
        };
        callbackScript.src = api_url;
        document.body.appendChild(callbackScript);
	}
	
	createMedia(d) {
		var wiki = "";
		
		if (d.query) {
			var content,
				wiki = {
					entry: {},
					title: "",
					text: "",
					extract: "",
					paragraphs: 1,
					text_array: []
				};
			
			wiki.entry		 = getObjectAttributeByIndex(d.query.pages, 0);
			wiki.extract	 = wiki.entry.extract;
			wiki.title		 = wiki.entry.title;
			
			if (wiki.extract.match("<p>")) {
				wiki.text_array = wiki.extract.split("<p>");
			} else {
				wiki.text_array.push(wiki.extract);
			}
			
			for(var i = 0; i < wiki.text_array.length; i++) {
				if (i+1 <= wiki.paragraphs && i+1 < wiki.text_array.length) {
					wiki.text	+= "<p>" + wiki.text_array[i+1];
				}
			}
			
			content		=	"<h4><a href='" + this.data.url + "' target='_blank'>" + wiki.title + "</a></h4>";
			content		+=	"<span class='wiki-source'>" + Language.messages.wikipedia + "</span>";
			content		+=	wiki.text;
			
			if (wiki.extract.match("REDIRECT")) {
			
			} else {
				// Add to DOM
				this._el.content_item.innerHTML	= content;
				// After Loaded
				this.onLoaded();
			}
			
			
		}
			
	}
	
	updateMediaDisplay() {
		
	}
	
	_updateMediaDisplay() {
		
	}
	
}
