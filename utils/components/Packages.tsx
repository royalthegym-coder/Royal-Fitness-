
import React, { useState } from 'react';
import { Package } from '../../types';
import { INITIAL_PACKAGES } from '../../constants';
import Card from './common/Card';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse } from '../../lib/gemini';
import { BotIcon } from './icons/BotIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const calculateAnnualPrice = (pkg: Package): number => {
    const discount = 0.80; // 20% discount
    switch (pkg.id) {
        case 1: return (1500 + 11 * 1000) * discount;
        case 2: return (pkg.price * 4) * discount;
        case 3: return (pkg.price * 2) * discount;
        case 4: return (pkg.price * 12) * discount;
        case 5: return (pkg.price * 4) * discount;
        case 6: return (pkg.price * 2) * discount;
        case 7: return (pkg.price * 12) * discount;
        default: return 0;
    }
};

const PackageCard: React.FC<{ pkg: Package }> = ({ pkg }) => {
    const annualPrice = calculateAnnualPrice(pkg);

    return (
        <Card className="flex flex-col border-2 border-gray-700 hover:border-amber-500 transition-all duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
            <div className="flex-grow relative z-10">
                <h3 className="text-2xl font-bold text-amber-400">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4 bg-gray-800 inline-block px-2 py-1 rounded">{pkg.category}</p>
                <div className="my-4">
                    <span className="text-4xl font-extrabold text-white">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-lg font-medium text-gray-400"> / {pkg.duration}</span>
                </div>
                {pkg.details && <p className="text-amber-300 text-sm font-semibold mb-4">{pkg.details}</p>}
                
                <ul className="space-y-3 mb-4">
                    {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon />
                            <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-700 relative z-10">
                 <div className="text-center mb-4">
                    <p className="text-lg font-bold text-gray-200">Annual Plan: <span className="text-green-400">₹{annualPrice.toLocaleString()}</span></p>
                    <p className="text-[10px] text-gray-500 uppercase">Save 20%</p>
                </div>
                <button className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg">
                    Choose Plan
                </button>
            </div>
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/20"></div>
        </Card>
    );
};

const Packages: React.FC = () => {
  const [packages] = useState(INITIAL_PACKAGES);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  const regularPackages = packages.filter(p => p.category === 'Regular');
  const cardioPackages = packages.filter(p => p.category === 'Cardio');
  const ptPackages = packages.filter(p => p.category === 'Personal Training');

  const handleOptimize = async () => {
      setIsOptimizing(true);
      setOptimizationResult(null);
      
      const prompt = `
        Act as a Gym Business Consultant. Analyze these packages:
        ${JSON.stringify(packages.map(p => ({name: p.name, price: p.price, features: p.features})))}
        
        Suggest 1 strategic price adjustment and 1 new "High Ticket" package idea to increase revenue by 15%.
        Format as HTML bullet points.
      `;

      try {
          const result = await getComplexResponse(prompt);
          setOptimizationResult(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsOptimizing(false);
      }
  };

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div>
                <h1 className="text-3xl font-bold text-amber-400">Membership Packages</h1>
                <p className="text-gray-400 text-sm mt-1">Manage pricing tiers and offerings.</p>
            </div>
            <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center transition-all disabled:opacity-50"
            >
                <SparkleIcon className={`w-5 h-5 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
                {isOptimizing ? 'Analyzing Market...' : 'AI Pricing Optimizer'}
            </button>
        </div>

        {optimizationResult && (
            <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl animate-fade-in">
                <h4 className="flex items-center text-blue-300 font-bold mb-4 text-lg">
                    <BotIcon className="w-6 h-6 mr-2" /> Strategic Recommendations
                </h4>
                <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: optimizationResult.replace(/\n/g, '<br />') }} />
                <button onClick={() => setOptimizationResult(null)} className="mt-4 text-xs text-gray-500 hover:text-white underline">Dismiss</button>
            </div>
        )}
        
        <section>
            <div className="flex items-center mb-6 pb-2 border-b-2 border-amber-500/50">
                <div className="bg-amber-500 w-2 h-8 mr-3 rounded-sm"></div>
                <h2 className="text-2xl font-semibold text-white">Regular Gym Workout</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

        <section>
            <div className="flex items-center mb-6 pb-2 border-b-2 border-blue-500/50">
                <div className="bg-blue-500 w-2 h-8 mr-3 rounded-sm"></div>
                <h2 className="text-2xl font-semibold text-white">Cardio Gym Workout</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardioPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

        <section>
            <div className="flex items-center mb-6 pb-2 border-b-2 border-purple-500/50">
                <div className="bg-purple-500 w-2 h-8 mr-3 rounded-sm"></div>
                <h2 className="text-2xl font-semibold text-white">Personal Training</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ptPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

    </div>
  );
};

export default Packages;
