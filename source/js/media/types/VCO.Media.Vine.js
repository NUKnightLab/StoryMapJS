/*	VCO.Media.Vine

================================================== */

VCO.Media.Vine = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	loadMedia: function() {
		var api_url,
			self = this;
		
		// Loading Messege
		this.messege.updateMessege(VCO.Language.messeges.loading + " SoundCloud");
		
		// Create Dom element
		this._el.content_item	= VCO.Dom.create("div", "vco-media-item vco-media-iframe vco-media-vine", this._el.content);
		
		// Get Media ID
		this.media_id = this.data.url.split("vine.co/v/")[1];
		
		// API URL
		api_url = "https://vine.co/v/" + this.media_id + "/embed/simple";
		
		// API Call
		this._el.content_item.innerHTML = "<iframe frameborder='0' width='100%' height='100%' src='" + api_url + "'></iframe><script async src='http://platform.vine.co/static/scripts/embed.js' charset='utf-8'></script>"		
		
		// After Loaded
		this.onLoaded();
	},
	
	// Update Media Display
	_updateMediaDisplay: function() {
		this._el.content_item.style.height = this.options.height + "px";
	}
	
});
