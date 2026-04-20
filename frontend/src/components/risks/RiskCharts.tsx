/**
 * RiskChart Components
 * Visualize risk distribution using Recharts
 * Requirements: 6.2, 6.3, 6.4
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Risk, RiskCategory } from './RiskDashboard';

// Chart color palettes
const CATEGORY_COLORS: Record<RiskCategory, string> = {
  Technical: '#3B82F6',
  Resource: '#10B981',
  Schedule: '#F59E0B',
  Budget: '#EF4444',
  External: '#8B5CF6',
};

const SEVERITY_COLORS = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
};

interface RiskChartsProps {
  risks: Risk[];
  chartType: 'category' | 'severity' | 'timeline';
  onFilterClick?: (filter: { category?: RiskCategory; severity?: string }) => void;
}

/**
 * CategoryDistributionChart
 * Shows distribution of risks by category
 */
export const CategoryDistributionChart: React.FC<{ risks: Risk[]; onCategoryClick?: (category: RiskCategory) => void }> = ({
  risks,
  onCategoryClick,
}) => {
  // Prepare data
  const categoryData = Object.entries(
    risks.reduce((acc, risk) => {
      acc[risk.category] = (acc[risk.category] || 0) + 1;
      return acc;
    }, {} as Record<RiskCategory, number>)
  ).map(([category, count]) => ({
    name: category,
    value: count,
    color: CATEGORY_COLORS[category as RiskCategory],
  }));

  // Handle click
  const handleClick = (data: any) => {
    if (onCategoryClick && data) {
      onCategoryClick(data.name as RiskCategory);
    }
  };

  if (categoryData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          onClick={handleClick}
          style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * SeverityDistributionChart
 * Shows distribution of risks by severity level
 */
export const SeverityDistributionChart: React.FC<{ risks: Risk[]; onSeverityClick?: (severity: string) => void }> = ({
  risks,
  onSeverityClick,
}) => {
  // Categorize by severity


  // Prepare data
  const severityData = [
    {
      name: 'High',
      count: risks.filter((r) => r.score >= 70).length,
      color: SEVERITY_COLORS.High,
    },
    {
      name: 'Medium',
      count: risks.filter((r) => r.score >= 40 && r.score < 70).length,
      color: SEVERITY_COLORS.Medium,
    },
    {
      name: 'Low',
      count: risks.filter((r) => r.score < 40).length,
      color: SEVERITY_COLORS.Low,
    },
  ];

  // Handle click
  const handleClick = (data: any) => {
    if (onSeverityClick && data) {
      onSeverityClick(data.name);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={severityData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="count"
          fill="#8884d8"
          onClick={handleClick}
          style={{ cursor: onSeverityClick ? 'pointer' : 'default' }}
        >
          {severityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * RiskTimelineChart
 * Shows how risks have evolved over time
 */
export const RiskTimelineChart: React.FC<{ risks: Risk[] }> = ({ risks }) => {
  // Group risks by detection date
  const timelineData = risks
    .reduce((acc, risk) => {
      const date = new Date(risk.detectedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.count += 1;
        existing.totalScore += risk.score;
      } else {
        acc.push({
          date,
          count: 1,
          totalScore: risk.score,
          avgScore: risk.score,
          timestamp: new Date(risk.detectedAt).getTime(),
        });
      }
      return acc;
    }, [] as Array<{ date: string; count: number; totalScore: number; avgScore: number; timestamp: number }>)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((item) => ({
      ...item,
      avgScore: item.totalScore / item.count,
    }));

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No timeline data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={timelineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="count"
          stroke="#3B82F6"
          strokeWidth={2}
          name="Risk Count"
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgScore"
          stroke="#EF4444"
          strokeWidth={2}
          name="Avg Risk Score"
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Main RiskChart Component
 * Wrapper component that renders the appropriate chart based on chartType
 */
const RiskChart: React.FC<RiskChartsProps> = ({ risks, chartType, onFilterClick }) => {
  const handleCategoryClick = (category: RiskCategory) => {
    if (onFilterClick) {
      onFilterClick({ category });
    }
  };

  const handleSeverityClick = (severity: string) => {
    if (onFilterClick) {
      onFilterClick({ severity });
    }
  };

  switch (chartType) {
    case 'category':
      return <CategoryDistributionChart risks={risks} onCategoryClick={handleCategoryClick} />;
    case 'severity':
      return <SeverityDistributionChart risks={risks} onSeverityClick={handleSeverityClick} />;
    case 'timeline':
      return <RiskTimelineChart risks={risks} />;
    default:
      return null;
  }
};

export default RiskChart;
