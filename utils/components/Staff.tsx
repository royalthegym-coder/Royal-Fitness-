
import React from 'react';
import { Staff as StaffType } from '../../types';
import { INITIAL_STAFF } from '../../constants';
import Card from './common/Card';

const Staff: React.FC = () => {
    const staff: StaffType[] = INITIAL_STAFF;

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Staff Management</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-3">Name</th>
                                <th className="p-3">Role</th>
                                <th className="p-3 hidden md:table-cell">Phone</th>
                                <th className="p-3 hidden sm:table-cell">Salary</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(member => (
                                <tr key={member.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{member.name}</td>
                                    <td className="p-3">{member.role}</td>
                                    <td className="p-3 hidden md:table-cell">{member.phone}</td>
                                    <td className="p-3 hidden sm:table-cell">₹{member.salary.toLocaleString()}</td>
                                    <td className="p-3">
                                        <button className="text-amber-400 hover:text-amber-300">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Staff;
