/**
 * 📊 Settlement Form Component
 * Location: frontend/src/components/SettlementForm.jsx
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import Button from './ButtonSimple';
import FormField from './FormField';

const SettlementForm = ({ 
  contractId, 
  onSubmit, 
  isLoading = false,
  initialData = null 
}) => {
  const [year, setYear] = useState(initialData?.settlement_year || new Date().getFullYear());
  const [date, setDate] = useState(initialData?.settlement_date || new Date().toISOString().split('T')[0]);
  const [charges, setCharges] = useState(initialData?.charges || []);
  const [depositDeductions, setDepositDeductions] = useState(initialData?.deposit_deductions || []);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState({});

  const chargeTypes = ['water', 'electricity', 'gas', 'coproperty'];

  const addChargeLine = () => {
    setCharges([
      ...charges,
      {
        type: chargeTypes[0],
        provisioning_paid: 0,
        actual_cost: 0
      }
    ]);
  };

  const removeChargeLine = (index) => {
    setCharges(charges.filter((_, i) => i !== index));
  };

  const updateChargeLine = (index, field, value) => {
    const newCharges = [...charges];
    newCharges[index] = {
      ...newCharges[index],
      [field]: parseFloat(value) || 0
    };
    setCharges(newCharges);
  };

  const calculateBalance = (line) => {
    return line.actual_cost - line.provisioning_paid;
  };

  const calculateTotals = () => {
    return {
      provisioning_paid: charges.reduce((sum, c) => sum + c.provisioning_paid, 0),
      actual_cost: charges.reduce((sum, c) => sum + c.actual_cost, 0),
      balance: charges.reduce((sum, c) => sum + calculateBalance(c), 0)
    };
  };

  const totals = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!year) newErrors.year = 'Année requise';
    if (!date) newErrors.date = 'Date requise';
    if (charges.length === 0) newErrors.charges = 'Au moins une charge requise';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      contract_id: contractId,
      settlement_year: parseInt(year),
      settlement_date: date,
      charges,
      deposit_deductions: depositDeductions,
      notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Settlement Details */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="font-semibold text-gray-900">Informations Règlement</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Année"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            error={errors.year}
            required
          />
          
          <FormField
            label="Date Règlement"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />
        </div>

        <FormField
          label="Notes"
          type="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes optionnelles..."
          rows={3}
        />
      </div>

      {/* Charges Table */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
            Détail Charges
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={addChargeLine}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter Charge
          </Button>
        </div>

        {errors.charges && (
          <div className="text-red-600 text-sm mb-2">{errors.charges}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left px-2 py-2">Type</th>
                <th className="text-right px-2 py-2">Provisions Payées</th>
                <th className="text-right px-2 py-2">Coûts Réels</th>
                <th className="text-right px-2 py-2">Solde</th>
                <th className="text-center px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge, index) => (
                <tr key={index} className="border-b hover:bg-white">
                  <td className="px-2 py-2">
                    <select
                      value={charge.type}
                      onChange={(e) => updateChargeLine(index, 'type', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    >
                      {chargeTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === 'water' ? '💧 Eau' :
                           type === 'electricity' ? '⚡ Électricité' :
                           type === 'gas' ? '🔥 Gaz' : '🏢 Copropriété'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={charge.provisioning_paid}
                      onChange={(e) => updateChargeLine(index, 'provisioning_paid', e.target.value)}
                      className="border rounded px-2 py-1 w-full text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={charge.actual_cost}
                      onChange={(e) => updateChargeLine(index, 'actual_cost', e.target.value)}
                      className="border rounded px-2 py-1 w-full text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className={`px-2 py-2 text-right font-semibold ${
                    calculateBalance(charge) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {calculateBalance(charge) > 0 ? '+' : ''}{calculateBalance(charge).toFixed(2)}€
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeChargeLine(index)}
                      className="p-1 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-2 bg-white p-3 rounded">
          <div className="flex justify-between text-sm">
            <span>Total Provisions Payées:</span>
            <span className="font-semibold">{totals.provisioning_paid.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Coûts Réels:</span>
            <span className="font-semibold">{totals.actual_cost.toFixed(2)}€</span>
          </div>
          <div className={`flex justify-between text-sm font-bold text-lg ${
            totals.balance > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            <span>Solde Final:</span>
            <span>{totals.balance > 0 ? '+' : ''}{totals.balance.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setCharges([]);
            setYear(new Date().getFullYear());
            setDate(new Date().toISOString().split('T')[0]);
          }}
        >
          Réinitialiser
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Enregistrer Règlement
        </Button>
      </div>
    </form>
  );
};

export default SettlementForm;
