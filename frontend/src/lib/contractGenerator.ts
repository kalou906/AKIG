/**
 * Contract generation service
 * Handles contract template rendering and PDF generation
 */

import {
  interpolateTemplate,
  extractVariables,
  validateVariables,
  getVariables,
  TemplateVariables,
} from './templateVariables';

export interface GeneratedContract {
  id: string;
  type: string;
  content: string;
  renderedAt: string;
  variables: TemplateVariables;
  isValid: boolean;
}

/**
 * Generate contract from template
 */
export function generateContract(
  template: string,
  contractType: string,
  variables?: TemplateVariables
): GeneratedContract {
  const vars = variables || getVariables();
  const validation = validateVariables(template, vars);
  const content = interpolateTemplate(template, vars);

  return {
    id: `${contractType}_${Date.now()}`,
    type: contractType,
    content,
    renderedAt: new Date().toISOString(),
    variables: vars,
    isValid: validation.valid,
  };
}

/**
 * Convert contract to plain text
 */
export function contractToText(contract: GeneratedContract): string {
  return contract.content;
}

/**
 * Convert contract to HTML
 */
export function contractToHtml(contract: GeneratedContract): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${contract.type}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          line-height: 1.6;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          font-size: 20px;
        }
        .header p {
          margin: 5px 0;
          font-size: 12px;
        }
        .content {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .footer {
          margin-top: 40px;
          font-size: 11px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 15px;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${contract.type}</h1>
        <p>Généré le ${new Date(contract.renderedAt).toLocaleDateString('fr-FR')}</p>
      </div>
      <div class="content">${escapeHtml(contract.content)}</div>
      <div class="footer">
        <p>Document généré automatiquement par AKIG</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate downloadable contract file
 */
export async function downloadContract(
  contract: GeneratedContract,
  format: 'txt' | 'html' = 'txt'
): Promise<void> {
  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'html') {
    content = contractToHtml(contract);
    mimeType = 'text/html';
    extension = 'html';
  } else {
    content = contractToText(contract);
    mimeType = 'text/plain';
    extension = 'txt';
  }

  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${contract.type}_${Date.now()}.${extension}`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Print contract
 */
export function printContract(contract: GeneratedContract): void {
  const printWindow = window.open('', '', 'height=600,width=800');

  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(contractToHtml(contract));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/**
 * Get contract summary
 */
export function getContractSummary(contract: GeneratedContract): {
  type: string;
  length: number;
  variables: string[];
  valid: boolean;
  createdAt: string;
} {
  return {
    type: contract.type,
    length: contract.content.length,
    variables: extractVariables(contract.content),
    valid: contract.isValid,
    createdAt: contract.renderedAt,
  };
}

/**
 * Compare two contracts
 */
export function compareContracts(
  contract1: GeneratedContract,
  contract2: GeneratedContract
): {
  sameType: boolean;
  sameLengthBytes: boolean;
  contentDiff: { added: number; removed: number };
} {
  return {
    sameType: contract1.type === contract2.type,
    sameLengthBytes: contract1.content.length === contract2.content.length,
    contentDiff: {
      added: contract2.content.length - contract1.content.length,
      removed: Math.max(0, contract1.content.length - contract2.content.length),
    },
  };
}
