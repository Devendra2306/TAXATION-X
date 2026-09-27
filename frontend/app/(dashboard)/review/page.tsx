"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Edit2, AlertTriangle, ArrowRight, Save, Home, Briefcase, Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ReviewPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any>({
    gross_salary: 0,
    deductions_80c: 0,
    tds_deducted: 0,
    home_loan_interest: 0,
    capital_gains: 0,
    other_income: 0,
    employer_name: '',
    pan: ''
  });

  useEffect(() => {
    // 1. Try to load from localStorage first for immediate display
    const dataStr = localStorage.getItem('parsedTaxData');
    if (dataStr) {
      try {
        setParsedData(JSON.parse(dataStr));
      } catch (e) {}
    }
    
    // 2. Fetch from backend to ensure we have the latest
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setParsedData(data);
          localStorage.setItem('parsedTaxData', JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      localStorage.setItem('parsedTaxData', JSON.stringify(parsedData));
      
      if (token) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        await fetch(`${API_URL}/api/profile`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify(parsedData)
        });
      }
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <PageHeader
        title="Review Tax Profile"
        subtitle="Verify extracted data and add any other sources of income."
        actions={
          <>
            {isEditing ? (
              <button onClick={saveProfile} disabled={isLoading} className="btn-secondary flex items-center gap-2">
                <Save size={16}/> {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                <Edit2 size={16}/> Edit Data
              </button>
            )}
            <Link href="/compare" className="btn-primary flex items-center gap-2">
              Continue to Comparison <ArrowRight size={16} />
            </Link>
          </>
        }
      />

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Salary Information */}
        <div className="space-y-6">
          <div className="card-elevated overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-500" /> Income from Salary
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gross Salary</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.gross_salary} onChange={e => setParsedData({...parsedData, gross_salary: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.gross_salary?.toLocaleString('en-IN') || 0}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">TDS Deducted by Employer</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.tds_deducted} onChange={e => setParsedData({...parsedData, tds_deducted: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.tds_deducted?.toLocaleString('en-IN') || 0}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Deductions Information */}
          <div className="card-elevated overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Chapter VI-A Deductions
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Section 80C (LIC, PPF, ELSS)</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.deductions_80c} onChange={e => setParsedData({...parsedData, deductions_80c: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.deductions_80c?.toLocaleString('en-IN') || 0}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Income Sources */}
        <div className="space-y-6">
          
          {/* House Property */}
          <div className="card-elevated overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Home size={18} className="text-amber-500" /> Income from House Property
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Interest on Home Loan (Section 24b)</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.home_loan_interest || 0} onChange={e => setParsedData({...parsedData, home_loan_interest: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.home_loan_interest?.toLocaleString('en-IN') || 0}</div>
                )}
                <p className="text-xs text-slate-400 mt-1">Maximum ₹2,00,000 for self-occupied property.</p>
              </div>
            </div>
          </div>

          {/* Capital Gains & Other Income */}
          <div className="card-elevated overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-purple-500" /> Other Sources & Capital Gains
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Capital Gains (Stocks, MFs)</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.capital_gains || 0} onChange={e => setParsedData({...parsedData, capital_gains: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.capital_gains?.toLocaleString('en-IN') || 0}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Other Income (FD Interest, Dividends)</label>
                {isEditing ? (
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800" value={parsedData.other_income || 0} onChange={e => setParsedData({...parsedData, other_income: Number(e.target.value)})} />
                ) : (
                  <div className="text-lg font-medium text-slate-800">₹{parsedData.other_income?.toLocaleString('en-IN') || 0}</div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
