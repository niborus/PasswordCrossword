const alphabetLower = "abcdefghijklmnopqrstuvwxyz";
const alphabetUpper = alphabetLower.toUpperCase();
const alphabet = alphabetLower + alphabetUpper;
const digits = "0123456789";
const alphanumeric = alphabet + digits;

let global_settings = {
    size_w: 18,
    size_h: 18,
    extended_charset: "!\"§$%&/()=?*+'#,.-:_<>",
}

const UINT32MAX = 4294967295

/**
 * Returns a cryptographic secure random UInt32
 *
 * @return {number} random UInt32
 */
function randU32() {
    let randomNumberArray = new Uint32Array(1);
    self.crypto.getRandomValues(randomNumberArray);
    return randomNumberArray[0]
}

/**
 * Returns a random number smaller than i
 *
 * @param {number} i
 */
function rand_smaller_than(i) {
    const offBoundary = Math.floor((UINT32MAX)/i) * i
    let random_u32 = 0;
    do {
        random_u32 = randU32();
    } while (random_u32 >= offBoundary);
    return  random_u32 % i
}

/**
 * Creates a cryptographic random string.
 *
 * Creates a cryptographic random with the length of the given input.
 * By design, this could return valid HTML code. It is unlikely, but possible.
 *
 * @param {number} str_len The Length of the string to return.
 * @returns {string} A cryptographic random string.
 */
function rand_string(str_len = 32) {

    // Settings
    const allowedChars = alphanumeric + global_settings.extended_charset;
    const randomArrayLength = 2;

    // Variables and Constants defined at runtime
    let string_to_return = "";
    let randomNumbers = new Uint32Array(randomArrayLength);
    let randomNumbersCounter = randomArrayLength;
    const offBoundary = Math.floor((UINT32MAX)/allowedChars.length) * allowedChars.length

    while (string_to_return.length < str_len) {
        if (randomNumbersCounter >= randomArrayLength) {
            self.crypto.getRandomValues(randomNumbers);
            randomNumbersCounter = 0;
        }

        let randomUInt32 = randomNumbers[randomNumbersCounter];
        randomNumbersCounter++;
        if (randomUInt32 >= offBoundary) {
            // Can not use this value, as it would unbalance probability
            continue
        }
        string_to_return += allowedChars.charAt(randomUInt32 % allowedChars.length)
    }
    return string_to_return;
}

/**
 * Shuffles an array.
 *
 * Uses Fisher–Yates shuffle https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 *
 * @param {any[]} seq
 * @return {any[]}
 */
function shuffle(seq) {
    for (let i = seq.length-1; i >= 1; i--) {
        let j = rand_smaller_than(i+1)

        // Exchange seq[i] and sqe[j]
        let tmp = seq[i];
        seq[i] = seq[j];
        seq[j] = tmp;
    }
    return seq;
}

/**
 * Returns "even" if i is even, "odd" otherwise.
 *
 * @param {number} i Number to check.
 * @returns {string} "even" or "odd"
 */
function even(i) {
    return `${(i%2===0) ? "even" : "odd"}`
}

/**
 * Insert a value into an element.
 *
 * @param {string} element_id Element ID of that Element
 * @param {any} value The Value
 */
function set (element_id, value) {
    document.getElementById(element_id).value = value;
}

function writeSettingsToQuery() {
    let currentQuery = new URLSearchParams(window.location.search);
    currentQuery.set("size_height", global_settings.size_h);
    currentQuery.set("size_width", global_settings.size_w);
    currentQuery.set("global_charset", global_settings.extended_charset);

    window.history.pushState("", "", "?"+currentQuery.toString());
}

function processFormSubmission(event){
    event.preventDefault()

    global_settings.size_h = parseInt(document.getElementById("set_height").value);
    global_settings.size_w = parseInt(document.getElementById("set_width").value);
    global_settings.extended_charset = document.getElementById("extended_charset").value;

    writeSettingsToQuery();
    generatePasswordTable(global_settings.size_w, global_settings.size_h);
    add_emojis_to_table(global_settings.size_w, global_settings.size_h);

    return false;
}

/**
 * Checks if i is a Number.
 * @param i_any
 * @returns {null|number}
 */
function safe_int(i_any) {
    let i = Math.floor(Number(i_any) || 0);
    return (i > 0) ? i : NaN
}

/**
 * Reads the settings from the Query and loads them.
 */
