export * from './scopes';
export * from './temp';

// TODO: remove when frontend refactors
export const tmpRestFix = (serviceName: string) => [
  serviceName.replace(/\./g, '/'),
  serviceName.substring(serviceName.indexOf('.') + 1).replace(/\./g, '/'),
];

export const tableName = (serviceName: string) =>
  serviceName
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
