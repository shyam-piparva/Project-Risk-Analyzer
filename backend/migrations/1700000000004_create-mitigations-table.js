/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create mitigations table
  pgm.createTable('mitigations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    risk_id: {
      type: 'uuid',
      notNull: true,
      references: 'risks(id)',
      onDelete: 'CASCADE',
    },
    strategy: {
      type: 'text',
      notNull: true,
    },
    priority: {
      type: 'varchar(50)',
      notNull: true,
    },
    estimated_effort: {
      type: 'varchar(100)',
    },
    is_implemented: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    implemented_at: {
      type: 'timestamp',
    },
    is_custom: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add constraint for valid priority
  pgm.addConstraint('mitigations', 'valid_priority', {
    check: "priority IN ('High', 'Medium', 'Low')",
  });

  // Create indexes for performance
  pgm.createIndex('mitigations', 'risk_id', { name: 'idx_mitigations_risk_id' });
  pgm.createIndex('mitigations', 'is_implemented', {
    name: 'idx_mitigations_is_implemented',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('mitigations', { ifExists: true, cascade: true });
};
