
import React, { memo } from 'react';
import { 
  DashboardIcon, MembersIcon, BillingIcon, WorkoutIcon, DietIcon, 
  ExpensesIcon, PackageIcon, LeadsIcon 
} from './utils/components/icons/NavIcons';
import { WhatsAppIcon } from './utils/components/icons/WhatsAppIcon';
import { ShieldCheckIcon } from './utils/components/icons/ShieldCheckIcon';
import { BrainCircuitIcon } from './utils/components/icons/BrainCircuitIcon';
import { ControlIcon } from './utils/components/icons/ControlIcon';
import { Microscope, Zap, Settings, Command, Activity, Heart, DollarSign, CalendarCheck, Stethoscope, TrendingUp, Cpu, ShieldAlert, MonitorPlay, HelpCircle, ScanFace, Globe, Glasses, Link, Shield, FlaskConical, Clock, Wind, Network, Moon, Eye, Truck, Map, Terminal, Gauge, Share2, Package } from 'lucide-react';
import { GoogleIcon } from './utils/components/icons/GoogleIcon';
import { View } from '../../types';
import { OpenSourceIcon } from './utils/components/icons/OpenSourceIcon';
import { CloudArrowUpIcon } from './utils/components/icons/CloudArrowUpIcon';
import { BugFixIcon } from './utils/components/icons/BugFixIcon';
import { AetherIcon } from './utils/components/icons/AetherIcon';
import { NfcTouchIcon } from './utils/components/icons/SynapseIcons';
import { WalletIcon } from './utils/components/icons/QuantumIcons';
import { BrainWaveIcon } from './utils/components/icons/NeuroIcons';
import { HandshakeIcon } from './utils/components/icons/SocialIcons';
import { DollarSignIcon } from './utils/components/icons/DollarSignIcon';
import { CRMIcon } from './utils/components/icons/CRMSystem';
import { BotIcon } from './utils/components/icons/BotIcon';
import { SmartWatchIcon } from './utils/components/icons/SmartWatchIcon';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  role?: 'admin' | 'member';
}

