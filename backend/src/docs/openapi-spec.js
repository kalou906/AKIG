/**
 * OpenAPI 3.0 Specification for AKIG API
 * Complete API documentation with all endpoints, schemas, and security definitions
 */

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'AKIG API',
    description: 'Production-ready API for contract management, payments, and exports',
    version: '1.0.0',
    contact: {
      name: 'AKIG Support',
      email: 'support@akig.dev',
      url: 'https://akig.dev'
    },
    license: {
      name: 'Proprietary',
      url: 'https://akig.dev/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:4002/api',
      description: 'Development server',
      variables: {}
    },
    {
      url: 'https://staging-api.akig.dev/api',
      description: 'Staging server'
    },
    {
      url: 'https://api.akig.dev/api',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management'
    },
    {
      name: 'Users',
      description: 'User profile and management'
    },
    {
      name: 'Contracts',
      description: 'Contract management and operations'
    },
    {
      name: 'Payments',
      description: 'Payment processing and tracking'
    },
    {
      name: 'Exports',
      description: 'Data export functionality'
    },
    {
      name: 'Developer Portal',
      description: 'API token management and developer tools'
    },
    {
      name: 'Health',
      description: 'System health and status'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check API and database health status',
        tags: ['Health'],
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string', example: 'connected' }
                  }
                }
              }
            }
          },
          '503': {
            description: 'Service unavailable'
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register new user',
        description: 'Create a new user account',
        tags: ['Authentication'],
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePass123!'
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    example: 'John Doe'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '409': {
            description: 'Email already exists'
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        description: 'Authenticate user and create session',
        tags: ['Authentication'],
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials'
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user',
        description: 'End user session',
        tags: ['Authentication'],
        operationId: 'logoutUser',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/users/{userId}': {
      get: {
        summary: 'Get user profile',
        description: 'Retrieve user profile information',
        tags: ['Users'],
        operationId: 'getUser',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      patch: {
        summary: 'Update user profile',
        description: 'Update user profile information',
        tags: ['Users'],
        operationId: 'updateUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/contracts': {
      get: {
        summary: 'List contracts',
        description: 'List all contracts with optional filtering',
        tags: ['Contracts'],
        operationId: 'listContracts',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: 'skip',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['active', 'completed', 'cancelled']
            }
          }
        ],
        responses: {
          '200': {
            description: 'List of contracts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contracts: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Contract' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create contract',
        description: 'Create a new contract',
        tags: ['Contracts'],
        operationId: 'createContract',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContractInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Contract created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contract' }
              }
            }
          },
          '400': {
            description: 'Validation error'
          }
        }
      }
    },
    '/contracts/{contractId}': {
      get: {
        summary: 'Get contract',
        description: 'Retrieve a specific contract',
        tags: ['Contracts'],
        operationId: 'getContract',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: 'contractId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Contract details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contract' }
              }
            }
          },
          '404': {
            description: 'Contract not found'
          }
        }
      },
      patch: {
        summary: 'Update contract',
        description: 'Update contract information',
        tags: ['Contracts'],
        operationId: 'updateContract',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'contractId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContractInput' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Contract updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contract' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete contract',
        description: 'Delete a contract',
        tags: ['Contracts'],
        operationId: 'deleteContract',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'contractId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': {
            description: 'Contract deleted'
          },
          '404': {
            description: 'Contract not found'
          }
        }
      }
    },
    '/payments': {
      get: {
        summary: 'List payments',
        description: 'List all payments',
        tags: ['Payments'],
        operationId: 'listPayments',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            name: 'skip',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 }
          }
        ],
        responses: {
          '200': {
            description: 'List of payments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    payments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Payment' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create payment',
        description: 'Process a new payment',
        tags: ['Payments'],
        operationId: 'createPayment',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaymentInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Payment created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Payment' }
              }
            }
          },
          '400': {
            description: 'Validation error'
          }
        }
      }
    },
    '/exports': {
      post: {
        summary: 'Export data',
        description: 'Export data in specified format',
        tags: ['Exports'],
        operationId: 'exportData',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['format', 'type'],
                properties: {
                  format: {
                    type: 'string',
                    enum: ['csv', 'json', 'xlsx']
                  },
                  type: {
                    type: 'string',
                    enum: ['contracts', 'payments', 'users']
                  },
                  filters: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Export data',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    },
    '/dev/me': {
      get: {
        summary: 'Get current user',
        description: 'Get authenticated user information',
        tags: ['Developer Portal'],
        operationId: 'getMe',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    authMethod: {
                      type: 'string',
                      enum: ['session', 'api_token']
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dev/tokens': {
      get: {
        summary: 'List API tokens',
        description: 'List all API tokens for current user',
        tags: ['Developer Portal'],
        operationId: 'listTokens',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of tokens',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokens: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ApiToken' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create API token',
        description: 'Create a new API token',
        tags: ['Developer Portal'],
        operationId: 'createToken',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['scopes'],
                properties: {
                  name: { type: 'string' },
                  scopes: {
                    type: 'array',
                    items: {
                      type: 'string',
                      enum: [
                        'read',
                        'write',
                        'admin',
                        'payments',
                        'exports',
                        'contracts',
                        'notifications'
                      ]
                    }
                  },
                  expiresIn: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Token created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { $ref: '#/components/schemas/ApiToken' },
                    value: {
                      type: 'string',
                      description: 'Token value (shown only once)'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/dev/tokens/{tokenId}': {
      get: {
        summary: 'Get token details',
        tags: ['Developer Portal'],
        operationId: 'getToken',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tokenId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Token details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiToken' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Revoke token',
        tags: ['Developer Portal'],
        operationId: 'revokeToken',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tokenId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Token revoked'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Contract: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['active', 'completed', 'cancelled']
          },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          amount: { type: 'number', format: 'double' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ContractInput: {
        type: 'object',
        required: ['title', 'amount'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          amount: { type: 'number', format: 'double' }
        }
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          contractId: { type: 'integer' },
          userId: { type: 'integer' },
          amount: { type: 'number', format: 'double' },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed']
          },
          method: {
            type: 'string',
            enum: ['card', 'bank', 'paypal']
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      PaymentInput: {
        type: 'object',
        required: ['contractId', 'amount', 'method'],
        properties: {
          contractId: { type: 'integer' },
          amount: { type: 'number', format: 'double' },
          method: {
            type: 'string',
            enum: ['card', 'bank', 'paypal']
          }
        }
      },
      ApiToken: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          scopes: {
            type: 'array',
            items: { type: 'string' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          lastUsedAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Token',
        description: 'API key authentication'
      }
    }
  },
  security: [
    { bearerAuth: [] },
    { apiKeyAuth: [] }
  ]
};
