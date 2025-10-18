import React from 'react';
import Head from 'next/head';
// import SimpleSwapInterface from '@/components/SimpleSwapInterface';

const SimpleSwapPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Page Disabled | ETHRome</title>
        <meta name="description" content="This page has been disabled - Simple Swap mode removed" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Simple Swap Mode Removed
            </h1>
            <p className="text-lg text-gray-600">
              This page has been disabled. Only Fusion (gasless) swaps are now available.
            </p>
            <a 
              href="/"
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Main Page (Fusion Only)
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default SimpleSwapPage;
