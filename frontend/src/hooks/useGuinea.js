/**
 * 🇬🇳 Hook React - Spécificités Guinéennes AKIG
 * 
 * Gestion des devises, secteurs et paiements Guinéens
 */

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((r) => r.json());

/**
 * Hook pour devise GNF
 */
export const useGuineaCurrency = () => {
  const { data, error, isLoading } = useSWR('/api/guinea/currency/info', fetcher);

  const formatGnf = (amount) => {
    if (!amount) return '0 Fr';
    return amount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      .concat(' Fr');
  };

  const convertUsdToGnf = async (usd) => {
    try {
      const response = await fetch('/api/guinea/currency/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'USD', to: 'GNF', amount: usd })
      });
      const result = await response.json();
      return result.data.converted;
    } catch (err) {
      console.error('Conversion error:', err);
      return 0;
    }
  };

  return {
    currencyInfo: data,
    isLoading,
    error,
    formatGnf,
    convertUsdToGnf
  };
};

/**
 * Hook pour secteurs Conakry
 */
export const useGuineaSectors = () => {
  const { data, error, isLoading, mutate } = useSWR('/api/guinea/sectors', fetcher);

  const getSectorById = async (id) => {
    try {
      const response = await fetch(`/api/guinea/sectors/${id}`);
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Fetch sector error:', err);
      return null;
    }
  };

  const recommendSectors = async (criteria) => {
    try {
      const response = await fetch('/api/guinea/sectors/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
      });
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Recommend error:', err);
      return [];
    }
  };

  const filterByPriceLevel = (level) => {
    return data?.filter(s => s.priceLevel === level) || [];
  };

  return {
    sectors: data || [],
    isLoading,
    error,
    getSectorById,
    recommendSectors,
    filterByPriceLevel,
    refetch: mutate
  };
};

/**
 * Hook pour moyens de paiement
 */
export const useGuineanPaymentMethods = () => {
  const { data, error, isLoading } = useSWR('/api/guinea/payments/methods/ui', fetcher);

  const getMethodById = async (id) => {
    try {
      const response = await fetch(`/api/guinea/payments/methods/${id}`);
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Fetch payment method error:', err);
      return null;
    }
  };

  const calculateFees = async (methodId, amount) => {
    try {
      const response = await fetch('/api/guinea/payments/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId, amount })
      });
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Calculate fees error:', err);
      return null;
    }
  };

  const recommendMethods = async (amount) => {
    try {
      const response = await fetch(`/api/guinea/payments/recommended?amount=${amount}`);
      const result = await response.json();
      return result.data;
    } catch (err) {
      console.error('Recommend methods error:', err);
      return [];
    }
  };

  const processPayment = async (methodId, amount, details = {}) => {
    try {
      const response = await fetch('/api/guinea/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methodId, amount, details })
      });
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Process payment error:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    paymentMethods: data || [],
    isLoading,
    error,
    getMethodById,
    calculateFees,
    recommendMethods,
    processPayment
  };
};
