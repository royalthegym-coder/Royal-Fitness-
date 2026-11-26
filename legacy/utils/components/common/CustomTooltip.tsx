import React from 'react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="label text-amber-500 dark:text-amber-400 font-bold">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color || pld.fill }} className="text-sm">
            {pld.name}: <span className="font-semibold">{pld.value.toLocaleString()} {pld.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
