import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions, ApexAxisChartSeries, ApexNonAxisChartSeries } from 'apexcharts';

export interface ChartProps {
  options: ApexOptions;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  height?: number;
}

export const Chart: React.FC<ChartProps> = ({ options, series, type, height = 350 }) => (
  <ReactApexChart 
    options={{
      ...options,
      chart: {
        ...options.chart,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      colors: ['#7C3AED'],
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      grid: {
        borderColor: '#E5E7EB',
        strokeDashArray: 4,
      },
      xaxis: {
        ...options.xaxis,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        ...options.yaxis,
        labels: {
          formatter: (value) => {
            return `$${value.toFixed(2)}`;
          },
        },
      },
      tooltip: {
        theme: 'light',
        x: {
          show: false,
        },
      },
    }} 
    series={series} 
    type={type} 
    height={height} 
  />
);