import React from 'react';

export default function Test() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-4">If you can see this clearly, CSS is working!</p>
        
        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-semibold text-blue-900">Blue Section</h2>
            <p className="text-blue-700">This should be visible</p>
          </div>
          
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Test Button
          </button>
          
          <div className="border border-gray-300 p-4 rounded">
            <input 
              type="text" 
              placeholder="Test input"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}



