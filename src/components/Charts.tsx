import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { InventoryRecord, normalizeStatus } from '../types';

const STATUS_COLORS: Record<string, string> = {
  'Deployed': '#34D399',
  'Yet To Deploy': '#FCD34D',
  'In Stock': '#60A5FA',
  'Faulty': '#F87171',
  'Retrieved': '#818CF8',
  'Under Repair': '#C4B5FD',
  'Repaired': '#86EFAC',
  'Cannibalised': '#FDBA74',
  'Test Terminal': '#7DD3FC',
  'Lost': '#A1A1AA',
  'Damaged': '#FCA5A5',
  'Decommissioned': '#D1D5DB',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

interface Props {
  records: InventoryRecord[];
  bgClass?: string;
}

export const StatusChart: React.FC<Props> = ({ records, bgClass }) => {
  const data = Object.entries(
    records.reduce((acc, r) => {
      const status = normalizeStatus(r.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({ status, count }));

  return (
    <div className={`${bgClass || 'bg-white'} rounded-xl shadow-sm border p-5`}>
      <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.status}-${index}`}
                fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const LocationChart: React.FC<Props> = ({ records, bgClass }) => {
  const data = Object.entries(
    records.reduce((acc, r) => {
      if (r.location) acc[r.location] = (acc[r.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className={`${bgClass || 'bg-white'} rounded-xl shadow-sm border p-5`}>
      <h3 className="text-lg font-semibold mb-4">Top Locations</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryChart: React.FC<Props> = ({ records, bgClass }) => {
  const data = Object.entries(
    records.reduce((acc, r) => {
      if (r.category) acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  return (
    <div className={`${bgClass || 'bg-white'} rounded-xl shadow-sm border p-5`}>
      <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="category" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366F1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RegionChart: React.FC<Props> = ({ records, bgClass }) => {
  const data = Object.entries(
    records.reduce((acc, r) => {
      if (r.region) acc[r.region] = (acc[r.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([region, count]) => ({ region, count }));

  return (
    <div className={`${bgClass || 'bg-white'} rounded-xl shadow-sm border p-5`}>
      <h3 className="text-lg font-semibold mb-4">Regional Distribution</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          <p>No region data available. Please import records with region information.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="region" type="category" width={140} />
            <Tooltip />
            <Bar dataKey="count" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
