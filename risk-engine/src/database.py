"""
Database configuration and connection management
Uses psycopg2 for PostgreSQL connectivity
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'risk_analyzer'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
}

# Connection pool
_connection_pool = None


def initialize_pool(minconn=1, maxconn=10):
    """
    Initialize the database connection pool
    
    Args:
        minconn: Minimum number of connections
        maxconn: Maximum number of connections
    """
    global _connection_pool
    
    if _connection_pool is None:
        try:
            _connection_pool = SimpleConnectionPool(
                minconn,
                maxconn,
                **DB_CONFIG
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize connection pool: {e}")
            raise


def get_pool():
    """Get the connection pool, initializing if necessary"""
    if _connection_pool is None:
        initialize_pool()
    return _connection_pool


@contextmanager
def get_db_connection():
    """
    Context manager for database connections
    
    Yields:
        Database connection with RealDictCursor
    
    Example:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users")
                results = cur.fetchall()
    """
    pool = get_pool()
    conn = pool.getconn()
    
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        pool.putconn(conn)


@contextmanager
def get_db_cursor(commit=True):
    """
    Context manager for database cursor with automatic commit/rollback
    
    Args:
        commit: Whether to commit on success (default: True)
    
    Yields:
        Database cursor (RealDictCursor)
    
    Example:
        with get_db_cursor() as cur:
            cur.execute("INSERT INTO users (name) VALUES (%s)", ("John",))
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise
        finally:
            cursor.close()


def close_pool():
    """Close all connections in the pool"""
    global _connection_pool
    if _connection_pool is not None:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Database connection pool closed")


def test_connection():
    """
    Test database connectivity
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT 1")
            result = cur.fetchone()
            return result is not None
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
