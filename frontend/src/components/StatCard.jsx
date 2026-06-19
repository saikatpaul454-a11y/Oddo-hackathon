import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {trend && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            {trend}
          </p>
        )}
      </div>
      <div className={`rounded-xl p-3.5 ${colorClass || 'bg-indigo-50 text-indigo-600'}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

export default StatCard;
