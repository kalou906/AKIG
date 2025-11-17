import React, { useState } from 'react';
import { api } from '../api';

export default function Payments() {
  const [form, setForm] = useState({ contract_id:'', paid_at:'', amount:'', method:'cash' });
  const [receiptId, setReceiptId] = useState('');

  const submit = async () => {
    if (!form.contract_id || !form.paid_at || !form.amount) {
      alert('Remplis tous les champs');
      return;
    }
    const { data } = await api.post('/payments', form);
    setReceiptId(data.id);
    setForm({ contract_id:'', paid_at:'', amount:'', method:'cash' });
  };

  const downloadReceipt = () => {
    if (!receiptId) return;
    window.open(`http://localhost:4000/api/payments/${receiptId}/receipt.pdf`, '_blank');
  };

  return (
    <div>
      <h3>Paiements</h3>
      <div style={{ display:'grid', gap:8, maxWidth:420, marginBottom: 16 }}>
        <input type="number" placeholder="Contract ID" value={form.contract_id} onChange={e=>setForm({ ...form, contract_id:e.target.value })}/>
        <label>Date de paiement:</label>
        <input type="date" value={form.paid_at} onChange={e=>setForm({ ...form, paid_at:e.target.value })}/>
        <input type="number" placeholder="Montant (GNF)" value={form.amount} onChange={e=>setForm({ ...form, amount:e.target.value })}/>
        <label>Méthode:</label>
        <select value={form.method} onChange={e=>setForm({ ...form, method:e.target.value })}>
          <option value="cash">Cash</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank">Bank</option>
        </select>
        <button onClick={submit}>Enregistrer paiement</button>
        <button onClick={downloadReceipt} disabled={!receiptId}>Télécharger reçu PDF</button>
      </div>
      {!receiptId && <p>Après enregistrement, le bouton de reçu s'activera.</p>}
    </div>
  );
}