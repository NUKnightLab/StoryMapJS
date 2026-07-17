/*	EmbedUtil
	Utilities for safely rendering user-pasted embed snippets.

	The media "url" field is overloaded: for the iframe and blockquote
	media types it holds raw HTML pasted by the user (that markup is
	what routes the media to those types in MediaType.js). These helpers
	parse that HTML inertly -- DOMParser never executes scripts or event
	handlers -- and rebuild clean DOM from an allowlist, so markup stored
	in a storymap's JSON can never execute code in a viewer's browser.
================================================== */

// Attributes copied from a pasted <iframe> onto the rebuilt element.
// src is handled separately (validated); everything else is dropped.
const IFRAME_ATTRIBUTES = ["width", "height", "frameborder", "allowfullscreen", "allow", "scrolling", "title"];

// Tags allowed to survive blockquote sanitization. Elements not listed
// are unwrapped (their children are kept); DROP_TAGS are removed along
// with their contents.
const BLOCKQUOTE_TAGS = ["BLOCKQUOTE", "P", "CITE", "EM", "STRONG", "B", "I", "U", "Q", "A", "BR", "SPAN", "SMALL", "SUP", "SUB", "FOOTER", "UL", "OL", "LI"];
const DROP_TAGS = ["SCRIPT", "STYLE", "TEMPLATE", "IFRAME", "FRAME", "OBJECT", "EMBED", "APPLET", "LINK", "META", "BASE", "SVG", "MATH", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT"];

function parseInert(html) {
	return new DOMParser().parseFromString(html, "text/html");
}

/*	Return an absolute http(s) URL for url, or null if it is empty,
	unparseable, or uses any other protocol (javascript:, data:, ...).
	Relative and protocol-relative URLs resolve against the document.
================================================== */
export function validateWebURL(url) {
	if (!url) {
		return null;
	}
	var a = document.createElement("a");
	a.href = url;
	if (a.protocol === "http:" || a.protocol === "https:") {
		return a.href;
	}
	return null;
}

/*	Build a clean <iframe> element from a pasted embed snippet.
	Only the validated src and allowlisted presentation attributes
	survive; event handlers, extra tags and scripts are discarded.
	Also accepts a bare URL for the src. Returns null if no safe
	src can be extracted.
================================================== */
export function buildIframe(html) {
	var pasted = parseInert(html).querySelector("iframe");
	var src = null;

	if (pasted) {
		src = validateWebURL(pasted.getAttribute("src"));
	} else if (/^https?:\/\/\S+$/i.test(html.trim())) {
		// The field held a bare URL rather than an embed snippet
		src = validateWebURL(html.trim());
	}
	if (!src) {
		return null;
	}

	var iframe = document.createElement("iframe");
	iframe.setAttribute("src", src);
	if (pasted) {
		for (var i = 0; i < IFRAME_ATTRIBUTES.length; i++) {
			if (pasted.hasAttribute(IFRAME_ATTRIBUTES[i])) {
				iframe.setAttribute(IFRAME_ATTRIBUTES[i], pasted.getAttribute(IFRAME_ATTRIBUTES[i]));
			}
		}
	} else {
		iframe.setAttribute("width", "100%");
		iframe.setAttribute("height", "100%");
		iframe.setAttribute("frameborder", "0");
		iframe.setAttribute("allowfullscreen", "");
	}
	return iframe;
}

/*	Sanitize pasted blockquote markup into a DocumentFragment.
	Allowlisted formatting tags are kept (with all attributes stripped,
	except a validated href on links), unknown tags are unwrapped, and
	executable/embedding tags are dropped with their contents.
================================================== */
export function sanitizeBlockquote(html) {
	var fragment = document.createDocumentFragment();
	appendSanitized(parseInert(html).body, fragment);
	return fragment;
}

function appendSanitized(node, parent) {
	for (var i = 0; i < node.childNodes.length; i++) {
		var child = node.childNodes[i];
		if (child.nodeType === 3) {
			parent.appendChild(document.createTextNode(child.nodeValue));
		} else if (child.nodeType === 1) {
			var tag = child.nodeName.toUpperCase();
			if (DROP_TAGS.indexOf(tag) !== -1) {
				continue;
			}
			if (BLOCKQUOTE_TAGS.indexOf(tag) !== -1) {
				var el = document.createElement(tag);
				if (tag === "A") {
					var href = validateWebURL(child.getAttribute("href"));
					if (href) {
						el.setAttribute("href", href);
						el.setAttribute("target", "_blank");
					}
				}
				appendSanitized(child, el);
				parent.appendChild(el);
			} else {
				// Unknown tag: unwrap, keeping its children
				appendSanitized(child, parent);
			}
		}
		// Comments and other node types are dropped
	}
}
