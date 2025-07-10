import { add, differenceInCalendarDays, differenceInHours, format } from 'date-fns';
import { t } from 'i18next';
import { ChartData } from 'types/chart';
import { randomColor } from './generateRandomColor';
import { Advisor } from 'types/advisor';

export const dateFormatter = (startDate: string, endDate: string, date: string) => {
  return format(new Date(date), startDate === endDate ? 'HH:mm' : 'dd-MM-yyyy');
};

export const getTicks = (startDate: string, endDate: string, start: Date, end: Date, skip: number) => {
  const ticks = [start.getTime()];
  const inDays: boolean = startDate !== endDate;

  const diff = inDays
    ? differenceInCalendarDays(end, start)
    : differenceInHours(new Date(`${startDate} 24:00:00`), new Date(`${endDate} 00:00:00`));
  const inDaysDiff = diff <= 30 ? diff : skip;
  const num = inDays ? inDaysDiff : diff;

  const startUtc = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
  const endUtc = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
  const current = startUtc,
    velocity = Math.round(diff / (num - 1));

  for (let i = 1; i < num; i++) {
    ticks.push(add(current, { days: inDays ? i * velocity : undefined, hours: inDays ? undefined : i }).getTime());
  }

  ticks.push(endUtc.getTime());

  return Array.from(new Set(ticks));
};

export const formatDate = (value: Date, dateFormat?: string) => format(value, dateFormat ?? 'dd-MM-yyyy');

export const formatTimestamp = (timestamp: string) => formatDate(new Date(timestamp), 'dd.MM.yyyy');

export const getColor = (data: ChartData, key: string) => data.colors.find((e: any) => e.id == key)?.color ?? '#FFB511';

export const translateChartKeys = (obj: any, key: string) =>
  Object.keys(obj).reduce(
    (acc, k) =>
      k === key
        ? acc
        : {
            ...acc,
            ...{ [t(`chart.${k}`)]: obj[k] },
          },
    {}
  );

export const chartDateFormat = 'yyyy-MM-dd';

export const chartDataKey = 'dateTime';

export const round = (value: any) => Math.round(Number(value) * 100) / 100;

export const getKeys = (data: any[]) => Array.from(new Set(data.flatMap((obj: any) => Object.keys(obj))));

export const formatTotalPeriodCount = (totalPeriodCounts: Record<string, number>, metric: string) => {
  // !== undefined to support 0 values
  const count = totalPeriodCounts[metric];
  return count !== undefined ? ` (${count})` : '';
};

export const getAdvisorsList = (response: any): Advisor[] => {
  const advisorsList = Array.from(new Set(response.map((advisor: any) => advisor.customerSupportId)))
    .map((id: any) => response.find((e: any) => e.customerSupportId == id))
    .map((e) => {
      return {
        id: e?.customerSupportId ?? '',
        labelKey: e?.customerSupportFullName ?? '',
        color: randomColor(),
        isSelected: true,
      };
    });

  return advisorsList;
};

export const getAdvisorChartData = (response: any, advisors: Advisor[]) => {
  const data = response
    .flat(1)
    .map((entry: any) => ({
      ...translateChartKeys(entry, chartDataKey),
      [chartDataKey]: new Date(entry[chartDataKey]).getTime(),
    }))
    .reduce((a: any, b: any) => {
      const dateRow = a.find((i: any) => i[chartDataKey] === b[chartDataKey]);
      if (dateRow) {
        dateRow[b[t('chart.customerSupportFullName')]] = b[t('chart.count')];
      } else {
        a.push({
          [chartDataKey]: b[chartDataKey],
          [b[t('chart.customerSupportFullName')]]: b[t('chart.count')],
        });
      }
      return a;
    }, [])
    .map((e: any) => {
      const res = { ...e };
      advisors.forEach((i) => {
        if (!(i.labelKey in e)) {
          res[i.labelKey] = 0;
        }
      });
      return res;
    });

  return data;
};
