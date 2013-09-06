/*	VCO.Media.GoogleDoc

================================================== */

VCO.Media.GoogleDoc = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	loadMedia: function() {
		var api_url,
			self = this;
		
		// Loading Messege
		this.messege.updateMessege(VCO.Language.messeges.loading + " Google Doc");
		
		// Create Dom element
		this._el.content_item	= VCO.Dom.create("div", "vco-media-item vco-media-iframe", this._el.content);
		
		// Get Media ID
		this.media_id = this.data.url;
		
		// API URL
		api_url = this.media_id;
		
		// API Call
		this._el.content_item.innerHTML = "<iframe frameborder='0' width='100%' height='100%' src='" + api_url + "'></iframe>"		
		
		/*
		var mediaElem = ""; 
		if (m.id.match(/docs.google.com/i)) {
			mediaElem	=	"<iframe class='doc' frameborder='0' width='100%' height='100%' src='" + m.id + "&amp;embedded=true'></iframe>";
		} else {
			mediaElem	=	"<iframe class='doc' frameborder='0' width='100%' height='100%' src='" + "http://docs.google.com/viewer?url=" + m.id + "&amp;embedded=true'></iframe>";
		}
		VMM.attachElement("#"+m.uid, mediaElem);
		*/
		
		// After Loaded
		this.onLoaded();
	},
	
	// Update Media Display
	_updateMediaDisplay: function() {
		this._el.content_item.style.height = this.options.height + "px";
	}

	
});