function getSettingsFromQuery() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    global_settings.size_h = safe_int(params.size_height) || global_settings.size_h;
    global_settings.size_w = safe_int(params.size_width)  || global_settings.size_w;
    global_settings.extended_charset = (params.extended_charset !== null) ? params.extended_charset : global_settings.extended_charset
}

/**
 * Returns the base 26 logarithm of a number
 *
 * @param {number} base The base of the expression.
 * @param {number} x A numeric expression.
 * @return {number}
 */
function log_n(base, x) {
    return Math.log(x) / Math.log(base);
}

/**
 * Returns the size of characters, a number has in a specific base.
 *
 * @param {number} base The base of the expression.
 * @param {number} x A numeric expression.
 * @return {number}
 */
function size_in_base(base, x) {
    return Math.floor(log_n(base, x)) +1
}

function base_26_number(padding, x) {
    let rest_padding = padding;
    let rest = x;
    let m = 0;
    let result = "";
    while (rest > 0 || rest_padding > 0) {
        m = rest % 26;
        rest = Math.floor(rest/26);
        result = String.fromCharCode(0x41 + m) + result
        rest_padding--;
    }
    return result
}

/**
 * Generates a new Password-Table.
 *
 * Looks for the Table #pass_cross and will
 * 1. empty it
 * 2. generate a password
 * 3. create table cells
 *
 * @param {number} tw Table-Width
 * @param {number} th Table-Height
 */
function generatePasswordTable(tw, th) {
    //Get Table from index.html
    let table = document.getElementById("pass_cross");
    let top_header_size = log_n(26, tw);

    // Clear old table, if it existed before.
    table.innerHTML = ""

    // Generate a new password
    let password = rand_string(tw*th)

    // Generate Table Row by Row
    for (let i = -1; i < th; i++) {
        var row = (i === -1) ? document.createElement('thead') : document.createElement('tr');
        table.appendChild(row);

        row.className = `row-${even(i)}`

        // Generate basic password table
        for (let j = -1; j < tw; j++) {

            let cell_classes = ["password_cell"]

            var cell = document.createElement('td');
            row.appendChild(cell)

            if (i === -1) {
                if (j !== -1) {
                    cell.innerText = base_26_number(top_header_size, j);
                    cell_classes.push("top-header");
                    if (top_header_size > 1) {
                        cell_classes.push(`column-${even(j)}`)
                    }
                } else {
                    cell_classes.push("top-header", "left-header");
                }
            } else {
                if (j === -1) {
                    cell.innerText = i.toLocaleString();
                    cell_classes.push("left-header");
                } else {
                    cell_classes.push(`passwordChar`, `column-${even(j)}`, `row-${even(i)}`);
                    cell.id = `passwordChar-${i}-${j}`
                    cell.innerText = password.charAt(i*tw+j);
                }
            }

            cell.className = cell_classes.join(" ")
        }

    }
}

/**
 * Gets all numbers from 0 to n (excluding) in a shuffled order
 * @param {number} n The length of the array.
 * @return Array
 */
function shuffled_sequence(n) {
    console.log(n)
    return shuffle([...Array(n).keys()])
}

let emojis_template = Array.from("🧯🌪📯🔥🔪🛒🔒⚽🍓🥗🖊⏰🧪🕯📹🎁🐳🐍🎃♥🌘📍🎣💎🚽🌡🎄" +
    "🥐🐓👖🚦🪁🥋🕌🧴🪗⛺🎙👜🚝🎵🔮🔧🪃📫✂🍭🥦🛵✈🚤⛲🌩☂🌈")

function add_emojis_to_table(tw, th) {

    // This is one Emoji for each row/column on the long side.
    // If the short side is bigger than 12, multiple Emojis for each row/column on the long side.
    let emoji_count = Math.max(tw, th)*(1+Math.floor(Math.min(tw, th) / 12));

    let emoji_position_x = []
    let emoji_position_y = []

    while (emoji_position_x.length < emoji_count) {
        emoji_position_x = emoji_position_x.concat(shuffled_sequence(tw))
    }
    while (emoji_position_y.length < emoji_count) {
        emoji_position_y = emoji_position_y.concat(shuffled_sequence(th))
    }
    let emojis = [];
    while (emojis.length < emoji_count) {
        emojis = emojis.concat(shuffle(emojis_template))
    }

    for (let i = 0; i < emoji_count; i++) {
        document.getElementById(`passwordChar-${emoji_position_y[i]}-${emoji_position_x[i]}`)
            .innerText = emojis[i]
    }
    twemoji.parse(document.body, {folder: 'svg', ext: '.svg'})
}
