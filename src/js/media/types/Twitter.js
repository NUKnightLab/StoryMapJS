import { Media } from "../Media"
import Dom from "../../dom/Dom"
import { Language } from "../../language/Language"

/*	Media.Twitter
	Produces Twitter Display
================================================== */

export default class Twitter extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
		var api_url,
			self = this;
			
		// Loading Message
		this.message.updateMessage(Language.messages.loading + " " + this.options.media_name);
		
		// Create Dom element
		this._el.content_item = Dom.create("div", "vco-media-twitter", this._el.content);
		
		// Get Media ID

        let r = /twitter.com\/(.+?)\/status\/(\d+)/
        let match = r.exec(this.data.url);
        if (match) { 
            this.user_id = match[1];
            this.media_id = match[2];
        }
        let callbackName = `twitterCallback_${this.media_id}`;
        api_url = `https://api.twitter.com/1/statuses/oembed.json?id=${this.media_id}&include_entities=true&callback=${callbackName}`;
        let callbackScript = document.createElement('script');
        window[callbackName] = function(data) {
            self.createMedia(data);
        };
        callbackScript.src = api_url;
        document.body.appendChild(callbackScript);
	}

	createMedia(d) {	
		var tweet				= "",
			tweet_text			= "",
			tweetuser			= "",
			tweet_status_temp 	= "",
			tweet_status_url 	= "",
			tweet_status_date 	= "";
			
		//	TWEET CONTENT
		tweet_text 			= d.html.split("<\/p>\&mdash;")[0] + "</p></blockquote>";
		tweetuser			= d.author_url.split("twitter.com\/")[1];
		tweet_status_temp 	= d.html.split("<\/p>\&mdash;")[1].split("<a href=\"")[1];
		tweet_status_url 	= tweet_status_temp.split("\"\>")[0];
		tweet_status_date 	= tweet_status_temp.split("\"\>")[1].split("<\/a>")[0];
		
		// Open links in new window
		tweet_text = tweet_text.replace(/<a href/ig, '<a target="_blank" href');
		
		// 	TWEET CONTENT
		tweet += tweet_text;
		
		//	TWEET AUTHOR
		tweet += "<div class='vcard'>";
		tweet += "<a href='" + tweet_status_url + "' class='twitter-date' target='_blank'>" + tweet_status_date + "</a>";
		tweet += "<div class='author'>";
		tweet += "<a class='screen-name url' href='" + d.author_url + "' target='_blank'>";
		tweet += "<span class='avatar'></span>";
		tweet += "<span class='fn'>" + d.author_name + " <span class='vco-icon-twitter'></span></span>";
		tweet += "<span class='nickname'>@" + tweetuser + "<span class='thumbnail-inline'></span></span>";
		tweet += "</a>";
		tweet += "</div>";
		tweet += "</div>";
		
		
		// Add to DOM
		this._el.content_item.innerHTML	= tweet;
		
		// After Loaded
		this.onLoaded();
			
	}
	
	updateMediaDisplay() {
		
	}
	
	_updateMediaDisplay() {
		
	}
	
}
