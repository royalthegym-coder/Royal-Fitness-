
import React from 'react';
import { Member } from '../types';
import { INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';
import Card from './common/Card';

const Memberships: React.FC = () => {
  const members: Member[] = INITIAL_MEMBERS;

  const getStatusInfo = (status: Member['status']) => {
    switch (status) {
      case 'Active':
        return { color: 'text-green-400', label: 'Active' };
      case 'Expired':
        return { color: 'text-red-400', label: 'Expired' };
      case 'Inactive':
        return { color: 'text-yellow-400', label: 'Inactive' };
      default:
        return { color: 'text-gray-400', label: 'Unknown' };
    }
  };
  
  const getPackageName = (packageId: number) => {
    return INITIAL_PACKAGES.find(p => p.id === packageId)?.name || 'N/A';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-400 mb-6">Memberships Status</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">Member Name</th>
                <th className="p-3 hidden md:table-cell">Package</th>
                <th className="p-3 hidden sm:table-cell">Join Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const statusInfo = getStatusInfo(member.status);
                return (
                  <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3 font-medium">{member.name}</td>
                    <td className="p-3 hidden md:table-cell">{getPackageName(member.packageId)}</td>
                    <td className="p-3 hidden sm:table-cell">{member.joinDate}</td>
                    <td className={`p-3 font-semibold ${statusInfo.color}`}>{statusInfo.label}</td>
                    <td className="p-3">
                        {member.status === 'Expired' && (
                           <button className="bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-400 transition-colors">
                             Send Reminder
                           </button>
                        )}
                         {member.status === 'Active' && (
                           <button className="bg-green-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-400 transition-colors">
                             View Details
                           </button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Memberships;
