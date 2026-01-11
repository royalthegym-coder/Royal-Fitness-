
import React from 'react';
import { Package } from '../../types';
import { INITIAL_PACKAGES } from '../../constants';
import Card from './common/Card';

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const calculateAnnualPrice = (pkg: Package): number => {
    const discount = 0.80; // 20% discount
    switch (pkg.id) {
        case 1: // Regular Basic
            return (1500 + 11 * 1000) * discount;
        case 2: // Regular Standard
            return (pkg.price * 4) * discount;
        case 3: // Regular Premium
            return (pkg.price * 2) * discount;
        case 4: // Cardio Basic
            return (pkg.price * 12) * discount;
        case 5: // Cardio Standard
            return (pkg.price * 4) * discount;
        case 6: // Cardio Premium
            return (pkg.price * 2) * discount;
        case 7: // Personal Training
            return (pkg.price * 12) * discount;
        default:
            return 0;
    }
};

const PackageCard: React.FC<{ pkg: Package }> = ({ pkg }) => {
    const annualPrice = calculateAnnualPrice(pkg);
    const monthlyEffective = pkg.duration.includes('Month') ? pkg.price : pkg.price / parseInt(pkg.duration);

    return (
        <Card className="flex flex-col border-2 border-gray-700 hover:border-amber-500 transition-all duration-300 transform hover:-translate-y-1 h-full">
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-amber-400">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{pkg.category}</p>
                <div className="my-4">
                    <span className="text-4xl font-extrabold">₹{pkg.price.toLocaleString()}</span>
                    <span className="text-lg font-medium text-gray-400"> / {pkg.duration}</span>
                </div>
                {pkg.details && <p className="text-amber-300 text-sm font-semibold mb-4">{pkg.details}</p>}
                
                <ul className="space-y-3 mb-4">
                    {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <CheckIcon />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-700">
                 <div className="text-center mb-4">
                    <p className="text-lg font-bold">Annual Plan: <span className="text-green-400">₹{annualPrice.toLocaleString()}</span></p>
                    <p className="text-xs text-gray-400">Includes 20% Discount</p>
                </div>
                <button className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors">
                    Choose Plan
                </button>
            </div>
        </Card>
    );
};

const Packages: React.FC = () => {
  const regularPackages = INITIAL_PACKAGES.filter(p => p.category === 'Regular');
  const cardioPackages = INITIAL_PACKAGES.filter(p => p.category === 'Cardio');
  const ptPackages = INITIAL_PACKAGES.filter(p => p.category === 'Personal Training');

  return (
    <div>
        <h1 className="text-3xl font-bold text-amber-400 mb-8">Membership Packages</h1>
        
        <section>
            <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Regular Gym Workout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

        <section className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Cardio Gym Workout</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardioPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

        <section className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-amber-500">Personal Training</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ptPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
        </section>

    </div>
  );
};

export default Packages;
