exports.words = page_params.alert_words;
exports.set_words = function (value) {
    exports.words = value;
};

// Delete the `page_params.alert_words` since we are its sole user.
delete page_params.alert_words;

// escape_user_regex taken from jquery-ui/autocomplete.js,
// licensed under MIT license.
function escape_user_regex(value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}

exports.process_message = function (message) {
    // Parsing for alert words is expensive, so we rely on the host
    // to tell us there any alert words to even look for.
    if (!message.alerted) {
        return;
    }

    for (const word of exports.words) {
        const clean = escape_user_regex(word);
        const before_punctuation = '\\s|^|>|[\\(\\".,\';\\[]';
        const after_punctuation = '\\s|$|<|[\\)\\"\\?!:.,\';\\]!]';


        const regex = new RegExp('(' + before_punctuation + ')' +
                               '(' + clean + ')' +
                               '(' + after_punctuation + ')', 'ig');
        message.content = message.content.replace(regex, function (match, before, word,
                                                                   after, offset, content) {
            // Logic for ensuring that we don't muck up rendered HTML.
            const pre_match = content.substring(0, offset);
            // We want to find the position of the `<` and `>` only in the
            // match and the string before it. So, don't include the last
            // character of match in `check_string`. This covers the corner
            // case when there is an alert word just before `<` or `>`.
            const check_string = pre_match + match.substring(0, match.length - 1);
            const in_tag = check_string.lastIndexOf('<') > check_string.lastIndexOf('>');
            // Matched word is inside a HTML tag so don't perform any highlighting.
            if (in_tag === true) {
                return before + word + after;
            }
            return before + "<span class='alert-word'>" + word + "</span>" + after;
        });
    }
};

exports.notifies = function (message) {
    // We exclude ourselves from notifications when we type one of our own
    // alert words into a message, just because that can be annoying for
    // certain types of workflows where everybody on your team, including
    // yourself, sets up an alert word to effectively mention the team.
    return !people.is_current_user(message.sender_email) && message.alerted;
};

window.alert_words = exports;
