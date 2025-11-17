import React, { useState } from 'react';
import {
  generateContract,
  downloadContract,
  printContract,
  getContractSummary,
} from '../lib/contractGenerator';
import {
  setAgencyVariables,
  setClientVariables,
  setContractVariables,
} from '../lib/templateVariables';
import { FormField, FormGroup, FormActions } from './FormField';

interface ContractGeneratorProps {
  template: string;
  contractType: string;
}

/**
 * ContractGenerator component
 * Form to collect variables and generate contracts
 */
export function ContractGenerator({
  template,
  contractType,
}: ContractGeneratorProps): React.ReactElement {
  const [agencyNom, setAgencyNom] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyTel, setAgencyTel] = useState('');

  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientProfession, setClientProfession] = useState('');

  const [contratLoyer, setContratLoyer] = useState('');
  const [contratDateDebut, setContratDateDebut] = useState('');
  const [contratDateFin, setContratDateFin] = useState('');

  const [generated, setGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');

      // Set variables
      setAgencyVariables({
        nom: agencyNom,
        email: agencyEmail,
        tel_reception: agencyTel,
      });

      setClientVariables({
        nom: clientNom,
        tel: clientTel,
        adresse: clientAdresse,
        profession: clientProfession,
      });

      setContractVariables({
        loyer: contratLoyer,
        date_debut: contratDateDebut,
        date_fin: contratDateFin,
      });

      // Generate contract
      const contract = generateContract(template, contractType);

      if (!contract.isValid) {
        setError('Certaines variables ne sont pas remplies');
        setIsLoading(false);
        return;
      }

      // Download
      await downloadContract(contract, 'html');
      setGenerated(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Générateur de Contrat</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {generated && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Contrat généré avec succès
        </div>
      )}

      <FormGroup>
        <h3 className="font-semibold mb-3">Infos Agence</h3>
        <FormField
          label="Nom de l'agence"
          value={agencyNom}
          onChange={setAgencyNom}
          required
        />
        <FormField
          label="Email"
          value={agencyEmail}
          onChange={setAgencyEmail}
          type="email"
          required
        />
        <FormField
          label="Téléphone"
          value={agencyTel}
          onChange={setAgencyTel}
          type="tel"
          required
        />
      </FormGroup>

      <FormGroup>
        <h3 className="font-semibold mb-3">Infos Client</h3>
        <FormField
          label="Nom complet"
          value={clientNom}
          onChange={setClientNom}
          required
        />
        <FormField
          label="Téléphone"
          value={clientTel}
          onChange={setClientTel}
          type="tel"
          required
        />
        <FormField
          label="Adresse"
          value={clientAdresse}
          onChange={setClientAdresse}
          required
        />
        <FormField
          label="Profession"
          value={clientProfession}
          onChange={setClientProfession}
        />
      </FormGroup>

      <FormGroup>
        <h3 className="font-semibold mb-3">Détails Contrat</h3>
        <FormField
          label="Loyer"
          value={contratLoyer}
          onChange={setContratLoyer}
          required
        />
        <FormField
          label="Date de début"
          value={contratDateDebut}
          onChange={setContratDateDebut}
          type="date"
          required
        />
        <FormField
          label="Date de fin"
          value={contratDateFin}
          onChange={setContratDateFin}
          type="date"
          required
        />
      </FormGroup>

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="btn bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium"
        >
          {isLoading ? '⟳ Génération...' : '✓ Générer Contrat'}
        </button>
      </div>
    </div>
  );
}
