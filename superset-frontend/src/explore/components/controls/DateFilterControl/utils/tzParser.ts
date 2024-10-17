import moment from 'moment-timezone';
import { formatTimeRange, buildTimeRangeString} from './dateFilterUtils';
import { customTimeRangeDecode } from './dateParser';
import { URL_PARAMS } from 'src/constants';
import { getUrlParam } from 'src/utils/urlUtils';


export const MOMENT_TZ = getUrlParam(URL_PARAMS.dashboardTimezone) || 'UTC';

const MOMENT_DATE_FORMAT = 'YYYY-MM-DD';
const MOMENT_FORMAT = 'YYYY-MM-DD[T]HH:mm:ss';

const parseCommonFrame = (
  timeRangeString: string,
  columnPlaceholder: string = 'col',
  separator: string = ' ≤ col < ',
) => {
  const nowTZ = moment().tz(MOMENT_TZ).format(MOMENT_DATE_FORMAT);

  const [since, until] = timeRangeString.split(separator);

  if (nowTZ === until) {
    return timeRangeString;
  }

  const sinceUTC = moment(since).tz('UTC', true);
  const untilUTC = moment(until).tz('UTC', true);
  const diffInMS = sinceUTC.diff(untilUTC);

  const untilTZ = moment().tz(MOMENT_TZ).format(MOMENT_DATE_FORMAT);
  const sinceTZ = moment(untilTZ).tz(MOMENT_TZ).add(diffInMS, 'milliseconds').format(MOMENT_DATE_FORMAT);

  return formatTimeRange(buildTimeRangeString(sinceTZ, untilTZ), columnPlaceholder);
};

const parseCustomFrame = (
  timeRangeString: string,
  customRangeString: string,
  columnPlaceholder: string = 'col',
  separator: string = ' ≤ col < '
) => {
  const { customRange } = customTimeRangeDecode(customRangeString);

  if (customRange.anchorMode !== 'now'){
    return timeRangeString;
  }

  const [sinceVal, untilVal] = timeRangeString.split(separator);
  
  const sinceUTC = moment(sinceVal).tz('UTC', true).format();
  const untilUTC = moment(untilVal).tz('UTC', true).format();
  
  let since, until;
  //since
  switch (customRange.sinceMode) {
    case 'relative':
      // relative : specific
      since = sinceVal;
      // relative : relative
      if (customRange.untilMode === 'now' || customRange.untilMode === 'relative') {
        since = moment(sinceUTC).tz(MOMENT_TZ).format(MOMENT_FORMAT);
      } else if (customRange.untilMode === 'today') {
        since = moment(sinceUTC).tz(MOMENT_TZ).format(MOMENT_DATE_FORMAT);
      }
      break;
    case 'now':
      since = moment(sinceUTC).tz(MOMENT_TZ).format(MOMENT_FORMAT);
      break;
    case 'today':
      since = moment().tz(MOMENT_TZ).startOf('day').format(MOMENT_DATE_FORMAT);
      break;
    default:
      since = customRange.sinceDatetime;
  }

  switch (customRange.untilMode) {
    case 'relative':
      // specif : relative
      until = untilVal;
      if (customRange.sinceMode === 'now' || customRange.sinceMode === 'relative') {
        until = moment(untilUTC).tz(MOMENT_TZ).format(MOMENT_FORMAT);
      } else if (customRange.sinceMode === 'today') {
        until = moment(untilUTC).tz(MOMENT_TZ).format(MOMENT_DATE_FORMAT);
      }
      break;
    case 'now':
      until = moment(untilUTC).tz(MOMENT_TZ).format(MOMENT_FORMAT);
      break;
    case 'today':
      debugger;
      until = moment().tz(MOMENT_TZ).startOf('day').format(MOMENT_DATE_FORMAT);
      break;
    default:
      until = customRange.untilDatetime;
  }

  return formatTimeRange(buildTimeRangeString(since, until), columnPlaceholder);
};


export const parseTZ = (
  guessedFrame: string,
  timeRangeString: any,
  customRangeString: any = '',
  columnPlaceholder: string = 'col'
) => {
  let value;

  switch (guessedFrame) {
    case 'Common':
      value = parseCommonFrame(timeRangeString, columnPlaceholder);
      break;
    case 'Custom':
      value = parseCustomFrame(timeRangeString, customRangeString, columnPlaceholder);
      break;
    default:
      value = timeRangeString;
  }

  return value
};
