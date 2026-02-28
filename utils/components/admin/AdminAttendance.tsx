import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataProvider';
import Card from '../common/Card';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, XCircle, Clock, Search, UserCheck, UserX, AlertTriangle, Calendar } from 'lucide-react';

const AdminAttendance: React.FC = () => {
    const { members, attendanceRecords, markAttendance, deleteAttendance } = useData();
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const filteredMembers = useMemo(() => {
        return members.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.phone.includes(searchTerm)
        );
    }, [members, searchTerm]);

    const handleMarkAttendance = (memberId: number, status: 'Present' | 'Absent' | 'Late') => {
        markAttendance({
            id: `ATT_${Date.now()}_${memberId}`,
            memberId,
            date: selectedDate,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status,
            method: 'Manual'
        });
        addToast(`Attendance marked as ${status} for Member ID ${memberId}`, "success");
    };

    const getAttendanceStatus = (memberId: number) => {
        return attendanceRecords.find(r => r.memberId === memberId && r.date === selectedDate);
    };

    const stats = useMemo(() => {
        const todayRecords = attendanceRecords.filter(r => r.date === selectedDate);
        return {
            present: todayRecords.filter(r => r.status === 'Present').length,
            absent: todayRecords.filter(r => r.status === 'Absent').length,
            late: todayRecords.filter(r => r.status === 'Late').length,
            total: members.length
        };
    }, [attendanceRecords, selectedDate, members]);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Attendance Register</h1>
                    <p className="text-gray-400 text-sm">Manage daily member attendance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-gray-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-900 border-white/5 p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><UserCheck className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Members</p>
                        <p className="text-2xl font-black text-white">{stats.total}</p>
                    </div>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 text-green-400 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Present</p>
                        <p className="text-2xl font-black text-white">{stats.present}</p>
                    </div>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-500/20 text-red-400 rounded-xl"><XCircle className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Absent</p>
                        <p className="text-2xl font-black text-white">{stats.absent}</p>
                    </div>
                </Card>
                <Card className="bg-gray-900 border-white/5 p-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl"><Clock className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Late</p>
                        <p className="text-2xl font-black text-white">{stats.late}</p>
                    </div>
                </Card>
            </div>

            <Card className="bg-gray-900 border-white/5 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:border-amber-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs font-black text-gray-500 uppercase tracking-widest">
                                <th className="p-4">Member</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => {
                                const record = getAttendanceStatus(member.id);
                                return (
                                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=random`} alt={member.name} className="w-8 h-8 rounded-full" />
                                                <span className="font-bold text-white">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">{member.phone}</td>
                                        <td className="p-4">
                                            {record ? (
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    record.status === 'Present' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                                    record.status === 'Absent' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                                }`}>
                                                    {record.status} ({record.time})
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs italic">Not Marked</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleMarkAttendance(member.id, 'Present')}
                                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                                                title="Mark Present"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleMarkAttendance(member.id, 'Late')}
                                                className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"
                                                title="Mark Late"
                                            >
                                                <Clock className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleMarkAttendance(member.id, 'Absent')}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                title="Mark Absent"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
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

export default AdminAttendance;
