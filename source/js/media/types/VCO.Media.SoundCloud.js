/*	VCO.Media.SoundCloud
================================================== */

var soundCoudCreated = false;


VCO.Media.SoundCloud = VCO.Media.extend({

	includes: [VCO.Events],

	/*	Load the media
	================================================== */
	_loadMedia: function() {
		var api_url,
			self = this;

		// Loading Message
		this.message.updateMessage(VCO.Language.messages.loading + " " + this.options.media_name);

		// Create Dom element
		this._el.content_item	= VCO.Dom.create("div", "vco-media-item vco-media-iframe vco-media-soundcloud vco-media-shadow", this._el.content);

		// Get Media ID
		this.media_id = this.data.url;

		// API URL
		api_url = "https://soundcloud.com/oembed?url=" + this.media_id + "&format=js&callback=?"

		// API Call
		VCO.getJSON(api_url, function(d) {
			VCO.Load.js("https://w.soundcloud.com/player/api.js", function() {//load soundcloud api for pausing.
 				self.createMedia(d);
 			});
		});

	},

	createMedia: function(d) {
		this._el.content_item.innerHTML = d.html;

		this.soundCloudCreated = true;

 		self.widget = SC.Widget(this._el.content_item.querySelector("iframe"));//create widget for api use

		// After Loaded
		this.onLoaded();

	},

	 	_stopMedia: function() {
	 		if (this.soundCloudCreated)
	 		{
	 			self.widget.pause();
	 		}

	}

});
