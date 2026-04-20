-- Clear old risk analyses created by fallback engine
-- This will force fresh analyses using the Python engine

-- Delete in correct order due to foreign key constraints
DELETE FROM mitigations;
DELETE FROM risks;
DELETE FROM risk_analyses;

-- Verify deletion
SELECT 'Mitigations remaining:' as info, COUNT(*) as count FROM mitigations
UNION ALL
SELECT 'Risks remaining:', COUNT(*) FROM risks
UNION ALL
SELECT 'Analyses remaining:', COUNT(*) FROM risk_analyses;
