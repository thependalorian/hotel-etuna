/**
 * TransactionChart Component
 * 
 * Location: components/transactions/TransactionChart.tsx
 * Purpose: Display transaction chart with weekly filters
 * 
 * Shows line chart with This week vs Last week comparison
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

interface TransactionChartProps {
  thisWeekData?: number[];
  lastWeekData?: number[];
  labels?: string[];
  balance?: number;
  tabType?: 'balance' | 'earnings' | 'spendings';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'yearly') => void;
  selectedWeekFilter?: 'thisWeek' | 'lastWeek';
  onWeekFilterChange?: (filter: 'thisWeek' | 'lastWeek') => void;
}

export default function TransactionChart({
  thisWeekData = [5000, 15000, 10000, 20000, 30000],
  lastWeekData = [8000, 12000, 15000, 18000, 22000],
  labels = ['22', '23', '24', '25', '26'],
  balance = 30000,
  tabType = 'balance',
  onPeriodChange,
  selectedWeekFilter = 'thisWeek',
  onWeekFilterChange,
}: TransactionChartProps) {
  const [selectedFilter, setSelectedFilter] = useState<'thisWeek' | 'lastWeek'>(selectedWeekFilter);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Sync with parent component's filter
  useEffect(() => {
    setSelectedFilter(selectedWeekFilter);
  }, [selectedWeekFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showPeriodDropdown) {
      const timer = setTimeout(() => {
        setShowPeriodDropdown(false);
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showPeriodDropdown]);

  const handleFilterChange = (filter: 'thisWeek' | 'lastWeek') => {
    setSelectedFilter(filter);
    onWeekFilterChange?.(filter);
  };

  // Chart data based on selected filter
  const chartData = {
    labels,
    datasets: [
      {
        data: selectedFilter === 'thisWeek' ? thisWeekData : lastWeekData,
        color: (opacity = 1) => Colors.primary,
        strokeWidth: 2,
      },
    ],
    legend: [selectedFilter === 'thisWeek' ? 'This week' : 'Last week'],
  };

  const chartConfig = {
    backgroundColor: Colors.white,
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => Colors.textSecondary,
    labelColor: (opacity = 1) => Colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: Colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <TouchableWithoutFeedback onPress={() => setShowPeriodDropdown(false)}>
      <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>
          {tabType === 'balance'
            ? 'Total Balance'
            : tabType === 'earnings'
            ? 'Total Earnings'
            : 'Total Spendings'}
        </Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={styles.weeklyButton}
            onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
          >
            <Text style={styles.weeklyButtonText}>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
            </Text>
            <Text style={styles.weeklyButtonIcon}>▼</Text>
          </TouchableOpacity>
          {showPeriodDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedPeriod('weekly');
                  setShowPeriodDropdown(false);
                  onPeriodChange?.('weekly');
                }}
              >
                <Text style={styles.dropdownText}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedPeriod('monthly');
                  setShowPeriodDropdown(false);
                  onPeriodChange?.('monthly');
                }}
              >
                <Text style={styles.dropdownText}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedPeriod('yearly');
                  setShowPeriodDropdown(false);
                  onPeriodChange?.('yearly');
                }}
              >
                <Text style={styles.dropdownText}>Yearly</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.balanceAmount}>N$ {balance.toLocaleString()}</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withDots={true}
          withShadow={false}
          segments={4}
          fromZero={true}
        />
      </View>

      {/* Chart Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'thisWeek' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('thisWeek')}
        >
          <View
            style={[
              styles.filterIndicator,
              selectedFilter === 'thisWeek' && styles.filterIndicatorActive,
            ]}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'thisWeek' && styles.filterTextActive,
            ]}
          >
            This week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'lastWeek' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('lastWeek')}
        >
          <View
            style={[
              styles.filterIndicator,
              selectedFilter === 'lastWeek' && styles.filterIndicatorActive,
            ]}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'lastWeek' && styles.filterTextActive,
            ]}
          >
            Last week
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  periodSelector: {
    position: 'relative',
  },
  weeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
  },
  dropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  weeklyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  weeklyButtonIcon: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButtonActive: {
    // Active state styling handled by indicator
  },
  filterIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  filterIndicatorActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
});
