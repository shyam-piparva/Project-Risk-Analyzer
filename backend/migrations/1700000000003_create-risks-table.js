/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create risks table
  pgm.createTable('risks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    analysis_id: {
      type: 'uuid',
      notNull: true,
      references: 'risk_analyses(id)',
      onDelete: 'CASCADE',
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: true,
    },
    category: {
      type: 'varchar(50)',
      notNull: true,
    },
    score: {
      type: 'decimal(5, 2)',
      notNull: true,
    },
    probability: {
      type: 'decimal(3, 2)',
      notNull: true,
    },
    impact: {
      type: 'decimal(3, 2)',
      notNull: true,
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'Open'",
    },
    detected_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    resolved_at: {
      type: 'timestamp',
    },
  });

  // Add constraints
  pgm.addConstraint('risks', 'valid_risk_score', {
    check: 'score >= 0 AND score <= 100',
  });

  pgm.addConstraint('risks', 'valid_probability', {
    check: 'probability >= 0 AND probability <= 1',
  });

  pgm.addConstraint('risks', 'valid_impact', {
    check: 'impact >= 0 AND impact <= 1',
  });

  pgm.addConstraint('risks', 'valid_category', {
    check: "category IN ('Technical', 'Resource', 'Schedule', 'Budget', 'External')",
  });

  pgm.addConstraint('risks', 'valid_status', {
    check: "status IN ('Open', 'In Progress', 'Mitigated', 'Resolved', 'Accepted')",
  });

  // Create indexes for performance
  pgm.createIndex('risks', 'analysis_id', { name: 'idx_risks_analysis_id' });
  pgm.createIndex('risks', 'category', { name: 'idx_risks_category' });
  pgm.createIndex('risks', 'score', {
    name: 'idx_risks_score',
    method: 'btree',
    order: 'DESC',
  });
  pgm.createIndex('risks', 'status', { name: 'idx_risks_status' });
};

exports.down = (pgm) => {
  pgm.dropTable('risks', { ifExists: true, cascade: true });
};
