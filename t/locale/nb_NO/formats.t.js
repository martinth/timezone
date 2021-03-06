require('proof')(5, function (assert) {
    var tz = require('timezone')(require('timezone/nb_NO'))

    // nb_NO date representation
    assert(tz('2000-09-03', '%x', 'nb_NO'), '03. sep. 2000', 'date format')

    // nb_NO time representation
    assert(tz('2000-09-03 08:05:04', '%X', 'nb_NO'), 'kl. 08.05 +0000', 'long time format morning')
    assert(tz('2000-09-03 23:05:04', '%X', 'nb_NO'), 'kl. 23.05 +0000', 'long time format evening')

    // nb_NO date time representation
    assert(tz('2000-09-03 08:05:04', '%c', 'nb_NO'), 'sø. 03. sep. 2000 kl. 08.05 +0000', 'long date format morning')
    assert(tz('2000-09-03 23:05:04', '%c', 'nb_NO'), 'sø. 03. sep. 2000 kl. 23.05 +0000', 'long date format evening')
})
