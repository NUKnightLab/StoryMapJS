import { mergeData, pad } from "../core/Util"
const LANGUAGES = {
    'be': require('./locale/be.json'),
    'bg': require('./locale/bg.json'),
    'cs': require('./locale/cs.json'),
    'de': require('./locale/de.json'),
    'el': require('./locale/el.json'),
    'en': require('./locale/en.json'),
    'es': require('./locale/es.json'),
    'et': require('./locale/et.json'),
    'fr': require('./locale/fr.json'),
    'he': require('./locale/he.json'),
    'hu': require('./locale/hu.json'),
    'is': require('./locale/is.json'),
    'it': require('./locale/it.json'),
    'jp': require('./locale/jp.json'),
    'ko': require('./locale/ko.json'),
    'nl': require('./locale/nl.json'),
    'nn': require('./locale/nn.json'),
    'no': require('./locale/no.json'),
    'pl': require('./locale/pl.json'),
    'pt': require('./locale/pt.json'),
    'ru': require('./locale/ru.json'),
    'sk': require('./locale/sk.json'),
    'sr': require('./locale/sr.json'),
    'sv': require('./locale/sv.json'),
    'tr': require('./locale/tr.json'),
    'uk': require('./locale/uk.json'),
    'ur': require('./locale/ur.json'),
    'zh-cn': require('./locale/zh-cn.json'),
    'zh-tw': require('./locale/zh-tw.json')
}


/**
 * Instantiate a Language object to manage I18N. 
 * 
 * @param {String} [language=en] - a language code or a URL to a 
 *     translation file
 * @param {string} [script_path] - if `language` is not a URL, this is used
 *     to construct a fully-qualified URL to load a translation file.
 */
class Language {
    constructor(code, script_path) {
        //if (!(code in LANGUAGES) ) {
        //    loadLanguage(code, script_path);
        //}
        Object.assign(this, LANGUAGES[code]);
        // borrowed from http://stackoverflow.com/a/14446414/102476
        //console.log('LANGUAGES');
        //console.log(LANGUAGES);
        //for (let k in LANGUAGES.en) {
        //    this[k] = LANGUAGES.en[k];
        //}
        // `language` won't be defined when the fallback is constructed
        //if (language && typeof(language) == 'string' && language != 'en') {
        //    var code = language;
        //    if (!(code in LANGUAGES)) {
        //        console.log(`Expected language ${code} to be cached. Did you call the constructor directly?`)
        //        var url = buildLanguageURL(code, script_path);
        //        fetchJSON(url).then((json) => {
        //            LANGUAGES[code] = json
        //        }).catch(resp => {
        //            console.log(`Error loading language [${url}] ${resp.statusText} [${resp.status}]`)
        //        })
        //    }
        //    console.log('Code is in languages');
        //    console.log(LANGUAGES[code]);
        //    console.log('Merging langugage data into this object');
        //    console.log(LANGUAGES[code]);
        //    this.mergeData(LANGUAGES[code]);
        //    console.log(this);
        //}
    }

    /**
     * Reimplement Util.mergeData to handle nested dictionaries
     * @param {object} lang_json 
     */
    /*
    mergeData(lang_json) {
        console.log('mergeData lang_json');
        console.log(lang_json);
        for (let k in LANGUAGES.en) {
            console.log(k);
            if (lang_json[k]) {
                if (typeof(this[k]) == 'object') {
                    console.log('this[k] is object');
                    console.log(this[k]);
                    mergeData(lang_json[k], this[k]);
                } else {
                    this[k] = lang_json[k]; // strings, mostly
                }
            }
        }
        console.log('merged');
        console.log(this);
    }
    */

    /*
    formatBigYear(bigyear, format_name) {
        var the_year = bigyear.year;
        var format_list = this.bigdateformats[format_name] || this.bigdateformats['fallback'];

        if (format_list) {
            for (var i = 0; i < format_list.length; i++) {
                var tuple = format_list[i];
                if (Math.abs(the_year / tuple[0]) > 1) {
                    // will we ever deal with distant future dates?
                    return formatNumber(Math.abs(the_year / tuple[0]), tuple[1])
                }
            };
            return the_year.toString();

        } else {
            console.log("Language file dateformats missing cosmological. Falling back.");
            return formatNumber(the_year, format_name);
        }
    }
    */

    _(k) {
        return this.messages[k] || Language.fallback.messages[k] || k;
    }

    //formatDate(date, format_name) {
    //    if (date.constructor == Date) {
    //        return this.formatJSDate(date, format_name);
    //    }
    //    if (date.constructor == BigYear) {
    //        return this.formatBigYear(date, format_name);
    //    }
    //    if (date.data && date.data.date_obj) {
    //        return this.formatDate(date.data.date_obj, format_name);
    //    }
    //    trace("Unfamiliar date presented for formatting");
    //    return date.toString();
    //}


