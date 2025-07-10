import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { MdOutlineDownload } from 'react-icons/md';
import { Button, Card, FormSelect, Icon } from '../../components';
import BarGraph from '../BarGraph';
import './MetricsCharts.scss';
import LineGraph from '../LineGraph';
import PieGraph from '../PieGraph';
import { getXlsx } from '../../resources/api-constants';
import { ChartData, ChartType } from '../../types/chart';
import { chartDataKey, formatTimestamp, getKeys } from '../../util/charts-utils';
import { GroupByPeriod } from '../MetricAndPeriodOptions/types';
import { request, Methods } from '../../util/axios-client';
import { saveFile } from 'util/file';

type Props = {
  title: any;
  data: ChartData;
  startDate: string;
  endDate: string;
  unit?: string;
  groupByPeriod: GroupByPeriod;
};

const MetricsCharts = ({ title, data, startDate, endDate, unit, groupByPeriod }: Props) => {
  const { t } = useTranslation();

  const charts: ChartType[] = [
    {
      label: t('chart.barChart'),
      value: 'barChart',
    },
    {
      label: t('chart.pieChart'),
      value: 'pieChart',
    },
    {
      label: t('chart.lineChart'),
      value: 'lineChart',
    },
  ];
  const [selectedChart, setSelectedChart] = useState<string>('barChart');
  const selectedData = selectedChart === 'pieChart' ? (data.distributionData ?? data) : (data.feedBackData ?? data);

  const buildChart = () => {
    if (selectedChart === 'pieChart') {
      return <PieGraph data={selectedData} />;
    } else if (selectedChart === 'lineChart') {
      return (
        <LineGraph
          data={selectedData}
          startDate={startDate}
          endDate={endDate}
          unit={unit}
        />
      );
    } else {
      return (
        <BarGraph
          data={selectedData}
          startDate={startDate}
          endDate={endDate}
          unit={unit}
          groupByPeriod={groupByPeriod}
        />
      );
    }
  };

  const downloadXlsx = async (data: any[] = []) => {
    const modifiedData: any[] = data?.map((item) => {
      const modifiedItem: any = { ...item };
      getKeys(data).forEach((propertyName: any) => {
        if (!(propertyName in modifiedItem)) {
          modifiedItem[propertyName] = 0;
        }
      });
      return modifiedItem;
    });

    const res = await request<
      {
        data: unknown[];
      },
      {
        base64String: string;
      }
    >({
      url: getXlsx(),
      method: Methods.post,
      withCredentials: true,
      data: {
        data: modifiedData?.map((p) => {
          const { [chartDataKey]: originalKey, ...rest } = p;
          return {
            [t(`global.${chartDataKey}`)]: formatTimestamp(originalKey),
            ...rest,
          };
        }),
      },
    });

    await saveFile(
      res.base64String,
      'metrics.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  return (
    <Card
      header={
        <div className="container">
          <div className="title">
            <h3>
              {t(title)}{' '}
              {startDate !== endDate
                ? `${formatTimestamp(startDate)} - ${formatTimestamp(endDate)}`
                : formatTimestamp(startDate)}
            </h3>
          </div>
          <div className="other_content">
            <Button
              appearance="text"
              style={{ marginRight: 15 }}
              onClick={() => {
                downloadXlsx(data.feedBackData ? data.feedBackData?.chartData : data.chartData);
              }}
            >
              <Icon
                icon={<MdOutlineDownload />}
                size="small"
              />
              {t('feedback.xlsx')}
            </Button>
            <FormSelect
              name={''}
              label={''}
              defaultValue={'barChart'}
              options={charts}
              onSelectionChange={(value) => setSelectedChart(value?.value ?? 'barChart')}
            />
          </div>
        </div>
      }
    >
      <div className="charts_wrapper">
        {buildChart()}
      </div>
    </Card>
  );
};

export default MetricsCharts;
