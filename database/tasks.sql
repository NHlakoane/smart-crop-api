-- Tasks table
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expected_duration_minutes INTEGER, 
    actual_duration_minutes INTEGER,  
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    crop_id INTEGER REFERENCES crops(c_id) ON DELETE SET NULL,
    field_id INTEGER REFERENCES fields(f_id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Task comments table
CREATE TABLE task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_templates ( 
    template_id SERIAL PRIMARY KEY, 
    title VARCHAR(255) NOT NULL UNIQUE, 
    description TEXT 
);

INSERT INTO task_templates (title, description)
VALUES
-- Planting
('Prepare Seedbed', 'Plow, level, and prepare the seedbed before planting'),
('Plant Seeds', 'Sow seeds according to spacing and depth guidelines'),
('Transplant Seedlings', 'Move seedlings from the nursery to the main field'),

-- Irrigation
('Irrigation Setup', 'Inspect, repair, and set up irrigation pipes or drip lines'),
('Water Crops', 'Irrigate fields according to crop water requirements'),
('Flush Irrigation System', 'Clean and flush irrigation system to remove blockages'),

-- Fertilization
('Apply Fertilizer', 'Distribute fertilizer across the field according to schedule'),
('Top Dressing', 'Apply fertilizer during crop growth for nutrient boost'),

-- Pest & Weed Control
('Apply Pesticide', 'Spray pesticides or fungicides to control pests and diseases'),
('Remove Weeds', 'Manually or mechanically remove weeds from fields'),

-- Harvesting
('Harvest Crops', 'Collect mature crops from the field for processing or sale'),
('Sort & Grade Crops', 'Sort harvested crops by size and quality for storage or market'),

-- Administration
('Plan Farm Meeting', 'Organize and schedule farm staff or stakeholder meeting'),
('Update Farm Records', 'Record tasks, crop progress, and expenses in logbook');


-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_crop_id ON tasks(crop_id);
CREATE INDEX idx_tasks_field_id ON tasks(field_id);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);