const alphabetLower = "abcdefghijklmnopqrstuvwxyz";
const alphabetUpper = alphabetLower.toUpperCase();
const alphabet = alphabetLower + alphabetUpper;
const digits = "0123456789";
const alphanumeric = alphabet + digits;

/**
 * Creates a cryptographic random string.
 *
 * Creates a cryptographic random with the length of the given input.
 *
 * @param {number} str_len The Length of the string to return.
 * @returns {string} A cryptographic random string.
 */
function rand_string(str_len = 32) {

    // Settings
    const allowedChars = alphanumeric;
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
