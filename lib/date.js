export const dateTimeLocale = {
  ERANAMES: ['Before Christ', 'Anno Domini'],
  ERAS: ['BC', 'AD'],
  AMPMS: ['AM', 'PM'],
  DAY: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ],
  SHORTDAY: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  MONTH: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ],
  SHORTMONTH: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ],
  STANDALONEMONTH: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ],
  FIRSTDAYOFWEEK: 6,
  WEEKENDRANGE: [5, 6],
  fullDate: 'EEEE, MMMM d, y',
  longDate: 'MMMM d, y',
  medium: 'MMM d, y h:mm:ss a',
  mediumDate: 'MMM d, y',
  mediumTime: 'h:mm:ss a',
  short: 'M/d/yy h:mm a',
  shortDate: 'M/d/yy',
  shortTime: 'h:mm a'
};

//                    1        2       3         4          5          6          7          8  9     10      11
const R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;

const DATE_FORMATS_SPLIT = /((?:[^yMLdHhmsaZEwG']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|L+|d+|H+|h+|m+|s+|a|Z|G+|w+))(.*)/;

const DATE_FORMATS = {
  yyyy: dateGetter('FullYear', 4, 0, false, true),
  yy: dateGetter('FullYear', 2, 0, true, true),
  y: dateGetter('FullYear', 1, 0, false, true),
  MMMM: dateStrGetter('Month'),
  MMM: dateStrGetter('Month', true),
  MM: dateGetter('Month', 2, 1),
  M: dateGetter('Month', 1, 1),
  LLLL: dateStrGetter('Month', false, true),
  dd: dateGetter('Date', 2),
  d: dateGetter('Date', 1),
  HH: dateGetter('Hours', 2),
  H: dateGetter('Hours', 1),
  hh: dateGetter('Hours', 2, -12),
  h: dateGetter('Hours', 1, -12),
  mm: dateGetter('Minutes', 2),
  m: dateGetter('Minutes', 1),
  ss: dateGetter('Seconds', 2),
  s: dateGetter('Seconds', 1),
  // while ISO 8601 requires fractions to be prefixed with `.` or `,`
  // we can be just safely rely on using `sss` since we currently don't support single or two digit fractions
  sss: dateGetter('Milliseconds', 3),
  EEEE: dateStrGetter('Day'),
  EEE: dateStrGetter('Day', true),
  a: ampmGetter,
  Z: timeZoneGetter,
  ww: weekGetter(2),
  w: weekGetter(1),
  G: eraGetter,
  GG: eraGetter,
  GGG: eraGetter,
  GGGG: longEraGetter
};

/**
 * @param {Date|number} date
 * @param {string|function} [format]
 * @param {string} [timezone]
 * @param {object} [locale]
 * @returns {string|number|Date|*}
 */
export function dateFilter(date, format, timezone, locale = dateTimeLocale) {
  let text = '';
  let parts = [];
  let fn;
  let match;

  format = format || 'mediumDate';
  if (typeof format !== 'function') {
    format = locale[format] || format;
  }
  if (typeof date === 'string') {
    const NUMBER_STRING = /^-?\d+$/;
    date = NUMBER_STRING.test(date) ? toInt(date) : jsonStringToDate(date);
  }

  if (typeof date === 'number') {
    date = new Date(date);
  }

  if (!isDate(date) || !isFinite(date.getTime())) {
    return date;
  }

  let dateTimezoneOffset = date.getTimezoneOffset();
  if (timezone) {
    dateTimezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
    date = convertTimezoneToLocal(date, timezone, true);
  }

  if (typeof format === 'function') {
    return format(date);
  }

  while (format) {
    // @ts-ignore
    match = DATE_FORMATS_SPLIT.exec(format);
    if (match) {
      parts = concat(parts, match, 1);
      format = parts.pop();
    } else {
      parts.push(format);
      format = null;
    }
  }

  parts.forEach(function(value) {
    fn = DATE_FORMATS[value];
    text += fn
      ? fn(date, locale, dateTimezoneOffset)
      : value === '\'\''
        ? '\''
        : value.replace(/(^'|'$)/g, '').replace(/''/g, '\'');
  });

  return text;
}

/**
 * @param {string} string
 * @returns {Date}
 */
function jsonStringToDate(string) {
  let match;
  if ((match = string.match(R_ISO8601_STR))) {
    const date = new Date(0);
    let tzHour = 0;
    let tzMin = 0;
    const dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear;
    const timeSetter = match[8] ? date.setUTCHours : date.setHours;

    if (match[9]) {
      tzHour = toInt(match[9] + match[10]);
      tzMin = toInt(match[9] + match[11]);
    }
    dateSetter.call(
      date,
      toInt(match[1]),
      toInt(match[2]) - 1,
      toInt(match[3])
    );
    const h = toInt(match[4] || '') - tzHour;
    const m = toInt(match[5] || '') - tzMin;
    const s = toInt(match[6] || '');
    const ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
    timeSetter.call(date, h, m, s, ms);
    return date;
  }
  return new Date(string);
}

/**
 * @param {string} timezone
 * @param {number} fallback
 * @returns {number}
 */
function timezoneToOffset(timezone, fallback) {
  const ALL_COLONS = /:/g;
  timezone = timezone.replace(ALL_COLONS, '');
  const requestedTimezoneOffset =
    Date.parse('Jan 01, 1970 00:00:00 ' + timezone) / 60000;
  return Number.isNaN(requestedTimezoneOffset)
    ? fallback
    : requestedTimezoneOffset;
}

/**
 * @param {Date} date
 * @param {string} timezone
 * @param {boolean} reverse
 * @returns {Date}
 */
function convertTimezoneToLocal(date, timezone, reverse) {
  const dr = reverse ? -1 : 1;
  const dateTimezoneOffset = date.getTimezoneOffset();
  const timezoneOffset = timezoneToOffset(timezone, dateTimezoneOffset);
  return addDateMinutes(date, dr * (timezoneOffset - dateTimezoneOffset));
}

/**
 * @param {Date} date
 * @param {number} minutes
 * @returns {Date}
 */
function addDateMinutes(date, minutes) {
  date = new Date(date.getTime());
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function dateGetter(name, size, offset, trim, negWrap) {
  offset = offset || 0;
  return function(date) {
    let value = date['get' + name]();
    if (offset > 0 || value > -offset) {
      value += offset;
    }
    if (value === 0 && offset === -12) {
      value = 12;
    }
    return padNumber(value, size, trim, negWrap);
  };
}

function dateStrGetter(name, shortForm, standAlone) {
  return function(date, formats) {
    const value = date['get' + name]();
    const propPrefix =
      (standAlone ? 'STANDALONE' : '') + (shortForm ? 'SHORT' : '');
    const get = (propPrefix + name).toUpperCase();

    return formats[get][value];
  };
}

function ampmGetter(date, formats) {
  return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
}

function eraGetter(date, formats) {
  return date.getFullYear() <= 0 ? formats.ERAS[0] : formats.ERAS[1];
}

function longEraGetter(date, formats) {
  return date.getFullYear() <= 0 ? formats.ERANAMES[0] : formats.ERANAMES[1];
}

function timeZoneGetter(date, formats, offset) {
  const zone = -1 * offset;
  let paddedZone = zone >= 0 ? '+' : '';

  paddedZone +=
    padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) +
    padNumber(Math.abs(zone % 60), 2);

  return paddedZone;
}

function weekGetter(size) {
  return function(date) {
    const firstThurs = getFirstThursdayOfYear(date.getFullYear());
    const thisThurs = getThursdayThisWeek(date);

    const diff = +thisThurs - +firstThurs;
    const result = 1 + Math.round(diff / 6.048e8); // 6.048e8 ms per week

    return padNumber(result, size);
  };
}

function getFirstThursdayOfYear(year) {
  // 0 = index of January
  const dayOfWeekOnFirst = new Date(year, 0, 1).getDay();
  // 4 = index of Thursday (+1 to account for 1st = 5)
  // 11 = index of *next* Thursday (+1 account for 1st = 12)
  return new Date(
    year,
    0,
    (dayOfWeekOnFirst <= 4 ? 5 : 12) - dayOfWeekOnFirst
  );
}

function getThursdayThisWeek(datetime) {
  return new Date(
    datetime.getFullYear(),
    datetime.getMonth(),
    // 4 = index of Thursday
    datetime.getDate() + (4 - datetime.getDay())
  );
}

/**
 * @param {number} num
 * @param {number} digits
 * @param {boolean} [trim]
 * @param {boolean} [negWrap]
 * @returns {string}
 */
function padNumber(num, digits, trim, negWrap) {
  const ZERO_CHAR = '0';
  let neg = '';
  if (num < 0 || (negWrap && num <= 0)) {
    if (negWrap) {
      num = -num + 1;
    } else {
      num = -num;
      neg = '-';
    }
  }

  let numStr = '' + num;
  while (numStr.length < digits) {
    numStr = ZERO_CHAR + numStr;
  }
  if (trim) {
    numStr = numStr.substr(numStr.length - digits);
  }
  return neg + numStr;
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function isDate(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}

/**
 * @param {string|null} str
 * @returns {number}
 */
function toInt(str) {
  return str ? parseInt(str, 10) : 0;
}

function concat(array1, array2, index) {
  return array1.concat(Array.prototype.slice.call(array2, index));
}