/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create projects table
  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    start_date: {
      type: 'date',
      notNull: true,
    },
    end_date: {
      type: 'date',
      notNull: true,
    },
    budget: {
      type: 'decimal(15, 2)',
      notNull: true,
    },
    team_size: {
      type: 'integer',
      notNull: true,
    },
    team_composition: {
      type: 'jsonb',
      notNull: true,
    },
    technology_stack: {
      type: 'jsonb',
      notNull: true,
    },
    scope: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add constraints
  pgm.addConstraint('projects', 'valid_dates', {
    check: 'end_date > start_date',
  });

  pgm.addConstraint('projects', 'positive_budget', {
    check: 'budget > 0',
  });

  pgm.addConstraint('projects', 'positive_team_size', {
    check: 'team_size > 0',
  });

  // Create indexes for performance
  pgm.createIndex('projects', 'user_id', { name: 'idx_projects_user_id' });
  pgm.createIndex('projects', 'created_at', { name: 'idx_projects_created_at' });

  // Create trigger for projects table
  pgm.createTrigger('projects', 'update_projects_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('projects', { ifExists: true, cascade: true });
};
