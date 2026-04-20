/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create reports table
  pgm.createTable('reports', {
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
    analysis_id: {
      type: 'uuid',
      notNull: true,
      references: 'risk_analyses(id)',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(10)',
      notNull: true,
    },
    file_url: {
      type: 'text',
      notNull: true,
    },
    generated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    generated_by: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
    },
    options: {
      type: 'jsonb',
      notNull: true,
    },
  });

  // Add constraint for valid report type
  pgm.addConstraint('reports', 'valid_report_type', {
    check: "type IN ('PDF', 'CSV')",
  });

  // Create indexes for performance
  pgm.createIndex('reports', 'project_id', { name: 'idx_reports_project_id' });
  pgm.createIndex('reports', 'generated_at', { name: 'idx_reports_generated_at' });
};

exports.down = (pgm) => {
  pgm.dropTable('reports', { ifExists: true, cascade: true });
};
