import { Media } from "../Media"

/*	Media.Website
================================================== */

export default class Website extends Media {
	
	/*	Load the media
	================================================== */
	_loadMedia() {
	}
	
	createMedia(d) {		
		// After Loaded
		this.onLoaded();
	}
	
}
