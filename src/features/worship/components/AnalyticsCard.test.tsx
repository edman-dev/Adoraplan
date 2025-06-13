import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Building, Users, TrendingUp } from 'lucide-react';
import { AnalyticsCard, MetricBadge, QuickStat } from './AnalyticsCard';

describe('AnalyticsCard', () => {
  it('renders basic card with title and value', () => {
    render(
      <AnalyticsCard 
        title="Test Metric" 
        value={42} 
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with description and icon', () => {
    render(
      <AnalyticsCard 
        title="Churches" 
        description="Total church locations"
        value={5}
        icon={Building}
        unit=" locations"
      />
    );

    expect(screen.getByText('Churches')).toBeInTheDocument();
    expect(screen.getByText('Total church locations')).toBeInTheDocument();
    expect(screen.getByText('5 locations')).toBeInTheDocument();
    // Icon should be rendered (Building icon)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays trend information correctly', () => {
    render(
      <AnalyticsCard 
        title="Growth Metric"
        value={100}
        trend="up"
        trendPercentage={15}
        previousValue={85}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('Increased from 85 last period')).toBeInTheDocument();
  });

  it('handles downward trend', () => {
    render(
      <AnalyticsCard 
        title="Declining Metric"
        value={75}
        trend="down"
        trendPercentage={10}
        previousValue={85}
      />
    );

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('Decreased from 85 last period')).toBeInTheDocument();
  });

  it('handles stable trend', () => {
    render(
      <AnalyticsCard 
        title="Stable Metric"
        value={50}
        trend="stable"
        trendPercentage={0}
        previousValue={50}
      />
    );

    expect(screen.getByText('Same as 50 last period')).toBeInTheDocument();
  });

  it('renders progress bar correctly', () => {
    render(
      <AnalyticsCard 
        title="Usage Metric"
        value={3}
        progress={{
          current: 3,
          max: 5,
          label: 'Plan usage'
        }}
      />
    );

    expect(screen.getByText('Plan usage')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    // Progress bar should be rendered
    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('handles unlimited progress correctly', () => {
    render(
      <AnalyticsCard 
        title="Unlimited Metric"
        value={100}
        progress={{
          current: 100,
          max: -1,
          label: 'Unlimited usage'
        }}
      />
    );

    expect(screen.getByText('Unlimited usage')).toBeInTheDocument();
    expect(screen.getByText('100/∞')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(
      <AnalyticsCard 
        title="Success Metric"
        value={100}
        variant="success"
      />
    );

    // Check if success variant class is applied
    const card = document.querySelector('.border-green-200');
    expect(card).toBeInTheDocument();

    rerender(
      <AnalyticsCard 
        title="Warning Metric"
        value={80}
        variant="warning"
      />
    );

    // Check if warning variant class is applied
    const warningCard = document.querySelector('.border-yellow-200');
    expect(warningCard).toBeInTheDocument();

    rerender(
      <AnalyticsCard 
        title="Danger Metric"
        value={100}
        variant="danger"
      />
    );

    // Check if danger variant class is applied
    const dangerCard = document.querySelector('.border-red-200');
    expect(dangerCard).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(
      <AnalyticsCard 
        title="Large Number"
        value={1234567}
      />
    );

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('renders custom children content', () => {
    render(
      <AnalyticsCard 
        title="Custom Content"
        value={42}
      >
        <div data-testid="custom-content">Custom child content</div>
      </AnalyticsCard>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });
});

describe('MetricBadge', () => {
  it('renders label and value correctly', () => {
    render(<MetricBadge label="Active" value={5} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<MetricBadge label="Success" value={100} variant="success" />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('handles string values', () => {
    render(<MetricBadge label="Status" value="Active" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

describe('QuickStat', () => {
  it('renders icon, label, and value', () => {
    render(
      <QuickStat 
        icon={Users}
        label="Team Members"
        value={10}
      />
    );

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    // Icon should be rendered
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays change information for increase', () => {
    render(
      <QuickStat 
        icon={Users}
        label="Growing Metric"
        value="150"
        change={{
          value: 25,
          type: 'increase'
        }}
      />
    );

    expect(screen.getByText('Growing Metric')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('displays change information for decrease', () => {
    render(
      <QuickStat 
        icon={TrendingUp}
        label="Declining Metric"
        value="75"
        change={{
          value: 15,
          type: 'decrease'
        }}
      />
    );

    expect(screen.getByText('Declining Metric')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('displays neutral change', () => {
    render(
      <QuickStat 
        icon={Building}
        label="Stable Metric"
        value="50"
        change={{
          value: 0,
          type: 'neutral'
        }}
      />
    );

    expect(screen.getByText('Stable Metric')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('works without change information', () => {
    render(
      <QuickStat 
        icon={Building}
        label="Simple Metric"
        value="25"
      />
    );

    expect(screen.getByText('Simple Metric')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    // Should not show any percentage
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  it('handles string values correctly', () => {
    render(
      <QuickStat 
        icon={Users}
        label="Status"
        value="Online"
        change={{
          value: 10,
          type: 'increase'
        }}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });
});