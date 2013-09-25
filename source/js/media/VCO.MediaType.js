/*	VCO.MediaType
	Determines the type of media the url string is.
	returns an object with .type and .id
	You can add new media types by adding a regex 
	to match and the media class name to use to 
	render the media 

	TODO
	Allow array so a slideshow can be a mediatype
================================================== */
VCO.MediaType = function(m) {
	var media = {}, 
		media_types = 	[
			{
				type: 		"youtube",
				match_str: 	"(www.)?youtube|youtu\.be",
				cls: 		VCO.Media.YouTube
			},
			{
				type: 		"vimeo",
				match_str: 	"(player.)?vimeo\.com",
				cls: 		VCO.Media.Vimeo
			},
			{
				type: 		"dailymotion",
				match_str: 	"(www.)?dailymotion\.com",
				cls: 		VCO.Media.DailyMotion
			},
			{
				type: 		"vine",
				match_str: 	"(www.)?vine\.co",
				cls: 		VCO.Media.Vine
			},
			{
				type: 		"soundcloud",
				match_str: 	"(player.)?soundcloud\.com",
				cls: 		VCO.Media.SoundCloud
			},
			{
				type: 		"twitter",
				match_str: 	"(www.)?twitter\.com",
				cls: 		VCO.Media.Twitter
			},
			{
				type: 		"googlemaps",
				match_str: 	"maps.google",
				cls: 		VCO.Media.Map
			},
			{
				type: 		"googleplus",
				match_str: 	"plus.google",
				cls: 		VCO.Media.GooglePlus
			},
			{
				type: 		"flickr",
				match_str: 	"flickr.com/photos",
				cls: 		VCO.Media.Flickr
			},
			{
				type: 		"instagram",
				match_str: 	"instagr.am/p/",
				cls: 		VCO.Media
			},
			{
				type: 		"image",
				match_str: 	/jpg|jpeg|png|gif/i,
				cls: 		VCO.Media.Image
			},
			{
				type: 		"googledocs",
				match_str: 	/\b.(doc|docx|xls|xlsx|ppt|pptx|pdf|pages|ai|psd|tiff|dxf|svg|eps|ps|ttf|xps|zip|tif)\b/,
				cls: 		VCO.Media.GoogleDoc
			},
			{
				type: 		"wikipedia",
				match_str: 	"(www.)?wikipedia\.org",
				cls: 		VCO.Media.Wikipedia
			},
			{
				type: 		"iframe",
				match_str: 	"iframe",
				cls: 		VCO.Media.IFrame
			},
			{
				type: 		"storify",
				match_str: 	"storify",
				cls: 		VCO.Media.Storify
			},
			{
				type: 		"blockquote",
				match_str: 	"blockquote",
				cls: 		VCO.Media.Blockquote
			},
			{
				type: 		"website",
				match_str: 	"http://",
				cls: 		VCO.Media.Website
			},
			{
				type: 		"",
				match_str: 	"",
				cls: 		VCO.Media
			}
		];
	
	for (var i = 0; i < media_types.length; i++) {
		if (m instanceof Array) {
			trace("SLIDER");
			return media = {
				type: 		"slider",
				cls: 		VCO.Media.Slider
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