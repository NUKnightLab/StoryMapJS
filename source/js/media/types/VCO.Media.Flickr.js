/*	VCO.Media.Flickr

================================================== */

VCO.Media.Flickr = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	loadMedia: function() {
		var api_url,
			self = this;
		
		// Create Dom element
		this._el.content_item = VCO.Dom.create("div", "vco-media-twitter", this._el.content);
		
		// Get Media ID
		this.media_id = this.data.url.split("photos\/")[1].split("/")[1];
		
		// API URL
		api_url = "http://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=" + api_key + "&photo_id=" + this.media_id + "&format=json&jsoncallback=?";
		
		// API Call
		VCO.getJSON(api_url, function(d) {
			self.createMedia(d);
		});
		
	},
	
	createMedia: function(d) {		
		var tweet		= "",
			tweetuser	= "";
			
		//	TWEET CONTENT
		tweet += d.html.split("<\/p>\&mdash;")[0] + "</p></blockquote>";
		tweetuser = d.author_url.split("twitter.com\/")[1];
		
		//	TWEET AUTHOR
		tweet += "<div class='vcard author'>";
		tweet += "<a class='screen-name url' href='" + d.author_url + "' target='_blank'>";
		tweet += "<span class='avatar'></span>";
		tweet += "<span class='fn'>" + d.author_name + "</span>";
		tweet += "<span class='nickname'>@" + tweetuser + "<span class='thumbnail-inline'></span></span>";
		tweet += "</a>";
		tweet += "</div>";
		
		// Add to DOM
		this._el.content_item.innerHTML	= tweet;
		
		// After Loaded
		this.onLoaded();
			
	}
	
	
	
});
