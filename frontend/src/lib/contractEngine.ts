/**
 * Contract Engine - Advanced template processing
 * Handles complex contract generation with validation, caching, and formatting
 */

export interface ContractEngineOptions {
  strict?: boolean; // Throw error on missing variables
  cache?: boolean; // Cache compiled templates
  throwOnMissing?: boolean; // Throw instead of placeholder
  dateFormat?: string; // Format for date variables
}

export interface VariableContext {
  [key: string]: any;
}

/**
 * Simple variable getter with dot notation support
 */
function getVariable(obj: any, path: string): any {
  const parts = path.split('.');
  let value = obj;

  for (const part of parts) {
    value = value?.[part];
  }

  return value;
}

/**
 * Format value based on type
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('fr-FR');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Parse template and extract variable placeholders
 */
export function parseTemplate(
  template: string
): { variables: string[]; regex: RegExp } {
  const regex = /\{\{\s*([\w\.]+)\s*\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    const variable = match[1];
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return { variables, regex };
}

/**
 * Validate if all required variables are present in context
 */
export function validateVariables(
  template: string,
  context: VariableContext
): { valid: boolean; missing: string[]; extra: string[] } {
  const { variables } = parseTemplate(template);
  const missing: string[] = [];
  const contextKeys = Object.keys(context);

  // Check for missing variables
  for (const variable of variables) {
    const value = getVariable(context, variable);
    if (value === undefined || value === null || value === '') {
      missing.push(variable);
    }
  }

  // Find extra variables in context (not used in template)
  const usedKeys = new Set<string>();
  for (const variable of variables) {
    const parts = variable.split('.');
    usedKeys.add(parts[0]);
  }

  const extra = contextKeys.filter((key) => !usedKeys.has(key));

  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}

/**
 * Compile template to function for faster repeated execution
 */
export function compileTemplate(template: string) {
  const { variables, regex } = parseTemplate(template);

  return (context: VariableContext): string => {
    return template.replace(regex, (_, key) => {
      const value = getVariable(context, key);
      return value !== undefined && value !== null ? formatValue(value) : `[${key}]`;
    });
  };
}

/**
 * Simple contract generation (one-shot)
 */
export function generateContract(
  template: string,
  variables: VariableContext,
  options: ContractEngineOptions = {}
): string {
  const { strict = false, throwOnMissing = false } = options;

  // Validate variables if strict mode
  if (strict) {
    const validation = validateVariables(template, variables);
    if (!validation.valid) {
      const message = `Missing variables: ${validation.missing.join(', ')}`;
      if (throwOnMissing) {
        throw new Error(message);
      }
      console.warn(message);
    }
  }

  // Generate contract
  return template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_, key) => {
    const value = getVariable(variables, key);
    return value !== undefined && value !== null ? formatValue(value) : `[${key}]`;
  });
}

/**
 * Contract engine class for managing multiple templates
 */
export class ContractEngine {
  private templates: Map<string, { template: string; compiled: Function }> =
    new Map();
  private cache: Map<string, string> = new Map();
  private options: Required<ContractEngineOptions>;

  constructor(options: ContractEngineOptions = {}) {
    this.options = {
      strict: options.strict ?? false,
      cache: options.cache ?? true,
      throwOnMissing: options.throwOnMissing ?? false,
      dateFormat: options.dateFormat ?? 'fr-FR',
    };
  }

  /**
   * Register a template
   */
  public registerTemplate(name: string, template: string): void {
    const compiled = compileTemplate(template);
    this.templates.set(name, { template, compiled });
  }

  /**
   * Get registered template
   */
  public getTemplate(name: string): string | undefined {
    return this.templates.get(name)?.template;
  }

  /**
   * Check if template exists
   */
  public hasTemplate(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * Render a template
   */
  public render(
    templateName: string,
    context: VariableContext,
    options?: ContractEngineOptions
  ): string {
    const opts = { ...this.options, ...options };
    const templateData = this.templates.get(templateName);

    if (!templateData) {
      throw new Error(`Template '${templateName}' not found`);
    }

    // Check cache
    if (opts.cache) {
      const cacheKey = `${templateName}:${JSON.stringify(context)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Validate variables if strict
    if (opts.strict) {
      const validation = validateVariables(templateData.template, context);
      if (!validation.valid && opts.throwOnMissing) {
        throw new Error(`Missing variables: ${validation.missing.join(', ')}`);
      }
    }

    // Render using compiled function
    const result = templateData.compiled(context);

    // Cache result
    if (opts.cache) {
      const cacheKey = `${templateName}:${JSON.stringify(context)}`;
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Render directly from template string
   */
  public renderDirect(
    template: string,
    context: VariableContext,
    options?: ContractEngineOptions
  ): string {
    const opts = { ...this.options, ...options };

    if (opts.strict) {
      const validation = validateVariables(template, context);
      if (!validation.valid && opts.throwOnMissing) {
        throw new Error(`Missing variables: ${validation.missing.join(', ')}`);
      }
    }

    return generateContract(template, context, opts);
  }

  /**
   * Get statistics
   */
  public getStats(): {
    templates: number;
    cached: number;
    memoryUsage: number;
  } {
    return {
      templates: this.templates.size,
      cached: this.cache.size,
      memoryUsage: this.cache.size, // Simplified
    };
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear all templates and cache
   */
  public clear(): void {
    this.templates.clear();
    this.cache.clear();
  }

  /**
   * Get all template names
   */
  public getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Validate template
   */
  public validate(
    templateName: string,
    context: VariableContext
  ): { valid: boolean; missing: string[]; extra: string[] } {
    const template = this.templates.get(templateName)?.template;

    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return validateVariables(template, context);
  }
}

/**
 * Global singleton instance
 */
let globalEngine: ContractEngine | null = null;

/**
 * Get or create global engine
 */
export function getEngine(options?: ContractEngineOptions): ContractEngine {
  if (!globalEngine) {
    globalEngine = new ContractEngine(options);
  }
  return globalEngine;
}

/**
 * Reset global engine
 */
export function resetEngine(): void {
  globalEngine = null;
}
