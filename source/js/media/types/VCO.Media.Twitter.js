/*	VCO.Media.Twitter
	Produces Twitter Display
================================================== */

VCO.Media.Twitter = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	_loadMedia: function() {
		var api_url,
			self = this;
			
		// Loading Message
		this.message.updateMessage(VCO.Language.messages.loading + " Tweet");
		
		// Create Dom element
		this._el.content_item = VCO.Dom.create("div", "vco-media-twitter", this._el.content);
		
		// Get Media ID
		if (this.data.url.match("status\/")) {
			this.media_id = this.data.url.split("status\/")[1];
		} else if (url.match("statuses\/")) {
			this.media_id = this.data.url.split("statuses\/")[1];
		} else {
			this.media_id = "";
		}
		
		// API URL
		api_url = "http://api.twitter.com/1/statuses/oembed.json?id=" + this.media_id + "&omit_script=true&include_entities=true&callback=?";
		
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
