/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create risk_analyses table
  pgm.createTable('risk_analyses', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects(id)',
      onDelete: 'CASCADE',
    },
    overall_score: {
      type: 'decimal(5, 2)',
      notNull: true,
    },
    analyzed_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    metadata: {
      type: 'jsonb',
      notNull: true,
    },
  });

  // Add constraint for valid score range
  pgm.addConstraint('risk_analyses', 'valid_score', {
    check: 'overall_score >= 0 AND overall_score <= 100',
  });

  // Create indexes for performance
  pgm.createIndex('risk_analyses', 'project_id', {
    name: 'idx_risk_analyses_project_id',
  });
  pgm.createIndex('risk_analyses', 'analyzed_at', {
    name: 'idx_risk_analyses_analyzed_at',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('risk_analyses', { ifExists: true, cascade: true });
};
