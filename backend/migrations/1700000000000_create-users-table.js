/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
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
    last_login_at: {
      type: 'timestamp',
    },
    is_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    reset_token: {
      type: 'varchar(255)',
    },
    reset_token_expiry: {
      type: 'timestamp',
    },
  });

  // Create index on email for faster lookups
  pgm.createIndex('users', 'email', { name: 'idx_users_email' });

  // Create function to update updated_at timestamp
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = clock_timestamp();
      RETURN NEW;
    END;
    `
  );

  // Create trigger for users table
  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

exports.down = (pgm) => {
  pgm.dropTrigger('users', 'update_users_updated_at', { ifExists: true });
  pgm.dropFunction('update_updated_at_column', [], { ifExists: true });
  pgm.dropTable('users', { ifExists: true, cascade: true });
  pgm.dropExtension('uuid-ossp', { ifExists: true });
};
