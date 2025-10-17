import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const LimitOrdersPanel: React.FC = () => {
    return (
        <div className="card text-center py-12">
            <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Limit Orders</h3>
            <p className="text-gray-500">Coming soon</p>
        </div>
    );
};

export default LimitOrdersPanel;