const Sidebar: React.FC<SidebarProps> = memo(({ currentView, setCurrentView, isOpen, setIsOpen, role = 'admin' }) => {
  
  const adminNav = [
    { 
      category: 'Main Deck (मुख्य)', 
      items: [
        { id: 'dashboard', label: 'Mirror Deck (डैशबोर्ड)', icon: <DashboardIcon /> },
        { id: 'members', label: 'Admission (एडमिशन)', icon: <MembersIcon /> },
        { id: 'billing', label: 'Fee Manager (फीस)', icon: <BillingIcon /> },
        { id: 'payment', label: 'Payment Terminal (भुगतान)', icon: <DollarSignIcon className="text-green-500" /> },
        { id: 'leads', label: 'Future Streams (लीड्स)', icon: <LeadsIcon /> },
        { id: 'staff', label: 'Staff Roster (स्टाफ)', icon: <ShieldCheckIcon className="w-5 h-5 text-indigo-400" /> },
        { id: 'expenses', label: 'Entropy Log (खर्चा)', icon: <ExpensesIcon /> },
      ]
    },
    {
      category: 'Growth Engine (विकास)',
      items: [
        { id: 'socialManager', label: 'Brand Command (सोशल)', icon: <Share2 className="w-5 h-5 text-pink-500" /> }, 
        { id: 'crm', label: 'Smart CRM', icon: <CRMIcon className="w-5 h-5 text-pink-400" /> },
        { id: 'googleBusiness', label: 'Google Command', icon: <GoogleIcon className="w-5 h-5" /> },
        { id: 'whatsapp', label: 'Echo Comms (संदेश)', icon: <WhatsAppIcon className="w-5 h-5" /> },
        { id: 'socialHive', label: 'The Social Hive', icon: <HandshakeIcon className="w-5 h-5 text-orange-400" /> },
        { id: 'visualLaunch', label: 'Holo-Projection (टीवी)', icon: <MonitorPlay className="w-5 h-5 text-cyan-400" /> },
        { id: 'cityHealthMap', label: 'City Health Grid', icon: <Map className="w-5 h-5 text-cyan-400" /> },
      ]
    },
    {
      category: 'Fitness Core (फिटनेस)',
      items: [
        { id: 'workouts', label: 'Master Schedule (शेड्यूल)', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Fuel Alchemy (डाइट)', icon: <DietIcon /> },
        { id: 'packages', label: 'Access Keys (पैकेज)', icon: <PackageIcon /> },
        { id: 'aiFitnessTracker', label: 'AI Fitness Tracker', icon: <Activity className="w-5 h-5 text-amber-400"/> },
      ]
    },
    {
      category: 'Health Intelligence (स्वास्थ्य)',
      items: [
        { id: 'healthEngine', label: 'Bio-Scanner (स्कैनर)', icon: <Microscope className="w-5 h-5 text-green-400" /> },
        { id: 'aetherMed', label: 'Aether-Med (AI Doctor)', icon: <Stethoscope className="w-5 h-5 text-cyan-400" /> },
        { id: 'geniusMode', label: 'Oracle AI (भविष्यवाणी)', icon: <Zap className="w-5 h-5 text-amber-400" /> },
        { id: 'futureOFSAdmin', label: 'Future OFS Core', icon: <ScanFace className="w-5 h-5 text-amber-400" /> },
        { id: 'bioScout', label: 'Bio-Scout Guard', icon: <Shield className="w-5 h-5 text-green-400" /> },
        { id: 'hormonalClock', label: 'Hormonal Clock Bot', icon: <Clock className="w-5 h-5 text-pink-400" /> }, 
        { id: 'metabolicTracker', label: 'Metabolic Tracker', icon: <Wind className="w-5 h-5 text-teal-400" /> }, 
        { id: 'neuroRecovery', label: 'Neuro-Recovery Pods', icon: <Moon className="w-5 h-5 text-indigo-400" /> },
        { id: 'synthesisX', label: 'Synthesis-X (Chemist)', icon: <FlaskConical className="w-5 h-5 text-indigo-400" /> }, 
      ]
    },
    {
      category: 'Sovereign AI (सॉवरेन AI)',
      items: [
        { id: 'royalOvermind', label: 'Royal Overmind', icon: <Globe className="w-5 h-5 text-purple-400" /> },
        { id: 'revenueOracle', label: 'Revenue Oracle', icon: <Eye className="w-5 h-5 text-pink-500" /> }, 
        { id: 'royalSingularity', label: 'Royal Singularity', icon: <Link className="w-5 h-5 text-white animate-pulse" /> },
        { id: 'aetherOmni', label: 'Aether Omni (AR)', icon: <Glasses className="w-5 h-5 text-cyan-400" /> },
        { id: 'aetherReality', label: 'Titan Vision (X-Ray)', icon: <AetherIcon className="w-5 h-5 text-purple-400" /> },
      ]
    },
    {
      category: 'Infrastructure (सिस्टम)',
      items: [
        { id: 'neuralCore', label: 'System Pulse', icon: <BrainCircuitIcon className="w-5 h-5 text-cyan-400" /> },
        { id: 'synapseIoT', label: 'Synapse IoT Nexus', icon: <NfcTouchIcon className="w-5 h-5 text-blue-400" /> },
        { id: 'neuroSync', label: 'Neuro-Sync Core', icon: <BrainWaveIcon className="w-5 h-5 text-indigo-400" /> },
        { id: 'autoupgrade', label: 'Self-Evolve Ops', icon: <CloudArrowUpIcon className="w-5 h-5 text-blue-400" /> },
        { id: 'selfrepair', label: 'Auto-Immunity', icon: <BugFixIcon className="w-5 h-5 text-red-400" /> },
        { id: 'debugEngine', label: 'Cyber-Deck (Debug)', icon: <Terminal className="w-5 h-5 text-green-400" /> },
        { id: 'performance', label: 'Hyper-Telemetry', icon: <Gauge className="w-5 h-5 text-amber-400" /> },
        { id: 'geminiHub', label: 'Sovereign Hub (LLM)', icon: <BrainCircuitIcon className="w-5 h-5 text-cyan-400" /> },
        { id: 'autoProcurement', label: 'Auto-Supply Chain', icon: <Truck className="w-5 h-5 text-amber-500" /> }, 
        { id: 'quantumLedger', label: 'Quantum Ledger', icon: <WalletIcon className="w-5 h-5 text-purple-400" /> },
        { id: 'security', label: 'Security Layer', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
        { id: 'settings', label: 'Configuration', icon: <Settings className="w-5 h-5" /> },
      ]
    }
  ];

  const memberNav = [
    { 
      category: 'Home Base (मुख्य)', 
      items: [
        { id: 'dashboard', label: 'Central Hub (होम)', icon: <DashboardIcon /> },
        { id: 'dailyProtocol', label: 'Today\'s Mission (आज)', icon: <CalendarCheck className="w-5 h-5 text-amber-400" /> },
        { id: 'attendance