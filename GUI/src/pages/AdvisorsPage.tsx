import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OptionsPanel, { Option } from '../components/MetricAndPeriodOptions';
import MetricsCharts from '../components/MetricsCharts';
import { MetricOptionsState } from '../components/MetricAndPeriodOptions/types';
import {
  chartDataKey,
  formatDate,
  getAdvisorChartData,
  getAdvisorsList,
  translateChartKeys,
} from '../util/charts-utils';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  getAvgCsaPresent,
  getAvgPickTime,
  getChatForwards,
  getCsaAvgChatTime,
  getCsaChatsTotal,
} from '../resources/api-constants';
import { Methods, request } from '../util/axios-client';
import withAuthorization, { ROLES } from '../hoc/with-authorization';
import { ChartData } from 'types/chart';
import { usePeriodStatisticsContext } from 'hooks/usePeriodStatisticsContext';

const AdvisorsPage: React.FC = () => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<ChartData>({
    chartData: [],
    colors: [],
  });
  const [currentMetric, setCurrentMetric] = useState('');
  const [currentConfigs, setCurrentConfigs] = useState<MetricOptionsState>();
  const [unit, setUnit] = useState('');
  const advisors = useRef<any[]>([]);
  const [advisorsList, setAdvisorsList] = useState<any[]>([]);
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  const [advisorsMetrics, setAdvisorsMetrics] = useState<Option[]>([
    {
      id: 'chat_forwards',
      labelKey: 'advisors.chat_forwards',
      subOptions: [
        { id: 'receivedChats', labelKey: 'advisors.forwards.from_csa', color: '#FFB511' },
        { id: 'forwardedChats', labelKey: 'advisors.forwards.to_csa', color: '#ED7D31' },
        { id: 'forwardedExternally', labelKey: 'advisors.forwards.to_other', color: '#8BB4D5' },
      ],
      unit: t('units.chats') ?? 'chats',
    },
    {
      id: 'avg_pick_time',
      labelKey: 'advisors.avg_pick_time',
      unit: t('units.minutes') ?? 'minutes',
    },
    {
      id: 'avg_present_csa',
      labelKey: 'advisors.avg_present_csa',
      unit: t('units.counselors') ?? 'counselors',
    },
    {
      id: 'num_chats_csa',
      labelKey: 'advisors.num_chats_csa',
      unit: t('units.chats') ?? 'chats',
    },
    {
      id: 'avg_chat_time_csa',
      labelKey: 'advisors.avg_chat_time_csa',
      unit: t('units.minutes') ?? 'minutes',
    },
  ]);
  const { setPeriodStatistics } = usePeriodStatisticsContext();

  useEffect(() => {
    setAdvisorsList(advisors.current);
  }, [advisorsList]);

  useEffect(() => {
    setPeriodStatistics(chartData, unit);
  }, [chartData, unit]);

  useEffect(() => {
    if (currentConfigs) {
      configsSubject.next(currentConfigs);
    }
  }, [currentConfigs]);

  const [configsSubject] = useState(() => new Subject());
  useEffect(() => {
    const subscription = configsSubject
      .pipe(
        distinctUntilChanged(),
        debounceTime(300),
        switchMap((config: any) => {
          switch (config.metric) {
            case 'chat_forwards':
              return fetchChatsForwards(config);
            case 'avg_pick_time':
              return fetchAverageChatPickUpTime(config);
            case 'avg_present_csa':
              return fetchAveragePresentCsas(config);
            case 'num_chats_csa':
              return fetchTotalCsaChats(config);
            case 'avg_chat_time_csa':
              return fetchAverageCsaChatTime(config);
            default:
              return fetchChatsForwards(config);
          }
        })
      )
      .subscribe((chartData: any) => setChartData(chartData));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchChatsForwards = async (config: any) => {
    let chartData = {};
    setShowSelectAll(false);
    try {
      const result: any = await request({
        url: getChatForwards(),
        method: Methods.post,
        withCredentials: true,
        data: {
          metric: config?.groupByPeriod ?? 'day',
          start_date: config?.start,
          end_date: config?.end,
        },
      });

      const res = result.response.map((entry: any) => ({
        ...translateChartKeys(entry, chartDataKey),
        [chartDataKey]: new Date(entry[chartDataKey]).getTime(),
      }));

      const requiredKeys = [chartDataKey, ...config.options];

      const response = res.map((item: any) => {
        const returnValue: any = {};
        requiredKeys.forEach((key: string) => {
          if (key !== chartDataKey) {
            const chartKey = t(`chart.${key}`);
            returnValue[chartKey] = item[chartKey];
          } else {
            returnValue[key] = item[key];
          }
        });

        return returnValue;
      });

      chartData = {
        chartData: response,
        colors: advisorsMetrics[0].subOptions!.map(({ id, color }) => {
          return {
            id: t(`chart.${id}`),
            color,
          };
        }),
      };
    } catch (_) {
      console.error(_)
    }
    return chartData;
  };

  const fetchAverageChatPickUpTime = async (config: any) => {
    setShowSelectAll(false);
    let chartData = {};
    try {
      const result: any = await request({
        url: getAvgPickTime(),
        method: Methods.post,
        withCredentials: true,
        data: {
          metric: config?.groupByPeriod ?? 'day',
          start_date: config?.start,
          end_date: config?.end,
        },
      });

      const response = result.response.map((entry: any) => ({
        ...translateChartKeys(entry, chartDataKey),
        [chartDataKey]: new Date(entry[chartDataKey]).getTime(),
      }));

      chartData = {
        chartData: response,
        colors: [{ id: 'Average (Min)', color: '#FFB511' }],
        minPointSize: 3,
      };
    } catch (_) {
      console.error(_)
    }
    return chartData;
  };

  const fetchAveragePresentCsas = async (config: any) => {
    setShowSelectAll(false);
    let chartData = {};
    try {
      const result: any = await request({
        url: getAvgCsaPresent(),
        method: Methods.post,
        withCredentials: true,
        data: {
          metric: config?.groupByPeriod ?? 'day',
          start_date: config?.start,
          end_date: config?.end,
        },
      });

      const response = result.response.map((entry: any) => ({
        ...translateChartKeys(entry, chartDataKey),
        [chartDataKey]: new Date(entry[chartDataKey]).getTime(),
      }));

      chartData = {
        chartData: response,
        colors: [{ id: 'Average', color: '#FFB511' }],
        minPointSize: 3,
      };
    } catch (_) {
      console.error(_)
    }
    return chartData;
  };

  const fetchTotalCsaChats = async (config: any) => {
    setShowSelectAll(true);
    let chartData = {};
    try {
      const excluded_csas = advisors.current.map((e) => e.id).filter((e) => !config?.options.includes(e));
      const result: any = await request({
        url: getCsaChatsTotal(),
        method: Methods.post,
        withCredentials: true,
        data: {
          metric: config?.groupByPeriod ?? 'day',
          start_date: config?.start,
          end_date: config?.end,
          excluded_csas: (excluded_csas.length ?? 0) > 0 ? excluded_csas : [''],
        },
      });

      const res = result.response;

      const advisorsList = getAdvisorsList(res);

      const updatedMetrics = [...advisorsMetrics];
      updatedMetrics[3].subOptions = advisorsList;
      advisors.current = advisorsList;
      setAdvisorsMetrics(updatedMetrics);
      setAdvisorsList(advisors.current);

      chartData = {
        chartData: getAdvisorChartData(res, advisorsList),
        colors: advisorsMetrics[3].subOptions!.map(({ labelKey, color }) => {
          return {
            id: labelKey,
            color,
          };
        }),
      };
    } catch (_) {
      console.error(_)
    }
    return chartData;
  };

  const fetchAverageCsaChatTime = async (config: any) => {
    setShowSelectAll(true);
    let chartData = {};
    try {
      const excluded_csas = advisors.current.map((e) => e.id).filter((e) => !config?.options.includes(e));
      const result: any = await request({
        url: getCsaAvgChatTime(),
        method: Methods.post,
        withCredentials: true,
        data: {
          metric: config?.groupByPeriod ?? 'day',
          start_date: config?.start,
          end_date: config?.end,
          excluded_csas: (excluded_csas.length ?? 0) > 0 ? excluded_csas : [''],
        },
      });

      const res = result.response;

      const advisorsList = getAdvisorsList(res);

      const updatedMetrics = [...advisorsMetrics];
      updatedMetrics[4].subOptions = advisorsList;
      advisors.current = advisorsList;
      setAdvisorsMetrics(updatedMetrics);
      setAdvisorsList(advisors.current);

      chartData = {
        chartData: getAdvisorChartData(res, advisorsList),
        colors: advisorsMetrics[4].subOptions!.map(({ labelKey, color }) => {
          return {
            id: labelKey,
            color,
          };
        }),
        minPointSize: 3,
      };
    } catch (_) {
      console.error(_)
    }
    return chartData;
  };

  const configsAreEqual = (a: MetricOptionsState, b: MetricOptionsState | undefined) => {
    const { options: _, ...restA } = a ?? {};
    const { options: __, ...restB } = b ?? {};
    return JSON.stringify(restA) === JSON.stringify(restB);
  };

  return (
    <>
      <h1>{t('menu.advisors')}</h1>
      <OptionsPanel
        metricOptions={advisorsMetrics}
        enableSelectAll={showSelectAll}
        dateFormat="yyyy-MM-dd"
        onChange={(config) => {
          if (!configsAreEqual(config, currentConfigs)) {
            setCurrentConfigs(config);
            configsSubject.next(config);
            if (currentMetric != `advisors.${config.metric}`) {
              advisors.current = [];
            }
            setCurrentMetric(`advisors.${config.metric}`);
            setAdvisorsList([]);

            const selectedOption = advisorsMetrics.find((x) => x.id === config.metric);
            if (!selectedOption) return;
            setUnit(selectedOption?.unit ?? 'chats');
          }
        }}
      />
      <MetricsCharts
        title={currentMetric}
        data={chartData}
        startDate={currentConfigs?.start ?? formatDate(new Date(), 'yyyy-MM-dd')}
        endDate={currentConfigs?.end ?? formatDate(new Date(), 'yyyy-MM-dd')}
        groupByPeriod={currentConfigs?.groupByPeriod ?? 'day'}
        unit={unit}
      />
    </>
  );
};

export default withAuthorization(AdvisorsPage, [ROLES.ROLE_ADMINISTRATOR, ROLES.ROLE_ANALYST]);
