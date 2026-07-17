/*	Tests for src/js/media/EmbedUtil.js
	Run with: npm test (node --test, jsdom provides the DOM)
================================================== */
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
	url: "https://storymap.knightlab.com/edit/",
});
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;

const { buildIframe, sanitizeBlockquote, validateWebURL } = await import(
	"../../src/js/media/EmbedUtil.js"
);

/*	validateWebURL
================================================== */

test("validateWebURL accepts http and https", () => {
	assert.equal(validateWebURL("https://example.com/a"), "https://example.com/a");
	assert.equal(validateWebURL("http://example.com/a"), "http://example.com/a");
});

test("validateWebURL resolves relative and protocol-relative URLs", () => {
	assert.equal(validateWebURL("/foo"), "https://storymap.knightlab.com/foo");
	assert.equal(validateWebURL("//example.com/x"), "https://example.com/x");
});

test("validateWebURL rejects non-web protocols and empty values", () => {
	assert.equal(validateWebURL("javascript:alert(1)"), null);
	assert.equal(validateWebURL("data:text/html,<script>alert(1)</script>"), null);
	assert.equal(validateWebURL("vbscript:x"), null);
	assert.equal(validateWebURL(""), null);
	assert.equal(validateWebURL(null), null);
});

/*	buildIframe
================================================== */

test("buildIframe extracts src and presentation attributes from an embed code", () => {
	const iframe = buildIframe(
		'<iframe src="https://www.youtube.com/embed/abc123" width="560" height="315" frameborder="0" allowfullscreen></iframe>'
	);
	assert.ok(iframe);
	assert.equal(iframe.tagName, "IFRAME");
	assert.equal(iframe.getAttribute("src"), "https://www.youtube.com/embed/abc123");
	assert.equal(iframe.getAttribute("width"), "560");
	assert.equal(iframe.getAttribute("height"), "315");
	assert.equal(iframe.getAttribute("frameborder"), "0");
	assert.ok(iframe.hasAttribute("allowfullscreen"));
});

test("buildIframe strips event handlers and unknown attributes", () => {
	const iframe = buildIframe(
		'<iframe src="https://example.com/" onload="alert(1)" name="evil" srcdoc="<script>alert(1)</script>"></iframe>'
	);
	assert.ok(iframe);
	assert.equal(iframe.getAttribute("onload"), null);
	assert.equal(iframe.getAttribute("name"), null);
	assert.equal(iframe.getAttribute("srcdoc"), null);
});

test("buildIframe discards markup outside the iframe", () => {
	const iframe = buildIframe(
		'<img src=x onerror="alert(1)"><iframe src="https://example.com/"></iframe><script>alert(1)</script>'
	);
	assert.ok(iframe);
	assert.equal(iframe.tagName, "IFRAME");
	assert.equal(iframe.getAttribute("src"), "https://example.com/");
});

test("buildIframe rejects javascript: src", () => {
	assert.equal(buildIframe('<iframe src="javascript:alert(1)"></iframe>'), null);
});

test("buildIframe rejects an iframe with no src", () => {
	assert.equal(buildIframe("<iframe></iframe>"), null);
});

test("buildIframe accepts a bare URL that routed to the iframe type", () => {
	const iframe = buildIframe("https://example.com/iframe-demo");
	assert.ok(iframe);
	assert.equal(iframe.getAttribute("src"), "https://example.com/iframe-demo");
	assert.equal(iframe.getAttribute("width"), "100%");
});

test("buildIframe returns null for text that is neither embed nor URL", () => {
	assert.equal(buildIframe("this mentions iframe but embeds nothing"), null);
});

/*	sanitizeBlockquote
================================================== */

function renderedHTML(fragment) {
	const div = document.createElement("div");
	div.appendChild(fragment);
	return div.innerHTML;
}

test("sanitizeBlockquote keeps quote structure and text", () => {
	const html = renderedHTML(
		sanitizeBlockquote("<blockquote><p>Truth is <em>rarely</em> pure.</p><cite>Oscar Wilde</cite></blockquote>")
	);
	assert.equal(html, "<blockquote><p>Truth is <em>rarely</em> pure.</p><cite>Oscar Wilde</cite></blockquote>");
});

test("sanitizeBlockquote drops script tags and their contents", () => {
	const html = renderedHTML(
		sanitizeBlockquote("<blockquote>quote</blockquote><script>alert(1)</script>")
	);
	assert.equal(html, "<blockquote>quote</blockquote>");
});

test("sanitizeBlockquote strips event handler and style attributes", () => {
	const html = renderedHTML(
		sanitizeBlockquote('<blockquote onclick="alert(1)" style="color:red">quote</blockquote>')
	);
	assert.equal(html, "<blockquote>quote</blockquote>");
});

test("sanitizeBlockquote unwraps unknown tags but keeps their text", () => {
	const html = renderedHTML(
		sanitizeBlockquote("<div><blockquote>quote</blockquote><h1>heading</h1></div>")
	);
	assert.equal(html, "<blockquote>quote</blockquote>heading");
});

test("sanitizeBlockquote drops img-based XSS entirely", () => {
	const html = renderedHTML(
		sanitizeBlockquote('<blockquote>q<img src=x onerror="alert(1)"></blockquote>')
	);
	assert.equal(html, "<blockquote>q</blockquote>");
});

test("sanitizeBlockquote keeps links with valid href, drops javascript: href", () => {
	const good = renderedHTML(
		sanitizeBlockquote('<blockquote><a href="https://example.com/">link</a></blockquote>')
	);
	assert.equal(good, '<blockquote><a href="https://example.com/" target="_blank">link</a></blockquote>');

	const bad = renderedHTML(
		sanitizeBlockquote('<blockquote><a href="javascript:alert(1)">link</a></blockquote>')
	);
	assert.equal(bad, "<blockquote><a>link</a></blockquote>");
});
