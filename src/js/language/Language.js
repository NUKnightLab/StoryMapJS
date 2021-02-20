let EN = require('./locale/en.json');

var Language = {}

function getLanguage(code) {
    var lang = require(`./locale/${code}.json`);
    for (let k in EN) {
        if (lang[k]) {
            if (typeof(EN[k]) == 'object') {
                lang[k] = Object.assign(EN[k], lang[k]);
            }
        } else {
            lang[k] = EN[k];
        }
    }
    return lang;
}

function setLanguage(code) {
    Language = getLanguage(code);
    return Language;
}

export { setLanguage, Language }
