require('proof')(24, function (assert) {
    var tz = require('timezone')(require('timezone/en_CA'))

    // en_CA abbreviated months
    assert(tz('2000-01-01', '%b', 'en_CA'), 'Jan', 'Jan')
    assert(tz('2000-02-01', '%b', 'en_CA'), 'Feb', 'Feb')
    assert(tz('2000-03-01', '%b', 'en_CA'), 'Mar', 'Mar')
    assert(tz('2000-04-01', '%b', 'en_CA'), 'Apr', 'Apr')
    assert(tz('2000-05-01', '%b', 'en_CA'), 'May', 'May')
    assert(tz('2000-06-01', '%b', 'en_CA'), 'Jun', 'Jun')
    assert(tz('2000-07-01', '%b', 'en_CA'), 'Jul', 'Jul')
    assert(tz('2000-08-01', '%b', 'en_CA'), 'Aug', 'Aug')
    assert(tz('2000-09-01', '%b', 'en_CA'), 'Sep', 'Sep')
    assert(tz('2000-10-01', '%b', 'en_CA'), 'Oct', 'Oct')
    assert(tz('2000-11-01', '%b', 'en_CA'), 'Nov', 'Nov')
    assert(tz('2000-12-01', '%b', 'en_CA'), 'Dec', 'Dec')

    // ' + name + ' months
    assert(tz('2000-01-01', '%B', 'en_CA'), 'January', 'January')
    assert(tz('2000-02-01', '%B', 'en_CA'), 'February', 'February')
    assert(tz('2000-03-01', '%B', 'en_CA'), 'March', 'March')
    assert(tz('2000-04-01', '%B', 'en_CA'), 'April', 'April')
    assert(tz('2000-05-01', '%B', 'en_CA'), 'May', 'May')
    assert(tz('2000-06-01', '%B', 'en_CA'), 'June', 'June')
    assert(tz('2000-07-01', '%B', 'en_CA'), 'July', 'July')
    assert(tz('2000-08-01', '%B', 'en_CA'), 'August', 'August')
    assert(tz('2000-09-01', '%B', 'en_CA'), 'September', 'September')
    assert(tz('2000-10-01', '%B', 'en_CA'), 'October', 'October')
    assert(tz('2000-11-01', '%B', 'en_CA'), 'November', 'November')
    assert(tz('2000-12-01', '%B', 'en_CA'), 'December', 'December')
})
