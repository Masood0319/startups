"use client"
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Clock, AlertCircle, CheckCircle, Activity, Zap, BarChart3, Calendar, Mail, Phone } from 'lucide-react';
import Navbar from '@/app/components/navbar';

export default function FounderDashboard() {
  const [timeRange, setTimeRange] = useState('month');
  
  const metrics = {
    revenue: { value: '$127.5K', change: 23.5, data: [45, 52, 61, 73, 89, 102, 127.5] },
    mrr: { value: '$42.3K', change: 18.2, data: [28, 31, 35, 38, 40, 41, 42.3] },
    arr: { value: '$507.6K', change: 18.2, data: [336, 372, 420, 456, 480, 492, 507.6] },
    customers: { value: '847', change: 12.3, data: [654, 698, 731, 768, 802, 823, 847] },
    activeUsers: { value: '3,421', change: 8.7, data: [2840, 2965, 3102, 3245, 3312, 3378, 3421] },
    churnRate: { value: '2.3%', change: -15.2, data: [3.2, 3.0, 2.8, 2.7, 2.5, 2.4, 2.3] },
    runway: { value: '18 mo', change: 0, data: [] },
    burnRate: { value: '$35K/mo', change: -8.5, data: [] },
  };

  const recentActivities = [
    { type: 'success', msg: 'New enterprise deal closed - $50K ARR', time: '2h ago' },
    { type: 'alert', msg: 'Server latency increased by 25%', time: '4h ago' },
    { type: 'info', msg: 'Product demo scheduled with Acme Corp', time: '5h ago' },
    { type: 'success', msg: '10 new signups from marketing campaign', time: '1d ago' },
  ];

  const topCustomers = [
    { name: 'Acme Corp', mrr: '$4,500', status: 'healthy', growth: 15 },
    { name: 'TechStart Inc', mrr: '$3,200', status: 'at-risk', growth: -5 },
    { name: 'Global Systems', mrr: '$2,800', status: 'healthy', growth: 22 },
    { name: 'Innovation Labs', mrr: '$2,400', status: 'healthy', growth: 8 },
  ];

  const upcomingMilestones = [
    { title: 'Series A Pitch', date: 'Dec 22', progress: 75 },
    { title: 'Product Launch v2.0', date: 'Jan 5', progress: 60 },
    { title: 'Hit $500K ARR', date: 'Jan 15', progress: 85 },
  ];

  const MetricCard = ({ title, value, change, icon: Icon, trend }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <Icon className={`w-5 h-5 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      {change !== 0 && (
        <div className="flex items-center mt-3">
          {change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
          )}
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(change)}%
          </span>
          <span className="text-sm text-gray-500 ml-1">vs last {timeRange}</span>
        </div>
      )}
      {trend && (
        <div className="mt-3">
          <div className="flex justify-between items-end h-12">
            {trend.map((val, i) => (
              <div key={i} className="flex-1 mx-0.5">
                <div 
                  className="bg-blue-200 rounded-t"
                  style={{ height: `${(val / Math.max(...trend)) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
    <Navbar/>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Founder Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, Sarah! Here's what's happening with your startup.</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Monthly Revenue" 
            value={metrics.revenue.value} 
            change={metrics.revenue.change} 
            icon={DollarSign}
            trend={metrics.revenue.data}
          />
          <MetricCard 
            title="MRR" 
            value={metrics.mrr.value} 
            change={metrics.mrr.change} 
            icon={TrendingUp}
            trend={metrics.mrr.data}
          />
          <MetricCard 
            title="Total Customers" 
            value={metrics.customers.value} 
            change={metrics.customers.change} 
            icon={Users}
            trend={metrics.customers.data}
          />
          <MetricCard 
            title="Churn Rate" 
            value={metrics.churnRate.value} 
            change={metrics.churnRate.change} 
            icon={Activity}
            trend={metrics.churnRate.data}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="ARR" 
            value={metrics.arr.value} 
            change={metrics.arr.change} 
            icon={Target}
          />
          <MetricCard 
            title="Active Users" 
            value={metrics.activeUsers.value} 
            change={metrics.activeUsers.change} 
            icon={Zap}
          />
          <MetricCard 
            title="Runway" 
            value={metrics.runway.value} 
            change={metrics.runway.change} 
            icon={Clock}
          />
          <MetricCard 
            title="Burn Rate" 
            value={metrics.burnRate.value} 
            change={metrics.burnRate.change} 
            icon={BarChart3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {activity.type === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  )}
                  {activity.type === 'alert' && (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  {activity.type === 'info' && (
                    <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.msg}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Milestones</h2>
            <div className="space-y-4">
              {upcomingMilestones.map((milestone, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{milestone.title}</h3>
                    <span className="text-xs text-gray-500">{milestone.date}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{milestone.progress}% complete</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Customers by MRR</h2>
            <div className="space-y-3">
              {topCustomers.map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">{customer.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.mrr} MRR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${customer.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {customer.growth > 0 ? '+' : ''}{customer.growth}%
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      customer.status === 'healthy' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Mail className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Email Investors</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <Calendar className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Schedule Demo</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <BarChart3 className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">View Analytics</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <Phone className="w-6 h-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Call Customer</span>
              </button>
            </div>
            
            {/* Financial Health Score */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Financial Health Score</h3>
                <span className="text-2xl font-bold text-blue-600">87/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '87%' }} />
              </div>
              <p className="text-xs text-gray-600 mt-2">Strong growth trajectory with healthy unit economics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}