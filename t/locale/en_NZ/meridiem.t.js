require('proof')(4, function (assert) {
    var tz = require('timezone')(require('timezone/en_NZ'))

    // en_NZ meridiem upper case
    assert(tz('2000-09-03 08:05:04', '%P', 'en_NZ'), 'am', 'ante meridiem lower case')
    assert(tz('2000-09-03 23:05:04', '%P', 'en_NZ'), 'pm', 'post meridiem lower case')

    // en_NZ meridiem lower case
    assert(tz('2000-09-03 08:05:04', '%p', 'en_NZ'), 'AM', 'ante meridiem upper case')
    assert(tz('2000-09-03 23:05:04', '%p', 'en_NZ'), 'PM', 'post meridiem upper case')
})
