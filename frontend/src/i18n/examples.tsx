/**
 * Exemple d'intégration i18n complète
 * Démonstration de toutes les fonctionnalités
 */

import React, { useState } from 'react';
import { useI18n, useLanguage, useDateFormatter, useNumberFormatter, useMessages, useValidationMessages } from './hooks';
// @ts-ignore - Components will be added
import { LanguageSelector } from './components/LanguageSelector';
import * as i18nUtils from './utils';

/**
 * Exemple 1: Component avec traduction simple
 */
export function PaymentsList() {
  const { t } = useI18n('payments');
  
  return (
    <section>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <table>
        <thead>
          <tr>
            <th>{t('list.columns.id')}</th>
            <th>{t('list.columns.tenant')}</th>
            <th>{t('list.columns.amount')}</th>
            <th>{t('list.columns.status')}</th>
            <th>{t('list.columns.due_date')}</th>
          </tr>
        </thead>
      </table>
    </section>
  );
}

/**
 * Exemple 2: Component avec gestion de langue
 */
export function LanguageSwitcher() {
  const { language, setLanguage, isRTL, getAvailableLanguages } = useLanguage();
  
  return (
    <div style={{ direction: isRTL() ? 'rtl' : 'ltr' }}>
      <h2>Changer de langue</h2>
      <p>Langue actuelle: <strong>{language.toUpperCase()}</strong></p>
      
      {getAvailableLanguages().map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          style={{
            fontWeight: language === lang.code ? 'bold' : 'normal',
            backgroundColor: language === lang.code ? '#007bff' : '#f0f0f0',
            color: language === lang.code ? 'white' : 'black',
          }}
        >
          {lang.nativeName}
        </button>
      ))}
      
      <LanguageSelector variant="icons" />
    </div>
  );
}

/**
 * Exemple 3: Component avec formatage date et devise
 */
interface InvoiceProps {
  invoice: {
    id: string;
    date: Date | string;
    amount: number;
    clientName: string;
    tenant_name?: string;
    tenant_email?: string;
    description?: string;
  };
}

export function Invoice({ invoice }: InvoiceProps) {
  const { formatDate, formatDateTime } = useDateFormatter();
  const { formatCurrency, formatNumber, formatPercent } = useNumberFormatter();
  const { t } = useI18n('payments');
  
  const totalTax = invoice.amount * 0.2; // 20% TVA
  const totalWithTax = invoice.amount + totalTax;
  
  return (
    <div>
      <h2>{t('receipt.title')}</h2>
      
      <table>
        <tbody>
          <tr>
            <td>{t('receipt.number')}:</td>
            <td>{invoice.id}</td>
          </tr>
          <tr>
            <td>{t('receipt.date')}:</td>
            <td>{formatDate(invoice.date)}</td>
          </tr>
          <tr>
            <td>{t('receipt.tenant')}:</td>
            <td>{invoice.tenant_name}</td>
          </tr>
          <tr>
            <td>{t('receipt.amount')}:</td>
            <td>{formatCurrency(invoice.amount)}</td>
          </tr>
          <tr>
            <td>TVA (20%):</td>
            <td>{formatCurrency(totalTax)}</td>
          </tr>
          <tr style={{ fontWeight: 'bold' }}>
            <td>Total:</td>
            <td>{formatCurrency(totalWithTax)}</td>
          </tr>
          <tr>
            <td>Pourcentage:</td>
            <td>{formatPercent(0.2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Exemple 4: Component avec validation et erreurs
 */
export function PaymentForm() {
  const [formData, setFormData] = useState({ email: '', phone: '', amount: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { getErrorMessage } = useValidationMessages();
  const { t } = useI18n('payments');
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = getErrorMessage('required');
    } else if (!formData.email.includes('@')) {
      newErrors.email = getErrorMessage('email');
    }
    
    if (!formData.phone) {
      newErrors.phone = getErrorMessage('required');
    }
    
    if (!formData.amount) {
      newErrors.amount = getErrorMessage('required');
    } else if (isNaN(Number(formData.amount))) {
      newErrors.amount = getErrorMessage('number');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      alert('Success! Payment submitted.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>{t('form.title')}</h2>
      
      <div>
        <label>{t('form.tenant_id')}:</label>
        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
      </div>
      
      <div>
        <label>{t('form.amount')}:</label>
        <input type="text" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
        {errors.amount && <span style={{ color: 'red' }}>{errors.amount}</span>}
      </div>
      
      <button type="submit">{t('form.submit')}</button>
    </form>
  );
}

/**
 * Exemple 5: Component avec messages contextuels
 */
export function Dashboard() {
  const { success, deleted, confirmDelete } = useMessages();
  const { language } = useLanguage();
  const { t } = useI18n();
  
  const [showNotification, setShowNotification] = useState('');
  
  const handleDelete = () => {
    if (window.confirm(confirmDelete())) {
      setShowNotification(deleted());
      setTimeout(() => setShowNotification(''), 3000);
    }
  };
  
  return (
    <div>
      <h1>{t('common:dashboard')}</h1>
      <p>Langue: {language}</p>
      
      {showNotification && <div style={{ background: '#d4edda', padding: '10px' }}>{showNotification}</div>}
      
      <button onClick={handleDelete}>Supprimer</button>
    </div>
  );
}

/**
 * Exemple 6: Utilisation des utilitaires directement
 */
export function UtilitiesDemo() {
  return (
    <div>
      <h2>Utilities Demo</h2>
      
      <p>
        <strong>Traduction directe:</strong> {i18nUtils.t('common:app_name')} {/* "AKIG" */}
      </p>
      
      <p>
        <strong>Langue courante:</strong> {i18nUtils.getCurrentLanguage()}
      </p>
      
      <p>
        <strong>Langues disponibles:</strong> {i18nUtils.getAvailableLanguages().join(', ')}
      </p>
      
      <p>
        <strong>Est RTL:</strong> {i18nUtils.isRTL() ? 'Oui' : 'Non'}
      </p>
      
      <p>
        <strong>Direction du texte:</strong> {i18nUtils.getTextDirection()}
      </p>
      
      <p>
        <strong>Date formatée:</strong> {i18nUtils.formatDateByLanguage(new Date())}
      </p>
      
      <p>
        <strong>Devise formatée:</strong> {i18nUtils.formatCurrencyByLanguage(1250)}
      </p>
      
      <p>
        <strong>Nombre formaté:</strong> {i18nUtils.formatNumberByLanguage(1234.567, undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

/**
 * Exemple 7: Application complète
 */
export default function CompleteDemo() {
  const { isRTL } = useLanguage();
  
  return (
    <div style={{ direction: isRTL() ? 'rtl' : 'ltr', padding: '20px' }}>
      <LanguageSwitcher />
      <hr />
      
      <PaymentsList />
      <hr />
      
      <Invoice invoice={{
        id: 'INV-001',
        date: new Date(),
        clientName: 'Jean Dupont',
        tenant_name: 'Jean Dupont',
        amount: 1250,
      }} />
      <hr />
      
      <PaymentForm />
      <hr />
      
      <Dashboard />
      <hr />
      
      <UtilitiesDemo />
    </div>
  );
}
