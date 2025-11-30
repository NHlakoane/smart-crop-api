CREATE TABLE IF NOT EXISTS performance_scores (
    score_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    rating VARCHAR(20) NOT NULL CHECK (rating IN ('fair', 'moderate', 'good', 'perfect')),
    calculation_method VARCHAR(50) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_scores_user_id ON performance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_scores_period ON performance_scores(period_start, period_end);