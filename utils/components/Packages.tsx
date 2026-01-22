
import React, { useState } from 'react';
import { Package } from '../../types';
import { INITIAL_PACKAGES } from '../../constants';
import Card from './common/Card';
import { SparkleIcon } from './icons/SparkleIcon';
import { getComplexResponse } from '../../lib/gemini';
import { BotIcon } from './icons/BotIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { EditIcon } from './icons/EditIcon';
import Modal from './common/Modal';

// Predefined list of all possible features
const AVAILABLE_FEATURES = [
    "Gym Access", 
    "Cardio Zone",
    "Personal Training", 
    "Diet Plan", 
    "Steam & Sauna", 
    "Group Classes", 
    "Locker Access", 
    "Pool Access",
    "24/7 Access", 
    "Massage Therapy",
    "Yoga Sessions",
    "Crossfit Zone"
];

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const getAnnualPackageForCategory = (category: string) => {
    return INITIAL_PACKAGES.find(p => p.category === category && p.duration.includes('12 Months'));
}

const PackageCard: React.FC<{ pkg: Package; onEditFeatures: (pkg: Package) => void }> = ({ pkg, onEditFeatures }) => {
    // Logic: If package is < 12 months, suggest the annual (Diamond) plan price for comparison.
    // If it IS the 12 month plan, highlight it as best value.
    const isAnnual = pkg.duration.includes('12 Months');
    const annualPackage = !isAnnual ? getAnnualPackageForCategory(pkg.category) : null;
    
    // Calculate potential savings or just show the annual price
    const annualPriceDisplay = annualPackage ? annualPackage.price : null;

    return (
        <Card className="flex flex-col border-2 border-gray-700 hover:border-amber-500 transition-all duration-300 transform hover:-translate-y-1 h-full relative overflow-hidden group">
            <div className="flex-grow relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-amber-400">{pkg.name}</h3>
                        <p className="text-gray-400 text-sm mb-4 bg-gray-800 inline-block px-2 py-1 rounded">{pkg.category}</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEditFeatures(pkg); }}
                        className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
                        title="Customize Features"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="my-4">
                    <span className="text-4xl font-extrabold text-white">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-lg font-medium text-gray-400"> / {pkg.duration}</span>
                </div>
                {pkg.details && <p className="text-amber-300 text-sm font-semibold mb-4 bg-amber-900/20 p-2 rounded border border-amber-500/20">{pkg.details}</p>}
                
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
                 {annualPriceDisplay && (
                     <div className="text-center mb-4 bg-gray-800/50 p-2 rounded-lg border border-gray-600">
                        <p className="text-sm font-medium text-gray-300">Switch to Annual (Diamond): <span className="text-green-400 font-bold">₹{annualPriceDisplay.toLocaleString()}</span></p>
                        <p className="text-[10px] text-green-400 uppercase font-bold">Save 20%</p>
                    </div>
                 )}
                 {isAnnual && (
                     <div className="text-center mb-4">
                        <p className="text-sm font-bold text-green-400 flex justify-center items-center bg-green-900/20 py-1 rounded">
                            <SparkleIcon className="w-4 h-4 mr-1" /> Best Value Plan
                        </p>
                    </div>
                 )}
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
  const [packages, setPackages] = useState(INITIAL_PACKAGES);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);
  
  // Feature Editing State
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

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

  const handleEditFeatures = (pkg: Package) => {
      setEditingPackage(pkg);
  };

  const toggleFeature = (feature: string) => {
      if (!editingPackage) return;

      const currentFeatures = editingPackage.features;
      const newFeatures = currentFeatures.includes(feature)
          ? currentFeatures.filter(f => f !== feature)
          : [...currentFeatures, feature];

      // Update Local Editing State
      setEditingPackage({ ...editingPackage, features: newFeatures });

      // Update Global State
      setPackages(prev => prev.map(p => 
          p.id === editingPackage.id ? { ...p, features: newFeatures } : p
      ));
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
                <h2 className="text-2xl font-semibold text-white">Regular Gym Packages</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onEditFeatures={handleEditFeatures} />)}
            </div>
        </section>

        <section>
            <div className="flex items-center mb-6 pb-2 border-b-2 border-blue-500/50">
                <div className="bg-blue-500 w-2 h-8 mr-3 rounded-sm"></div>
                <h2 className="text-2xl font-semibold text-white">Cardio Gym Packages</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardioPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onEditFeatures={handleEditFeatures} />)}
            </div>
        </section>

        <section>
            <div className="flex items-center mb-6 pb-2 border-b-2 border-purple-500/50">
                <div className="bg-purple-500 w-2 h-8 mr-3 rounded-sm"></div>
                <h2 className="text-2xl font-semibold text-white">Personal Training</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ptPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} onEditFeatures={handleEditFeatures} />)}
            </div>
        </section>

        {/* Feature Customization Modal */}
        <Modal 
            isOpen={!!editingPackage} 
            onClose={() => setEditingPackage(null)} 
            title={editingPackage ? `Customize: ${editingPackage.name}` : 'Customize Features'}
        >
            <div className="space-y-4">
                <p className="text-gray-400 text-sm">Select the amenities included in this package.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {AVAILABLE_FEATURES.map((feature) => {
                        const isSelected = editingPackage?.features.includes(feature);
                        return (
                            <div 
                                key={feature} 
                                onClick={() => toggleFeature(feature)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                    isSelected 
                                    ? 'bg-amber-900/20 border-amber-500/50 text-amber-100' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                <span className="text-sm font-medium">{feature}</span>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-500'}`}>
                                    {isSelected && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button 
                        onClick={() => setEditingPackage(null)} 
                        className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default Packages;
