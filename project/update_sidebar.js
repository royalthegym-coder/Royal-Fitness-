const fs = require('fs');
let content = fs.readFileSync('./utils/components/Sidebar.tsx', 'utf8');

const newAdminNav = `  const adminNav = [
    { 
      category: 'Quantum Core', 
      items: [
        { id: 'dashboard', label: 'Command Center', icon: <Cpu className="w-5 h-5 text-cyan-400" /> },
        { id: 'scientificAdmissionForm', label: 'Neural Admission', icon: <Sparkles className="w-5 h-5 text-fuchsia-400" /> },
        { id: 'members', label: 'Member Matrix', icon: <Users className="w-5 h-5 text-indigo-400" /> },
        { id: 'adminAttendance', label: 'Auto Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'staff', label: 'Staff Network', icon: <Network className="w-5 h-5 text-indigo-400" /> },
      ]
    },
    {
      category: 'Synapse Finance',
      items: [
        { id: 'billing', label: 'Billing Engine', icon: <DollarSign className="w-5 h-5 text-emerald-400" /> },
        { id: 'payment', label: 'Quantum Payments', icon: <WalletIcon className="w-5 h-5 text-emerald-400" /> },
        { id: 'expenses', label: 'Expense Tracker', icon: <TrendingUp className="w-5 h-5 text-red-400" /> },
        { id: 'packages', label: 'Neural Packages', icon: <Package className="w-5 h-5 text-amber-400" /> },
      ]
    },
    {
      category: 'AI Bots & Agents',
      items: [
        { id: 'geniusEngine', label: 'AI Engine', icon: <BrainCircuit className="w-5 h-5 text-indigo-400" /> },
        { id: 'aiHealthCoach', label: 'AI Coach Bot', icon: <Bot className="w-5 h-5 text-fuchsia-400" /> },
        { id: 'aiDoctor', label: 'AI Doctor', icon: <Activity className="w-5 h-5 text-cyan-400" /> },
        { id: 'sentinelIntakeBot', label: 'Intake Bot', icon: <MessageCircle className="w-5 h-5 text-emerald-400" /> },
        { id: 'nutritionTracker', label: 'Nutrition AI', icon: <Utensils className="w-5 h-5 text-green-400" /> },
      ]
    },
    {
      category: 'Marketing Nexus',
      items: [
        { id: 'crm', label: 'CRM Matrix', icon: <Users className="w-5 h-5 text-pink-400" /> },
        { id: 'leads', label: 'Lead Generator', icon: <Zap className="w-5 h-5 text-amber-400" /> },
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: <MessageCircle className="w-5 h-5 text-green-400" /> },
        { id: 'socialManager', label: 'Social Sync', icon: <Share2 className="w-5 h-5 text-blue-400" /> }, 
      ]
    },
    {
      category: 'System Health',
      items: [
        { id: 'automationHub', label: 'Automation Hub', icon: <Workflow className="w-5 h-5 text-indigo-400" /> },
        { id: 'security', label: 'Security Layer', icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
        { id: 'settings', label: 'OS Settings', icon: <Settings className="w-5 h-5 text-gray-400" /> },
      ]
    }
  ];`;

const newMemberNav = `  const memberNav = [
    { 
      category: 'Quantum Hub', 
      items: [
        { id: 'dashboard', label: 'Home', icon: <DashboardIcon /> },
        { id: 'profile', label: 'Bio-Profile', icon: <User className="w-5 h-5 text-indigo-400" /> },
        { id: 'dailyProtocol', label: 'Tasks', icon: <CalendarCheck className="w-5 h-5 text-amber-400" /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock className="w-5 h-5 text-cyan-400" /> },
        { id: 'payments', label: 'Payments', icon: <DollarSign className="w-5 h-5 text-green-500" /> },
        { id: 'globalHealthPassport', label: 'Gym ID', icon: <Globe className="w-5 h-5 text-cyan-400" /> }, 
      ]
    },
    {
      category: 'Neural Training',
      items: [
        { id: 'workout', label: 'Workout', icon: <WorkoutIcon /> },
        { id: 'diet', label: 'Diet', icon: <DietIcon /> },
        { id: 'nutritionTracker', label: 'Nutrition AI', icon: <Utensils className="w-5 h-5 text-green-400" /> },
        { id: 'aiFitnessTracker', label: 'AI Progress', icon: <Activity className="w-5 h-5 text-amber-400"/> },
      ]
    },
    {
      category: 'AI Oracle',
      items: [
        { id: 'aiHealthCoach', label: 'AI Coach', icon: <Bot className="w-5 h-5 text-fuchsia-400" /> },
        { id: 'healthMetrics', label: 'Metrics', icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
        { id: 'medicalHub', label: 'Medical Report', icon: <Stethoscope className="w-5 h-5 text-indigo-400" /> },
        { id: 'wearables', label: 'Connect Watch', icon: <SmartWatchIcon className="w-5 h-5 text-amber-400" /> },
      ]
    },
    {
      category: 'Support',
      items: [
        { id: 'aetherCommunity', label: 'Community', icon: <Network className="w-5 h-5 text-indigo-400" /> }, 
        { id: 'helpSupport', label: 'Help Center', icon: <HelpCircle className="w-5 h-5 text-blue-400" /> },
      ]
    }
  ];`;

content = content.replace(/const adminNav = \[[\s\S]*?\];\n\n  const getDaysSinceJoin/m, newAdminNav + '\n\n  const getDaysSinceJoin');
content = content.replace(/const memberNav = \[[\s\S]*?\];\n\n  const navItems/m, newMemberNav + '\n\n  const navItems');

fs.writeFileSync('./utils/components/Sidebar.tsx', content);
