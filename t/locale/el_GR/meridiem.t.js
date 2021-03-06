require('proof')(4, function (assert) {
    var tz = require('timezone')(require('timezone/el_GR'))

    // el_GR meridiem upper case
    assert(tz('2000-09-03 08:05:04', '%P', 'el_GR'), 'πμ', 'ante meridiem lower case')
    assert(tz('2000-09-03 23:05:04', '%P', 'el_GR'), 'μμ', 'post meridiem lower case')

    // el_GR meridiem lower case
    assert(tz('2000-09-03 08:05:04', '%p', 'el_GR'), 'πμ', 'ante meridiem upper case')
    assert(tz('2000-09-03 23:05:04', '%p', 'el_GR'), 'μμ', 'post meridiem upper case')
})
