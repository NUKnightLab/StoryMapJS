import Image from "./types/Image"
import Audio from "./types/Audio"
import Video from "./types/Video"
import YouTube from "./types/YouTube"
import Blockquote from "./types/Blockquote"
import Wikipedia from "./types/Wikipedia"
import SoundCloud from "./types/SoundCloud"
import Vimeo from "./types/Vimeo"
import DailyMotion from "./types/DailyMotion"
import Vine from "./types/Vine"
import Twitter from "./types/Twitter"
import Flickr from "./types/Flickr"
import GoogleDoc from "./types/GoogleDoc"
import Slider from "./types/Slider"
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
        media_types = [{
                type: "youtube",
                name: "YouTube",
                match_str: "(www.)?youtube|youtu\.be",
                cls: YouTube
            },
            {
                type: "vimeo",
                name: "Vimeo",
                match_str: "(player.)?vimeo\.com",
                cls: Vimeo
            },
            {
                type: "dailymotion",
                name: "DailyMotion",
                match_str: "(www.)?dailymotion\.com",
                cls: DailyMotion
            },
            {
                type: "vine",
                name: "Vine",
                match_str: "(www.)?vine\.co",
                cls: Vine
            },
            {
                type: "soundcloud",
                name: "SoundCloud",
                match_str: "(player.)?soundcloud\.com",
                cls: SoundCloud
            },
            {
                type: "twitter",
                name: "Twitter",
                match_str: "(www.)?twitter\.com",
                cls: Twitter
            },
            //{
            //		type: 		"googlemaps",
            //		name: 		"Google Map", 
            //		match_str: 	"maps.google",
            //	cls: 		VCO.Media.Map
            //},
            {
                type: "flickr",
                name: "Flickr",
                match_str: "flickr.com/photos",
                cls: Flickr
            },
            {
                type: "image",
                name: "Image",
                match_str: /jpg|jpeg|png|gif/i,
                cls: Image
            },
            {
                type: "googledocs",
                name: "Google Doc",
                match_str: "^(https?:)?\/*[^.]*.google.com\/[^\/]*\/d\/[^\/]*\/[^\/]*\?usp=sharing|^(https?:)?\/*drive.google.com\/open\?id=[^\&]*\&authuser=0|^(https?:)?\/\/*drive.google.com\/open\\?id=[^\&]*|^(https?:)?\/*[^.]*.googledrive.com\/host\/[^\/]*\/",
                cls: GoogleDoc
            },
            {
                type: "wikipedia",
                name: "Wikipedia",
                match_str: "(www.)?wikipedia\.org",
                cls: Wikipedia
            },
            {
                type: "iframe",
                name: "iFrame",
                match_str: "iframe",
                cls: IFrame
            },
            {
                type: "blockquote",
                name: "Quote",
                match_str: "blockquote",
                cls: Blockquote
            },
            {
                type: "audio",
                name: "Audio",
                match_str: /(mp3|wav|m4a)(\?.*)?$/i,
                cls: Audio
            },
            {
                type: "video",
                name: "Video",
                match_str: /(mp4|webm)(\?.*)?$/i,
                cls: Video
            },
            {
                type: "website",
                name: "Website",
                match_str: "https?://",
                cls: Website
            },
            {
                type: "",
                name: "",
                match_str: "",
                cls: Media
            }
        ];

    for (var i = 0; i < media_types.length; i++) {
        if (m instanceof Array) {
            return media = {
                type: "slider",
                cls: Slider
            };
        } else if (m.url.match(media_types[i].match_str)) {
            media = media_types[i];
            media.url = m.url;
            return media;
            break;
        }
    };

    return false;

}