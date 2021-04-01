/*
	Based on Leaflet Browser
	Browser handles different browser and feature detections for internal  use.
*/

export const ua = navigator.userAgent.toLowerCase();
export const doc = document.documentElement;
export const webkit = ua.indexOf('webkit') !== -1;
export const ie = 'ActiveXObject' in window;
export const phantomjs = ua.indexOf('phantom') !== -1;
export const android23 = ua.search('android [23]') !== -1;
export const mobile = typeof orientation !== 'undefined';
export const msPointer = navigator.msPointerEnabled && navigator.msMaxTouchPoints && !window.PointerEvent;
export const pointer = (window.PointerEvent && navigator.pointerEnabled && navigator.maxTouchPoints) || msPointer;
export const ie3d = ie && ('transition' in doc.style);
export const webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;
export const gecko3d = 'MozPerspective' in doc.style;
export const opera3d = 'OTransition' in doc.style;
export const opera = window.opera;
export const touch = !window.L_NO_TOUCH && !phantomjs
    && (pointer || 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch));

export let retina = 'devicePixelRatio' in window && window.devicePixelRatio > 1;
if (!retina && 'matchMedia' in window) {
    var matches = window.matchMedia('(min-resolution:144dpi)');
    retina = matches && matches.matches;
}

export const Browser = {
    ie: ie,
    ielt9: ie && !document.addEventListener,
    webkit: webkit,
    chrome: ua.indexOf('chrome') !== -1,
    firefox: (ua.indexOf('gecko') !== -1) && !webkit && !window.opera && !ie,
    android: ua.indexOf('android') !== -1,
    android23: android23,
    ie3d: ie3d,
    webkit3d: webkit3d,
    gecko3d: gecko3d,
    opera3d: opera3d,
    any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs,
    mobile: mobile,
    mobileWebkit: mobile && webkit,
    mobileWebkit3d: mobile && webkit3d,
    mobileOpera: mobile && window.opera,
    touch: !! touch,
    msPointer: !! msPointer,
    pointer: !! pointer,
    retina: !! retina,
    orientation: function() {
        var w = window.innerWidth,
            h = window.innerHeight,
            _orientation = "portrait";
        if (w > h) {
            _orientation = "landscape";
        }
        if (Math.abs(window.orientation) == 90) {
            //_orientation = "landscape";
        }
        trace(_orientation);
        return _orientation;
    }
};
