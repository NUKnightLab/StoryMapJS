/*	VCO.MediaType
	Determines the type of media the url string is.
	returns an object with .type and .id
	You can add new media types by adding a regex 
	to match and the media class name to use to 
	render the media 
================================================== */
VCO.MediaType = function(url) {
	var media = {}, 
		media_types = 	[
			{
				type: 		"youtube",
				match_str: 	"(www.)?youtube|youtu\.be",
				classname: 	VCO.Media.YouTube
			},
			{
				type: 		"vimeo",
				match_str: 	"(player.)?vimeo\.com",
				classname: 	VCO.Media.Vimeo
			},
			{
				type: 		"dailymotion",
				match_str: 	"(www.)?dailymotion\.com",
				classname: 	VCO.Media.IFrame
			},
			{
				type: 		"vine",
				match_str: 	"(www.)?vine\.co",
				classname: 	VCO.Media.Vine
			},
			{
				type: 		"soundcloud",
				match_str: 	"(player.)?soundcloud\.com",
				classname: 	VCO.Media.SoundCloud
			},
			{
				type: 		"twitter",
				match_str: 	"(www.)?twitter\.com",
				classname: 	VCO.Media.Twitter
			},
			{
				type: 		"googlemaps",
				match_str: 	"maps.google",
				classname: 	VCO.Media.Map
			},
			{
				type: 		"googleplus",
				match_str: 	"plus.google",
				classname: 	VCO.Media.GooglePlus
			},
			{
				type: 		"flickr",
				match_str: 	"flickr.com/photos",
				classname: 	VCO.Media.Flickr
			},
			{
				type: 		"instagram",
				match_str: 	"instagr.am/p/",
				classname: 	VCO.Media
			},
			{
				type: 		"image",
				match_str: 	/jpg|jpeg|png|gif/i,
				classname: 	VCO.Media
			},
			{
				type: 		"googledocs",
				match_str: 	/\b.(doc|docx|xls|xlsx|ppt|pptx|pdf|pages|ai|psd|tiff|dxf|svg|eps|ps|ttf|xps|zip|tif)\b/,
				classname: 	VCO.Media.GoogleDoc
			},
			{
				type: 		"wikipedia",
				match_str: 	"(www.)?wikipedia\.org",
				classname: 	VCO.Media.Wikipedia
			},
			{
				type: 		"iframe",
				match_str: 	"iframe",
				classname: 	VCO.Media.IFrame
			},
			{
				type: 		"storify",
				match_str: 	"storify",
				classname: 	VCO.Media.Storify
			},
			{
				type: 		"blockquote",
				match_str: 	"blockquote",
				classname: 	"VCO.Media.Blockquote"
			},
			{
				type: 		"website",
				match_str: 	"http://",
				classname: 	VCO.Media.Website
			},
			{
				type: 		"",
				match_str: 	"",
				classname: 	VCO.Media
			}
		];
	
	for (var i = 0; i < media_types.length; i++) {
		if (url.match(media_types[i].match_str)) {
			media 		= media_types[i];
			media.url 	= url;
			return media;
			break;
		}
	};
	
	return false;
	
}