import React from 'react';
import { DashboardKPI } from '../types';
import { 
  Package, CheckCircle, Clock, Warehouse, 
  AlertTriangle, FlaskConical, RotateCcw, Wrench
} from 'lucide-react';

interface Props {
  kpis: DashboardKPI;
}

export const KPIcards: React.FC<Props> = ({ kpis }) => {
  const cards = [
    { 
      label: 'Total Inventory', 
      value: kpis.totalInventory, 
      icon: Package, 
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Deployed', 
      value: kpis.totalDeployed, 
      icon: CheckCircle, 
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    { 
      label: 'Yet To Deploy', 
      value: kpis.totalYetToDeploy, 
      icon: Clock, 
      color: 'bg-amber-500',
      textColor: 'text-amber-600'
    },
    { 
      label: 'In Stock', 
      value: kpis.totalInStock, 
      icon: Warehouse, 
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    { 
      label: 'Faulty', 
      value: kpis.totalFaulty, 
      icon: AlertTriangle, 
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    { 
      label: 'Test Terminals', 
      value: kpis.totalTest, 
      icon: FlaskConical, 
      color: 'bg-cyan-500',
      textColor: 'text-cyan-600'
    },
    { 
      label: 'Retrieved', 
      value: kpis.totalRetrieved, 
      icon: RotateCcw, 
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    { 
      label: 'Under Repair', 
      value: kpis.totalUnderRepair, 
      icon: Wrench, 
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`${card.color} bg-opacity-10 p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
