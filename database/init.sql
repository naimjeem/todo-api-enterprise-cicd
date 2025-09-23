-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO tasks (title, description, priority, due_date, completed) VALUES
('Complete CI/CD Pipeline', 'Implement comprehensive CI/CD pipeline with quality gates', 'high', NOW() + INTERVAL '7 days', false),
('Write Unit Tests', 'Achieve 85% test coverage for all modules', 'high', NOW() + INTERVAL '3 days', false),
('Security Audit', 'Run security scans and fix vulnerabilities', 'medium', NOW() + INTERVAL '5 days', false),
('Performance Testing', 'Implement load testing with k6', 'medium', NOW() + INTERVAL '4 days', false),
('Documentation', 'Create API documentation and deployment guides', 'low', NOW() + INTERVAL '10 days', false)
ON CONFLICT DO NOTHING;

