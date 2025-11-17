/**
 * Contract variables and template interpolation
 * Manages template variables for contract generation
 */

export interface AgencyVariables {
  nom: string;
  rccm: string;
  adresse: string;
  email: string;
  tel_pdg: string;
  tel_dg: string;
  tel_reception: string;
  whatsapp: string;
  code_marchand: string;
  compte_banque: string;
  rib: string;
}

export interface ClientVariables {
  nom: string;
  tel: string;
  adresse: string;
  profession: string;
  cni: string;
  garant: string;
  revenu: string;
}

export interface ContractVariables {
  type: string;
  loyer: string;
  caution: string;
  date_debut: string;
  date_fin: string;
  periodicite: string;
  mode_paiement: string;
}

export interface TemplateVariables {
  akig: AgencyVariables;
  client: ClientVariables;
  contrat: ContractVariables;
  [key: string]: any;
}

/**
 * Template variable store
 * Singleton pattern
 */
class TemplateVariableStore {
  private variables: TemplateVariables = {
    akig: {
      nom: '',
      rccm: '',
      adresse: '',
      email: '',
      tel_pdg: '',
      tel_dg: '',
      tel_reception: '',
      whatsapp: '',
      code_marchand: '',
      compte_banque: '',
      rib: '',
    },
    client: {
      nom: '',
      tel: '',
      adresse: '',
      profession: '',
      cni: '',
      garant: '',
      revenu: '',
    },
    contrat: {
      type: '',
      loyer: '',
      caution: '',
      date_debut: '',
      date_fin: '',
      periodicite: '',
      mode_paiement: '',
    },
  };

  /**
   * Set all variables
   */
  public setAll(variables: Partial<TemplateVariables>): void {
    this.variables = {
      ...this.variables,
      ...variables,
    };
  }

  /**
   * Set agency variables
   */
  public setAgency(agency: Partial<AgencyVariables>): void {
    this.variables.akig = {
      ...this.variables.akig,
      ...agency,
    };
  }

  /**
   * Set client variables
   */
  public setClient(client: Partial<ClientVariables>): void {
    this.variables.client = {
      ...this.variables.client,
      ...client,
    };
  }

  /**
   * Set contract variables
   */
  public setContract(contract: Partial<ContractVariables>): void {
    this.variables.contrat = {
      ...this.variables.contrat,
      ...contract,
    };
  }

  /**
   * Get all variables
   */
  public getAll(): TemplateVariables {
    return JSON.parse(JSON.stringify(this.variables));
  }

  /**
   * Get agency variables
   */
  public getAgency(): AgencyVariables {
    return { ...this.variables.akig };
  }

  /**
   * Get client variables
   */
  public getClient(): ClientVariables {
    return { ...this.variables.client };
  }

  /**
   * Get contract variables
   */
  public getContract(): ContractVariables {
    return { ...this.variables.contrat };
  }

  /**
   * Get a specific variable by dot notation
   * e.g., 'akig.nom' or 'client.tel'
   */
  public get(path: string): string {
    const parts = path.split('.');
    let current: any = this.variables;

    for (const part of parts) {
      current = current?.[part];
    }

    return String(current ?? '');
  }

  /**
   * Reset to default empty state
   */
  public reset(): void {
    this.variables = {
      akig: {
        nom: '',
        rccm: '',
        adresse: '',
        email: '',
        tel_pdg: '',
        tel_dg: '',
        tel_reception: '',
        whatsapp: '',
        code_marchand: '',
        compte_banque: '',
        rib: '',
      },
      client: {
        nom: '',
        tel: '',
        adresse: '',
        profession: '',
        cni: '',
        garant: '',
        revenu: '',
      },
      contrat: {
        type: '',
        loyer: '',
        caution: '',
        date_debut: '',
        date_fin: '',
        periodicite: '',
        mode_paiement: '',
      },
    };
  }
}

// Singleton instance
const store = new TemplateVariableStore();

/**
 * Interpolate template with variables
 * Replaces {{variable}} placeholders with actual values
 * Supports nested variables: {{akig.nom}}, {{client.tel}}, etc.
 */
export function interpolateTemplate(
  template: string,
  variables?: TemplateVariables
): string {
  const vars = variables || store.getAll();

  // Handle nested variable access: {{akig.nom}}, {{client.tel}}, etc.
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmed = path.trim();
    const parts = trimmed.split('.');

    let value: any = vars;

    for (const part of parts) {
      value = value?.[part];
    }

    return String(value ?? `[${trimmed}]`);
  });
}

/**
 * Get list of variables used in a template
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, '').trim());
}

/**
 * Validate if all required variables are present
 */
export function validateVariables(
  template: string,
  variables?: TemplateVariables
): { valid: boolean; missing: string[] } {
  const vars = variables || store.getAll();
  const required = extractVariables(template);
  const missing: string[] = [];

  for (const variable of required) {
    const parts = variable.split('.');
    let value: any = vars;

    for (const part of parts) {
      value = value?.[part];
    }

    if (value === undefined || value === null || value === '') {
      missing.push(variable);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Set template variables store
 */
export function setVariables(variables: Partial<TemplateVariables>): void {
  store.setAll(variables);
}

/**
 * Get template variables store
 */
export function getVariables(): TemplateVariables {
  return store.getAll();
}

/**
 * Set agency variables
 */
export function setAgencyVariables(agency: Partial<AgencyVariables>): void {
  store.setAgency(agency);
}

/**
 * Set client variables
 */
export function setClientVariables(client: Partial<ClientVariables>): void {
  store.setClient(client);
}

/**
 * Set contract variables
 */
export function setContractVariables(contract: Partial<ContractVariables>): void {
  store.setContract(contract);
}

/**
 * Get agency variables
 */
export function getAgencyVariables(): AgencyVariables {
  return store.getAgency();
}

/**
 * Get client variables
 */
export function getClientVariables(): ClientVariables {
  return store.getClient();
}

/**
 * Get contract variables
 */
export function getContractVariables(): ContractVariables {
  return store.getContract();
}

/**
 * Reset variables
 */
export function resetVariables(): void {
  store.reset();
}

/**
 * Get variable store instance
 */
export function getVariableStore(): TemplateVariableStore {
  return store;
}
