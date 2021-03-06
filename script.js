const alphabetLower = "abcdefghijklmnopqrstuvwxyz";
const alphabetUpper = alphabetLower.toUpperCase();
const alphabet = alphabetLower + alphabetUpper;
const digits = "0123456789";
const alphanumeric = alphabet + digits;

let global_settings = {
    size_w: 20,
    size_h: 20,
    extended_charset: "!\"§$%&/()=?*+'#,.-:_<>",
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
    const offBoundary = Math.floor((4294967295)/allowedChars.length) * allowedChars.length

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

function processFormSubmission(){

    global_settings.size_h = document.getElementById("set_height").value;
    global_settings.size_w = document.getElementById("set_width").value;
    global_settings.extended_charset = document.getElementById("extended_charset").value;

    writeSettingsToQuery();
    generatePasswordTable(global_settings.size_w, global_settings.size_h);

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
                    cell_classes.push(`passwordChar column-${even(j)}`, `row-${even(i)}`);
                    cell.innerText = password.charAt(i*tw+j);
                }
            }

            cell.className = cell_classes.join(" ")
        }
    }
}

