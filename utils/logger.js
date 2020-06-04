const util = require("util");

const info = text => console.log((typeof text === 'string') ? text : util.inspect(text));
const error = error => console.error(error);

module.exports = {
    info,
    error
}