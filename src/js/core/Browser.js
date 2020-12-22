/*
	Based on Leaflet Browser
	Browser handles different browser and feature detections for internal  use.
*/

const ua = navigator.userAgent.toLowerCase();
const webkit = ua.indexOf('webkit') !== -1;
const ie = 'ActiveXObject' in window;

export const touch = !window.L_NO_TOUCH &&
    typeof phantomjs !== 'undefined' &&
    !phantomjs &&
    (pointer || 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch));

export const mobile = typeof orientation !== 'undefined';
export const chrome = ua.indexOf('chrome') !== -1;
export const firefox = (ua.indexOf('gecko') !== -1) && !webkit && !window.opera && !ie;
