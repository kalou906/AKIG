/**
 * Components Index - Exported UI components
 */

// Re-export commonly used components
// Note: Most components are already in the components directory
// Just export empty stubs if they don't exist

export const Button = require('./Button').default || (() => null);
export const Card = require('./Card').default || (() => null);
export const Alert = require('./Alert').default || (() => null);
export const Badge = require('./Badge').default || (() => null);
export const Modal = require('./Modal').default || (() => null);
export const FormField = require('./FormField').default || (() => null);
export const Table = require('./Table').default || (() => null);

// Default export
export default Card;

