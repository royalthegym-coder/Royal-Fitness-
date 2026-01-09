import React, { useState } from 'react';
import { DietPlan } from '../types';
import { INITIAL_DIETS, INITIAL_MEMBERS } from '../constants';
import Card from './common/Card';
import { SparkleIcon } from './icons/SparkleIcon';

const DietPlanCard: React.FC<{ plan: DietPlan }> = ({ plan }) => {
    const getAssignedMemberNames = (memberIds: number[]) => {
        return memberIds.map(id => INITIAL_MEMBERS.find(m => m.id === id)?.name).filter(Boolean).join(', ');
    };

    return (
         <Card className="flex flex-col h-full relative">
             {plan.isNew && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                    <SparkleIcon className="w-3 h-3 mr-1" />
                    AI Generated
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-amber-400">{plan.name}</h3>
                <p className="font-bold text-amber-300 mb-2">{plan.calories} kcal / day</p>
                <p className="text-gray-400 mb-4 text-sm">{plan.description}</p>
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm">Assigned To:</h4>
                    <p className="text-xs text-amber-400">{getAssignedMemberNames(plan.assignedTo) || 'None'}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <button className="text-sm w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                    Edit Plan
                </button>
            </div>
        </Card>
    );
};

const DietPlans: React.FC = () => {
    const [dietPlans, setDietPlans] = useState<DietPlan[]>(INITIAL_DIETS);

    const weightGainPlans = dietPlans.filter(p => p.category === 'Weight Gain');
    const weightLossPlans = dietPlans.filter(p => p.category === 'Weight Loss');
    const maintenancePlans = dietPlans.filter(p => p.category === 'Maintenance');
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-amber-400 mb-8">Diet Plans</h1>
            
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Weight Gain</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weightGainPlans.map(plan => <DietPlanCard key={plan.id} plan={plan} />)}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Weight Loss</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weightLossPlans.map(plan => <DietPlanCard key={plan.id} plan={plan} />)}
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Maintenance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {maintenancePlans.map(plan => <DietPlanCard key={plan.id} plan={plan} />)}
                        <Card className="border-2 border-dashed border-gray-600 flex items-center justify-center hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer min-h-[250px]">
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <p className="mt-2 font-semibold">Create New Plan</p>
                            </div>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DietPlans;
