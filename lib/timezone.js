!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () {
  var __slice = [].slice, __push = [].push;

  function die () {
    console.log.apply(console, __slice.call(arguments, 0));
    return process.exit(1);
  };

  function say () { return console.log.apply(console, __slice.call(arguments, 0)) }

  var fills = { "_": "       ", "0": "00000000" };

  var FORMATTER = /^(.*?)%(?:([-0_^]?)|(:{0,3}))?(.)(.*)$/;
  //(?=[z$])

  function format (posix, rest) {
    var wallclock = new Date(convertToWallclock(this, posix)), value, output = [], f, style, transform, match;
    while (rest.length) {
      if (match = FORMATTER.exec(rest)) {
        if (f = this[match[4]]) {
          value = f.call(this, wallclock, posix, (match[3] || "").length);
          if (f.pad && match[2] != "-") {
            fill = fills[f.style || match[2]] || fills["0"];
            value = (fill + value).slice(-f.pad)
          }
          if (match[2] == "^") {
            value = value.toUpperCase();
          }
          if (match[1]) {
            output.push(match[1]);
          }
          output.push(value);
        } else {
          output.push("%", match[4]);
        }
        rest = match[5];
      } else {
        output.push(rest);
        rest = "";
      }
    }
    return output.join("");
  };

  function makeDate (request, date) {
    var posix, z, i, I;
    if (~(z = date.indexOf('+')) || ~(z = date.indexOf('-'))) {
      date[z] += 1;
      posix = true;
    } else {
      date[z = date.length] = "+1"; 
    }
    for (i = 0; i < 11; i++) {
      date[i] = parseInt(date[i] || 0, 10);
    }
    --date[1];
    date = Date.UTC.apply(Date.UTC, date.slice(0, z)) + date[z] * date[z + 1] * 36e5 + date[z + 2] * 6e4 + date[z + 3] * 1e3;
    return posix ? date : convertToPOSIX(request, date);
  }

  function parse (request, pattern) {
    var parts = pattern.split(/T|\s/), date = [], match;
    if (0 < parts.length && parts.length < 3) {
      if (match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts[0])) {
        __push.apply(date, match.slice(1, 4));
        parts.shift();
      } else {
        __push.apply(date, request.convert([ request.clock(), "%Y-%m-%d" ]).split(/-/));
      }
      if (parts[0]) {
        if (match = /^(\d{2}):(\d{2})(?::(\d{2})(\.(\d+))?)?(Z|(([+-])(\d{2}(:\d{2}){0,2})))?$/.exec(parts[0])) {
          __push.apply(date, match.slice(1, 4));
          __push.call(date, match[5] || 0);
          if (match[7]) {
            __push.call(date, match[8]);
            __push.apply(date, match[9].split(/:/));
          } else if (match[6]) {
            __push.call(date, "+");
          }
        } else return;
      }
      return makeDate(request, date);
    }
  }

  var ABBREV = "Sun Mon Tue Wed Thu Fri Sat".split(/\s/);

  function actualize (entry, rule, year, saved) {
    time = rule.time * 6e4;
    var date = /^(?:(\d+)|last(\w+)|(\w+)>=(\d+))$/.exec(rule.day);
    var fields;
    if (date[1]) {
      fields = new Date(Date.UTC(year, rule.month, parseInt(date[1], 10)));
    } else if (date[2]) {
      for (var i = 0, stop = ABBREV.length; i < stop; i++)
        if (ABBREV[i] === date[2]) break;
      // Remember that month is zero for Date.UTC.
      var day = new Date(Date.UTC(year, (rule.month + 1) % 12, 1) - 1).getUTCDate();
      // Asia/Amman springs forward at 24:00. We calculate the day without the
      // hour, so the hour doesn't push the day into tomorrow. If you're tempted
      // to create the full date in the loop, Amman says no.
      while ((fields = new Date(Date.UTC(year, rule.month, day))).getUTCDay() != i) day--;
    } else {
      var min = parseInt(date[4], 10);
      for (var i = 0, stop = ABBREV.length; i < stop; i++)
        if (ABBREV[i] === date[3]) break;
      day = 1;
      for (;;) {
        fields = new Date(Date.UTC(year, rule.month, day));
        if (fields.getUTCDay() === i && fields.getUTCDate() >= min) break;
        day++;
      }
    }

    var save = rule.save * 6e4;

    var offset = entry.offset;

    var sortable = fields.getTime();

    var actualized =  {
      clock: rule.clock,
      entry: entry,
      sortable: sortable,
      rule:rule,
      year: year,
      save: save,
      offset: offset
    };

    // TODO Why is `saved` 0?
    actualized[actualized.clock] = fields.getTime() + time;
    
    switch (actualized.clock) {
    case "standard":
      var copy = [];
      for (var key in rule) copy[key] = rule[key];
      copy.time = copy.time + (copy.saved / 6e4);
      copy.clock = "wallclock";
      return actualize(entry, copy, year, saved);
    case "posix":
      actualized.wallclock = actualized.posix + entry.offset + rule.saved;
    case "wallclock":
      actualized.posix = actualized.wallclock - entry.offset - rule.saved;
    }

    return actualized;
  }

  function getYear (time) { return new Date(time).getUTCFullYear() }

  function applicable (entry, rules, actualized, time, clock) {
    var last, i, I, j, year = getYear(time);
    for (j = year + 1; j >= year - 1; --j) {
      for (i = 0, I = rules.length; i < I; i++) {
          if (rules[i].from <= j && j <= rules[i].to) {
            actualized.push(actualize(entry, rules[i], j, true));
          } else if (rules[i].to < j) {
            last = rules[i].to;
            break;
        }
      }
    }
    return last;
  }

  function find (request, clock, time) {
    var i, I, entry, year = getYear(time), found, zone = request[request.zone], actualized = [], to, abbrevs;
    for (i = 0, I = zone.length; i < I; i++) if (zone[i][clock] <= time) break;
    entry = zone[i];
    if (typeof entry.rules == "string") {
      rules = request[entry.rules];
      to = applicable(entry, rules, actualized, time, clock);
      if (to != null) applicable(entry, rules, actualized, Date.UTC(to, 5, 1), "wallclock");
      if (actualized.length) {
        actualized.sort(function (a, b) { return a.sortable - b.sortable });
        for (i = 0, I = actualized.length; i < I; i++) {
          if (time >= actualized[i][clock] && actualized[i][actualized[i].clock] > entry[actualized[i].clock]) found = actualized[i];
        }
      }
    }
    if (found) {
      if (!entry.format) {
        die(request.zone, entry);
      }
      if (abbrevs = /^(.*)\/(.*)$/.exec(entry.format)) {
        found.abbrev = abbrevs[found.save != 0 ? 2 : 1];
      } else {
        found.abbrev = entry.format.replace(/%s/, found.rule.letter);
      }
    }
    return found || entry;
  }

  function convertToWallclock (request, posix) {
    if (request.zone == "UTC") return posix;
    request.entry = find(request, "posix", posix);
    return posix + request.entry.offset + request.entry.save;
  };

  function convertToPOSIX (request, wallclock) {
    if (request.zone == "UTC") return wallclock;

    var entry, diff;
    request.entry = entry = find(request, "wallclock", wallclock);
    diff = wallclock - entry.wallclock;

    return 0 < diff && diff < entry.save ? null : wallclock - entry.offset - entry.save;
  };

  var UNITS = "sunday|monday|tuesday|wednesday|thursday|friday|saturday|year|month|day|hour|minute|second|milli|millisecond"
    , UNIT_RE = new RegExp("^\\s*([+-])(\\d+)\\s+(" + UNITS + ")s?\\s*$", "i")
    , TIME = [ 36e5, 6e4, 1e3, 1, 1 ]
    ;

  UNITS = UNITS.split("|");

  function parseAdjustment (pattern) {
    var match = UNIT_RE.exec(pattern);
    return match && function (request, posix) { return adjust(request, posix, match[1], match[2], match[3]) }
  };

  function adjust (request, posix, sign, count, unit) {
    var increment = parseInt(sign + 1)
      , offset = parseInt(count, 10) * increment
      , index = UNITS.indexOf(unit.toLowerCase())
      , date
      ;
    if (index > 9) {
      posix += offset * TIME[index - 10];
    } else {
      date = new Date(convertToWallclock(request, posix));
      if (index < 7) {
        while (offset != 0) {
          date.setUTCDate(date.getUTCDate() + increment);
          if (date.getUTCDay() == index) offset -= increment;
        }
      } else if (index == 7) {
        date.setUTCFullYear(date.getUTCFullYear() + offset);
      } else if (index == 8) {
        date.setUTCMonth(date.getUTCMonth() + offset);
      } else {
        date.setUTCDate(date.getUTCDate() + offset);
      }
      if ((posix = convertToPOSIX(request, date.getTime())) == null) {
        posix = convertToPOSIX(request, date.getTime() + 864e5 * increment) - 864e5 * increment;
      }
    }
    return posix;
  };

  function convert (splat) {
    if (splat.length == 0) return this.clock();

    var i, I, adjustment, argument, date, posix, type
      , request = Object.create(this)
      , adjustments = []
      , index = 0
      ;

    while (splat.length) {
      argument = splat.shift();
      type = typeof argument;
      if (type == "number" && index == 0) {
        request.date = argument;
      } else if (type == "string") {
        if (~argument.indexOf("%")) {
          request.format = argument;
        } else if (/^\w{2}_\w{2}$/.test(argument)) {
          request.locale = argument;
        } else if (adjustment = parseAdjustment(argument)) {
          adjustments.push(adjustment);
        } else if (request[argument]) {
          request.zone = argument;
        } else if (index == 0) {
          request.date = argument;
        }
      } else if (type == "function") {
        argument.call(request);
      } else if (Array.isArray(argument)) {
        if (index == 0 && typeof argument[0] == "number") {
          request.date = argument;
        } else {
          splat.unshift.apply(splat, argument);
        }
      } else if (type == "object") {
        if (/^\w{2}_\w{2}$/.test(argument.name)) {
          request[argument.name] = argument;
        } else if (argument.z) {
          for (var key in argument.z.zones) request[key] = argument.z.zones[key];
          for (var key in argument.z.rules) request[key] = argument.z.rules[key];
        }
      }
      index++;
    }

    if ((date = request.date) != null) {
      if (request.locale && !request[request.locale]) throw new Error("unknown locale");

      if (typeof date == "string") {
        if ((posix = parse(request, date)) == null) {
          throw new Error("invalid date");
        }
      } else if (typeof date == "number") {
        posix = date;
      } else if (Array.isArray(date)) {
        posix = makeDate(request, date);
      }

      for (i = 0, I = adjustments.length; i < I; i++) {
        posix = adjustments[i](request, posix);
      }

      return request.format ?  format.call(request, posix, request.format) : posix;
    }

    return function() { return convert.call(request, __slice.call(arguments, 0)) };
  };

  var context =
    { zone: "UTC"
    , entry: { abbrev: "UTC", offset: 0 }
    , clock: function () { return (+new Date()) }
    , convert: convert
    , d: function(date) { return date.getUTCDate() }
    , m: function(date) { return date.getUTCMonth() + 1 }
    , Y: function(date) { return date.getUTCFullYear() }
    , F: function(date, posix) { return this.convert([ posix, "%Y-%m-%d" ]) }
    , H: function(date) { return date.getUTCHours() }
    , M: function(date) { return date.getUTCMinutes() }
    , s: function(date) { return Math.floor(date.getTime() / 1000) }
    , S: function(date) { return date.getUTCSeconds() }
    , N: function(date) { return (date.getTime() % 1000) * 1000000 }
    , R: function(date, posix) { return this.convert([ posix, "%H:%M" ]) }
    , T: function(date, posix) { return this.convert([ posix, "%H:%M:%S" ]) }
    , z: function(date, posix, delimiters) {
        var offset = this.entry.offset + this.entry.save
          , seconds = Math.abs(offset / 1000), parts = [ 60, 60, 60 ], part, i, z;
        for (i = parts.length - 1; i > -1; i--) {
          part = parts[i];
          parts[i] = (fills[0] + (seconds % part)).slice(-2);
          seconds -= seconds % part;
          seconds /= part;
        }
        if (delimiters) {
          if (delimiters == 3) {
            z = parts.join(":").replace(/:00$/, "").replace(/:00$/, "");
          } else {
            z = parts.slice(0, delimiters + 1).join(":");
          }
        } else {
          z = parts.slice(0, 2).join("");
        }
        return (offset < 0 ? "-" : "+") + z;
      }
    , Z: function(date) { return this.entry.abbrev }
    , ".": function(date) { return date.getTime() % 1000 }
    , "%": function(date) { return "%" }
    , "n": function(date) { return "\n" }
    , "t": function(date) { return "\t" }
    , "$": function (date, posix, delimiters) {
        return this.entry.offset == 0 ? "Z" : delimiters ? this.z(date, posix, 2).replace(/:00$/, "") : this.z(date, posix, 1)
      }
    /*
    , "@": function (date, posix) { return this.convert([ posix, "%F %T%$" ]) }
    , "#": function (date, posix) { return this.convert([ posix, "%FT%T.%.%:$" ]) }
    */
    };

  context.d.pad = 2;
  context.m.pad = 2;
  context.H.pad = 2;
  context.M.pad = 2;
  context.S.pad = 2;
  context.N.pad = 9;
  context["."].pad = 3;

  return function () { return convert.call(context, __slice.call(arguments, 0)) }
});