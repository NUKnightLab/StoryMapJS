import Image from "./types/Image"
import YouTube from "./types/YouTube"
import Blockquote from "./types/Blockquote"
import Wikipedia from "./types/Wikipedia"
import SoundCloud from "./types/SoundCloud"
import Vimeo from "./types/Vimeo"
import DailyMotion from "./types/DailyMotion"
import Vine from "./types/Vine"
import Twitter from "./types/Twitter"
import Flickr from "./types/Flickr"
import Instagram from "./types/Instagram"
import Profile from "./types/Profile"
import GoogleDoc from "./types/GoogleDoc"
import GooglePlus from "./types/GooglePlus"
import Slider from "./types/Slider"
import Storify from "./types/Storify"
import IFrame from "./types/IFrame"
import Website from "./types/Website"
import { Media } from "./Media"


/*	MediaType
	Determines the type of media the url string is.
	returns an object with .type and .id
	You can add new media types by adding a regex 
	to match and the media class name to use to 
	render the media 

	TODO
	Allow array so a slideshow can be a mediatype
================================================== */
export default function MediaType(m) {
	var media = {}, 
		media_types = 	[
			{
				type: 		"youtube",
				name: 		"YouTube", 
				match_str: 	"(www.)?youtube|youtu\.be",
				cls: 		YouTube
			},
			{
				type: 		"vimeo",
				name: 		"Vimeo", 
				match_str: 	"(player.)?vimeo\.com",
				cls: 		Vimeo
			},
			{
				type: 		"dailymotion",
				name: 		"DailyMotion", 
				match_str: 	"(www.)?dailymotion\.com",
				cls: 		DailyMotion
			},
			{
				type: 		"vine",
				name: 		"Vine", 
				match_str: 	"(www.)?vine\.co",
				cls: 		Vine
			},
			{
				type: 		"soundcloud",
				name: 		"SoundCloud", 
				match_str: 	"(player.)?soundcloud\.com",
				cls: 		SoundCloud
			},
			{
				type: 		"twitter",
				name: 		"Twitter", 
				match_str: 	"(www.)?twitter\.com",
				cls: 		Twitter
			},
			//{
		    //		type: 		"googlemaps",
		    //		name: 		"Google Map", 
		    //		match_str: 	"maps.google",
			//	cls: 		VCO.Media.Map
			//},
			{
				type: 		"googleplus",
				name: 		"Google+", 
				match_str: 	"plus.google",
				cls: 		GooglePlus
			},
			{
				type: 		"flickr",
				name: 		"Flickr", 
				match_str: 	"flickr.com/photos",
				cls: 		Flickr
			},
			{
				type: 		"instagram",
				name: 		"Instagram", 
				match_str: 	/(instagr.am|instagram.com)\/p\//,
				cls: 		Instagram
			},
			{
				type: 		"profile",
				name: 		"Profile", 
				match_str: 	/((instagr.am|instagram.com)(\/profiles\/|[-a-zA-Z0-9@:%_\+.~#?&//=]+instagramprofile))|[-a-zA-Z0-9@:%_\+.~#?&//=]+\?profile/,
				cls: 		Profile
			},
			{
				type: 		"image",
				name: 		"Image",
				match_str: 	/jpg|jpeg|png|gif/i,
				cls: 		Image
			},
			{
				type: 		"googledocs",
				name: 		"Google Doc",
				match_str: 	/\b.(doc|docx|xls|xlsx|ppt|pptx|pdf|pages|ai|psd|tiff|dxf|svg|eps|ps|ttf|xps|zip|tif)\b/,
				cls: 		GoogleDoc
			},
			{
				type: 		"wikipedia",
				name: 		"Wikipedia",
				match_str: 	"(www.)?wikipedia\.org",
				cls: 		Wikipedia
			},
			{
				type: 		"iframe",
				name: 		"iFrame",
				match_str: 	"iframe",
				cls: 		IFrame
			},
			{
				type: 		"storify",
				name: 		"Storify",
				match_str: 	"storify",
				cls: 		Storify
			},
			{
				type: 		"blockquote",
				name: 		"Quote",
				match_str: 	"blockquote",
				cls: 		Blockquote
			},
			{
				type: 		"website",
				name: 		"Website",
				match_str: 	"http://",
				cls: 		Website
			},
			{
				type: 		"",
				name: 		"",
				match_str: 	"",
				cls: 		Media
			}
		];
	
	for (var i = 0; i < media_types.length; i++) {
		if (m instanceof Array) {
			return media = {
				type: 		"slider",
				cls: 		Slider
			};
		} else if (m.url.match(media_types[i].match_str)) {
			media 		= media_types[i];
			media.url 	= m.url;
			return media;
			break;
		}
	};
	
	return false;
	
}
