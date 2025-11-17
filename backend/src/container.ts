import { SolvencyService } from './services/solvency/SolvencyService';
import { SolvencyCalculator } from './services/solvency/SolvencyCalculator';
import { SolvencyRepository } from './services/solvency/SolvencyRepository';
import { SolvencyCache } from './services/solvency/SolvencyCache';
import { SolvencyMetrics } from './services/solvency/SolvencyMetrics';

const calculator = new SolvencyCalculator();
const repository = new SolvencyRepository();
const cache = new SolvencyCache();
const metrics = new SolvencyMetrics();

export const solvencyService = new SolvencyService(
  calculator,
  repository,
  cache,
  metrics
);
