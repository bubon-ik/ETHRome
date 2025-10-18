import React from 'react';
import Head from 'next/head';
import SimpleSwapInterface from '@/components/SimpleSwapInterface';

const SimpleSwapPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Simple Multi-Token Swap | ETHRome</title>
        <meta name="description" content="Simple multi-token swap interface using 1inch API and wagmi sendCalls" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Simple Multi-Token Swap
            </h1>
            <p className="text-lg text-gray-600">
              Batch swap multiple tokens using 1inch API + wagmi sendCalls
            </p>
          </div>
          
          <SimpleSwapInterface />
        </div>
      </div>
    </>
  );
};

export default SimpleSwapPage;