    /*
    formatJSDate(js_date, format_name) {
        // ultimately we probably want this to work with TLDate instead of (in addition to?) JS Date
        // utc, timezone and timezoneClip are carry over from Steven Levithan implementation. We probably aren't going to use them.
        var self = this;
        var formatPeriod = function(fmt, value) {
            var formats = self.period_labels[fmt];
            if (formats) {
                var fmt = (value < 12) ? formats[0] : formats[1];
            }
            return "<span class='tl-timeaxis-timesuffix'>" + fmt + "</span>";
        }
        var utc = false,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g;
        if (!format_name) {
            format_name = 'full';
        }
        var mask = this.dateformats[format_name] || Language.fallback.dateformats[format_name];
        if (!mask) {
            mask = format_name; // allow custom format strings
        }
        var _ = utc ? "getUTC" : "get",
            d = js_date[_ + "Date"](),
            D = js_date[_ + "Day"](),
            m = js_date[_ + "Month"](),
            y = js_date[_ + "FullYear"](),
            H = js_date[_ + "Hours"](),
            M = js_date[_ + "Minutes"](),
            s = js_date[_ + "Seconds"](),
            L = js_date[_ + "Milliseconds"](),
            o = utc ? 0 : js_date.getTimezoneOffset(),
            year = "",
            flags = {
                d: d,
                dd: pad(d),
                ddd: this.date.day_abbr[D],
                dddd: this.date.day[D],
                m: m + 1,
                mm: pad(m + 1),
                mmm: this.date.month_abbr[m],
                mmmm: this.date.month[m],
                yy: String(y).slice(2),
                yyyy: (y < 0 && this.has_negative_year_modifier()) ? Math.abs(y) : y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: formatPeriod('t', H),
                tt: formatPeriod('tt', H),
                T: formatPeriod('T', H),
                TT: formatPeriod('TT', H),
                Z: utc ? "UTC" : (String(js_date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };
        var formatted = mask.replace(Language.DATE_FORMAT_TOKENS, function($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
        return this._applyEra(formatted, y);
    }
    */

    has_negative_year_modifier() {
        return Boolean(this.era_labels.negative_year.prefix || this.era_labels.negative_year.suffix);
    }


    _applyEra(formatted_date, original_year) {
        // trusts that the formatted_date was property created with a non-negative year if there are
        // negative affixes to be applied
        var labels = (original_year < 0) ? this.era_labels.negative_year : this.era_labels.positive_year;
        var result = '';
        if (labels.prefix) { result += '<span>' + labels.prefix + '</span> ' }
        result += formatted_date;
        if (labels.suffix) { result += ' <span>' + labels.suffix + '</span>' }
        return result;
    }


}

/**
 * Provide an async factory method for loading languages that clarifies the need to wait 
 * for the language data to be loaded, so that other code doesn't press ahead before the language
 * is available. 
 * 
 * 
 * @param {String} language_code - a language code or a fully-qualified URL to a language JSON file
 * @param {String} script_path - a URL prefix which can be used to construct a fully-qualified URL to a language file using `language_code`
 * 
 * @returns {Language} - an instance of Language, or null if there's an error loading the translation file
 */
/*
function loadLanguage(code, script_path) {
    var url = buildLanguageURL(code, script_path);
    fetchJSON(url).then((json) => {
        LANGUAGES[code] = Object.assign({}, LANGUAGES['en'], json);
    }).catch(resp => {
        console.log(`Error loading language [${url}] ${resp.statusText} [${resp.status}]`)
    });
*/
    //this.mergeData(LANGUAGES[code]);
    //var url = buildLanguageURL(language_code, script_path);
    //try {
    //    //if (!LANGUAGES[language_code]) {
    //    //    await fetch(url).then(response => response.json())
    //    //        .then(data => LANGUAGES[language_code] = data);
    //    //}
    //    return new Language(language_code, script_path);
    //} catch (e) {
    //    console.log(`Error loading language [${url}] ${e.statusText}`)
    //    return null;
    //}

    /*
    try {
        let json = await fetchJSON(url)
        console.log(json);
        LANGUAGES[language_code] = json
        console.log('Instantiating Language with code: ' + language_code + '; script path: ' + script_path);
        return new Language(language_code, script_path)
    } catch (e) {
        console.log(`Error loading language [${url}] ${e.statusText}`)
        return null;
    }
    */
//}

function buildLanguageURL(code, script_path) {
    if (/\.json$/.test(code)) {
        var url = code;
    } else {
        var fragment = "/locale/" + code + ".json";
        if (/\/$/.test(script_path)) { fragment = fragment.substr(1); }
        var url = script_path + fragment;
    }
    return url;
}

function formatNumber(val, mask) {
    if (mask.match(/%(\.(\d+))?f/)) {
        var match = mask.match(/%(\.(\d+))?f/);
        var token = match[0];
        if (match[2]) {
            val = val.toFixed(match[2]);
        }
        return mask.replace(token, val);
    }
    // use mask as literal display value.
    return mask;
}


Language.fallback = { messages: {} }; // placeholder to satisfy IE8 early compilation


Language.DATE_FORMAT_TOKENS = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;

//var LANGUAGES = {
    /*
	This represents the canonical list of message keys which translation files should handle. The existence of the 'en.json' file should not mislead you.
	It is provided more as a starting point for someone who wants to provide a
    new translation since the form for non-default languages (JSON not JS) is slightly different 
    from what appears below. Also, those files have some message keys grandfathered in from TimelineJS2 
    which we'd rather not have to get "re-translated" if we use them.
*/
/*
    en: {
        name:                   "English",
        lang:                   "en",
        messages: {
            loading:            "Loading",
            wikipedia:          "From Wikipedia, the free encyclopedia",
            start:              "Start Exploring"
        },
        buttons: {
            map_overview:       "Map Overview",
            overview:           "Overview",
            backtostart:        "Back To Beginning",
            collapse_toggle:    "Hide Map",
            uncollapse_toggle: 	"Show Map",
                swipe_to_navigate: "Swipe to Navigate<br><span class='vco-button'>OK</span>"
        }
    }
};
*/

//let fallback = new Language();
//Language.fallback = fallback;
//export { Language, fallback }
export { Language, LANGUAGES }
