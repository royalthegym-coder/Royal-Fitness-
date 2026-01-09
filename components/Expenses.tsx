
import React from 'react';
import { Expense } from '../types';
import { INITIAL_EXPENSES } from '../constants';
import Card from './common/Card';

const Expenses: React.FC = () => {
    const expenses: Expense[] = INITIAL_EXPENSES;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-6">Expense Tracking</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700 text-gray-400">
                                <th className="p-3">Item</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 hidden sm:table-cell">Date</th>
                                <th className="p-3">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 font-medium">{expense.item}</td>
                                    <td className="p-3">{expense.category}</td>
                                    <td className="p-3 hidden sm:table-cell">{expense.date}</td>
                                    <td className="p-3 font-semibold">₹{expense.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-700 font-bold">
                                <td colSpan={3} className="p-3 text-right">Total Expenses</td>
                                <td className="p-3 text-amber-400">₹{totalExpenses.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Expenses;
