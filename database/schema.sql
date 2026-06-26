-- ============================================================
-- RetainIQ — Supabase Schema
-- Paste this entire file into the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);

-- Employees (all ML feature fields + display fields, no employee_number)
CREATE TABLE IF NOT EXISTS employees (
  id                          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                        text NOT NULL,
  department_id               uuid REFERENCES departments(id) ON DELETE SET NULL,
  -- ML features (matching HR_Attrition.csv, minus the 4 dropped columns)
  age                         int CHECK (age BETWEEN 18 AND 65),
  business_travel             text CHECK (business_travel IN ('Non-Travel','Travel_Rarely','Travel_Frequently')),
  daily_rate                  int,
  distance_from_home          int,
  education                   int CHECK (education BETWEEN 1 AND 5),
  education_field             text CHECK (education_field IN ('Human Resources','Life Sciences','Marketing','Medical','Other','Technical Degree')),
  environment_satisfaction    int CHECK (environment_satisfaction BETWEEN 1 AND 4),
  gender                      text CHECK (gender IN ('Female','Male')),
  hourly_rate                 int,
  job_involvement             int CHECK (job_involvement BETWEEN 1 AND 4),
  job_level                   int CHECK (job_level BETWEEN 1 AND 5),
  job_role                    text CHECK (job_role IN ('Healthcare Representative','Human Resources','Laboratory Technician','Manager','Manufacturing Director','Research Director','Research Scientist','Sales Executive','Sales Representative')),
  job_satisfaction            int CHECK (job_satisfaction BETWEEN 1 AND 4),
  marital_status              text CHECK (marital_status IN ('Divorced','Married','Single')),
  monthly_income              int,
  monthly_rate                int,
  num_companies_worked        int,
  over_time                   text CHECK (over_time IN ('Yes','No')),
  percent_salary_hike         int,
  performance_rating          int CHECK (performance_rating BETWEEN 1 AND 4),
  relationship_satisfaction   int CHECK (relationship_satisfaction BETWEEN 1 AND 4),
  stock_option_level          int CHECK (stock_option_level BETWEEN 0 AND 3),
  total_working_years         int,
  training_times_last_year    int,
  work_life_balance           int CHECK (work_life_balance BETWEEN 1 AND 4),
  years_at_company            int,
  years_in_current_role       int,
  years_since_last_promotion  int,
  years_with_curr_manager     int,
  -- Derived / display
  risk_level                  text DEFAULT 'Unknown' CHECK (risk_level IN ('Low','Medium','High','Unknown')),
  risk_score                  numeric(5,2),
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

-- Predictions (stores every ML run + full input snapshot for audit + trend)
CREATE TABLE IF NOT EXISTS predictions (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id      uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  risk_score       numeric(5,2) NOT NULL,
  risk_level       text NOT NULL CHECK (risk_level IN ('Low','Medium','High')),
  risk_factors     jsonb,
  recommendations  jsonb,
  input_snapshot   jsonb,   -- exact feature dict sent to the model
  created_at       timestamptz DEFAULT now()
);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id      uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int DEFAULT 30,
  meeting_type     text CHECK (meeting_type IN ('Retention Discussion','Check-in','Performance Review','Career Development','Other')),
  notes            text,
  status           text DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled','Rescheduled')),
  created_at       timestamptz DEFAULT now()
);

-- Follow-ups: tracks interventions + effectiveness via before/after risk scores
CREATE TABLE IF NOT EXISTS followups (
  id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id       uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action_type       text NOT NULL CHECK (action_type IN ('Salary Review','Workload Reduction','Career Discussion','Mentorship Assignment','Internal Transfer','Flexible Hours','Training Program','Other')),
  status            text DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed','Cancelled')),
  due_date          date,
  completed_at      timestamptz,
  notes             text,
  risk_score_before numeric(5,2),  -- risk at intervention creation
  risk_score_after  numeric(5,2),  -- risk after intervention (filled on completion)
  created_at        timestamptz DEFAULT now()
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id  uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_dept        ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_risk        ON employees(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_emp       ON predictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date      ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_emp          ON meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_sched        ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followups_emp         ON followups(employee_id);
CREATE INDEX IF NOT EXISTS idx_followups_status      ON followups(status);
CREATE INDEX IF NOT EXISTS idx_notes_emp             ON notes(employee_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes       ENABLE ROW LEVEL SECURITY;

-- Authenticated HR users have full access (MVP: single-team access)
CREATE POLICY "auth_read_departments"  ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_employees"     ON employees   FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_predictions"   ON predictions FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_meetings"      ON meetings    FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_followups"     ON followups   FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_notes"         ON notes       FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO departments (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sales'),
  ('22222222-2222-2222-2222-222222222222', 'Research & Development'),
  ('33333333-3333-3333-3333-333333333333', 'Human Resources')
ON CONFLICT (name) DO NOTHING;

-- 20 sample employees with realistic ML-feature values
INSERT INTO employees (
  id, name, department_id,
  age, business_travel, daily_rate, distance_from_home,
  education, education_field, environment_satisfaction,
  gender, hourly_rate, job_involvement, job_level, job_role,
  job_satisfaction, marital_status, monthly_income, monthly_rate,
  num_companies_worked, over_time, percent_salary_hike,
  performance_rating, relationship_satisfaction, stock_option_level,
  total_working_years, training_times_last_year, work_life_balance,
  years_at_company, years_in_current_role, years_since_last_promotion,
  years_with_curr_manager, risk_level, risk_score
) VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','Priya Sharma','11111111-1111-1111-1111-111111111111',28,'Travel_Frequently',800,15,2,'Life Sciences',2,'Female',55,2,1,'Sales Representative',2,'Single',2800,18000,4,'Yes',11,3,1,0,5,2,1,2,1,0,1,'High',82.3),
  ('aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa','Rahul Verma','11111111-1111-1111-1111-111111111111',26,'Travel_Rarely',1102,1,2,'Marketing',2,'Male',94,3,2,'Sales Executive',2,'Single',3500,19479,6,'Yes',14,3,1,0,6,0,1,4,2,0,3,'High',78.6),
  ('aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa','Ananya Roy','22222222-2222-2222-2222-222222222222',30,'Travel_Rarely',1373,2,2,'Other',4,'Female',92,2,1,'Laboratory Technician',1,'Single',2090,2396,5,'Yes',15,3,2,0,3,3,3,0,0,0,0,'High',75.1),
  ('aaaaaaaa-0004-0004-0004-aaaaaaaaaaaa','Kiran Mehta','11111111-1111-1111-1111-111111111111',24,'Travel_Frequently',500,20,1,'Technical Degree',1,'Male',40,2,1,'Sales Representative',1,'Single',2500,15000,3,'Yes',12,3,2,0,2,1,2,1,0,0,0,'High',71.4),
  ('aaaaaaaa-0005-0005-0005-aaaaaaaaaaaa','Divya Nair','22222222-2222-2222-2222-222222222222',29,'Travel_Rarely',900,8,3,'Life Sciences',2,'Female',65,2,2,'Research Scientist',2,'Married',4200,20000,3,'Yes',13,3,3,0,4,2,1,3,1,1,2,'High',68.9),
  ('aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa','Arjun Patel','22222222-2222-2222-2222-222222222222',35,'Travel_Rarely',1392,3,4,'Life Sciences',3,'Male',56,3,2,'Research Scientist',2,'Married',5130,24907,2,'No',11,4,3,1,8,3,3,6,4,1,4,'Medium',54.2),
  ('aaaaaaaa-0007-0007-0007-aaaaaaaaaaaa','Sneha Iyer','33333333-3333-3333-3333-333333333333',32,'Non-Travel',600,5,2,'Human Resources',3,'Female',70,3,2,'Human Resources',3,'Single',4500,17000,2,'No',14,3,2,0,5,2,2,4,2,1,3,'Medium',48.7),
  ('aaaaaaaa-0008-0008-0008-aaaaaaaaaaaa','Vikram Singh','11111111-1111-1111-1111-111111111111',38,'Travel_Rarely',1200,10,3,'Marketing',2,'Male',80,3,3,'Sales Executive',2,'Married',7500,22000,4,'Yes',15,3,3,1,12,4,2,8,5,3,6,'Medium',45.3),
  ('aaaaaaaa-0009-0009-0009-aaaaaaaaaaaa','Pooja Gupta','22222222-2222-2222-2222-222222222222',33,'Travel_Rarely',1100,6,3,'Medical',3,'Female',60,3,2,'Healthcare Representative',3,'Married',6200,19000,2,'No',12,3,4,1,9,3,2,7,4,1,5,'Medium',42.1),
  ('aaaaaaaa-0010-0010-0010-aaaaaaaaaaaa','Aditya Kumar','22222222-2222-2222-2222-222222222222',40,'Travel_Frequently',1350,12,4,'Life Sciences',3,'Male',75,3,3,'Manufacturing Director',3,'Married',9500,25000,3,'No',17,3,3,2,14,4,2,10,7,2,8,'Medium',38.5),
  ('aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa','Meera Krishnan','22222222-2222-2222-2222-222222222222',45,'Travel_Rarely',1250,5,4,'Life Sciences',4,'Female',80,4,4,'Research Director',4,'Married',15000,26000,2,'No',18,4,4,2,20,3,3,15,10,5,12,'Low',18.4),
  ('aaaaaaaa-0012-0012-0012-aaaaaaaaaaaa','Suresh Reddy','22222222-2222-2222-2222-222222222222',42,'Non-Travel',1000,3,3,'Medical',4,'Male',85,4,3,'Manager',4,'Married',12000,23000,1,'No',15,4,4,3,18,3,4,14,9,3,11,'Low',15.2),
  ('aaaaaaaa-0013-0013-0013-aaaaaaaaaaaa','Lakshmi Rao','22222222-2222-2222-2222-222222222222',38,'Travel_Rarely',1300,8,4,'Life Sciences',4,'Female',90,4,3,'Healthcare Representative',4,'Married',10500,24000,2,'No',14,4,4,2,16,3,2,12,8,2,9,'Low',12.8),
  ('aaaaaaaa-0014-0014-0014-aaaaaaaaaaaa','Ravi Chandran','22222222-2222-2222-2222-222222222222',50,'Non-Travel',1400,2,5,'Technical Degree',4,'Male',95,4,5,'Research Director',4,'Married',19000,27000,1,'No',20,4,4,3,25,3,4,20,12,8,15,'Low',9.3),
  ('aaaaaaaa-0015-0015-0015-aaaaaaaaaaaa','Nisha Pillai','33333333-3333-3333-3333-333333333333',36,'Non-Travel',900,4,3,'Human Resources',4,'Female',75,4,3,'Manager',4,'Married',11000,21000,1,'No',13,4,4,2,13,3,3,10,7,2,8,'Low',11.5),
  ('aaaaaaaa-0016-0016-0016-aaaaaaaaaaaa','Ganesh Kumar','22222222-2222-2222-2222-222222222222',44,'Travel_Rarely',1150,7,4,'Medical',4,'Male',88,4,4,'Manufacturing Director',4,'Married',13500,25500,2,'No',16,4,4,2,19,4,4,16,10,4,13,'Low',14.7),
  ('aaaaaaaa-0017-0017-0017-aaaaaaaaaaaa','Anjali Desai','11111111-1111-1111-1111-111111111111',34,'Travel_Rarely',950,9,3,'Marketing',3,'Female',72,3,3,'Sales Executive',3,'Married',8500,22500,2,'No',14,3,3,1,11,3,3,8,6,2,7,'Low',22.8),
  ('aaaaaaaa-0018-0018-0018-aaaaaaaaaaaa','Mohit Joshi','22222222-2222-2222-2222-222222222222',37,'Travel_Rarely',1050,6,3,'Life Sciences',3,'Male',78,3,3,'Laboratory Technician',3,'Married',7800,21500,2,'No',13,3,3,1,12,3,2,9,6,2,7,'Low',20.1),
  ('aaaaaaaa-0019-0019-0019-aaaaaaaaaaaa','Kavitha Murthy','22222222-2222-2222-2222-222222222222',41,'Non-Travel',1200,4,4,'Life Sciences',4,'Female',82,3,3,'Research Scientist',3,'Married',9200,23500,1,'No',15,3,4,2,15,3,3,12,8,3,10,'Low',16.9),
  ('aaaaaaaa-0020-0020-0020-aaaaaaaaaaaa','Deepak Nair','11111111-1111-1111-1111-111111111111',39,'Travel_Rarely',1100,11,4,'Marketing',3,'Male',77,3,3,'Sales Executive',3,'Divorced',8800,23000,3,'No',14,3,3,1,13,3,2,10,7,2,8,'Low',19.5);

-- Sample Predictions (risk trend data for Priya Sharma)
INSERT INTO predictions (employee_id, risk_score, risk_level, risk_factors, recommendations, input_snapshot, created_at) VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',85.1,'High','[{"factor":"Frequent Overtime","impact":"high"},{"factor":"Below Average Monthly Income","impact":"high"}]','[{"action":"Review Compensation Package","priority":"urgent"}]','{"Age":28,"BusinessTravel":"Travel_Frequently","OverTime":"Yes","MonthlyIncome":2800,"WorkLifeBalance":1,"JobSatisfaction":2}', now() - interval '90 days'),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',79.5,'High','[{"factor":"Frequent Overtime","impact":"high"},{"factor":"Below Average Monthly Income","impact":"high"},{"factor":"Low Work-Life Balance","impact":"medium"}]','[{"action":"Schedule Retention Discussion","priority":"urgent"},{"action":"Review Compensation Package","priority":"high"}]','{"Age":28,"BusinessTravel":"Travel_Frequently","OverTime":"Yes","MonthlyIncome":2800,"WorkLifeBalance":1,"JobSatisfaction":2}', now() - interval '60 days'),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',82.3,'High','[{"factor":"Frequent Overtime","impact":"high"},{"factor":"Below Average Monthly Income","impact":"high"},{"factor":"Low Work-Life Balance","impact":"medium"},{"factor":"Low Job Satisfaction","impact":"medium"},{"factor":"Single Marital Status","impact":"low"}]','[{"action":"Schedule Retention Discussion","priority":"urgent"},{"action":"Review Compensation Package","priority":"high"},{"action":"Reduce Overtime Workload","priority":"high"},{"action":"Discuss Career Growth Opportunities","priority":"medium"}]','{"Age":28,"BusinessTravel":"Travel_Frequently","DailyRate":800,"DistanceFromHome":15,"Education":2,"EducationField":"Life Sciences","EnvironmentSatisfaction":2,"Gender":"Female","HourlyRate":55,"JobInvolvement":2,"JobLevel":1,"JobRole":"Sales Representative","JobSatisfaction":2,"MaritalStatus":"Single","MonthlyIncome":2800,"MonthlyRate":18000,"NumCompaniesWorked":4,"OverTime":"Yes","PercentSalaryHike":11,"PerformanceRating":3,"RelationshipSatisfaction":1,"StockOptionLevel":0,"TotalWorkingYears":5,"TrainingTimesLastYear":2,"WorkLifeBalance":1,"YearsAtCompany":2,"YearsInCurrentRole":1,"YearsSinceLastPromotion":0,"YearsWithCurrManager":1}', now() - interval '30 days'),
  ('aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa',54.2,'Medium','[{"factor":"Low Job Satisfaction","impact":"medium"}]','[{"action":"Career Discussion","priority":"medium"}]','{"Age":35,"OverTime":"No","MonthlyIncome":5130,"WorkLifeBalance":3,"JobSatisfaction":2}', now() - interval '15 days'),
  ('aaaaaaaa-0011-0011-0011-aaaaaaaaaaaa',18.4,'Low','[{"factor":"Good Compensation","impact":"positive"},{"factor":"High Job Satisfaction","impact":"positive"}]','[{"action":"Continue Regular Check-ins","priority":"low"}]','{"Age":45,"OverTime":"No","MonthlyIncome":15000,"WorkLifeBalance":4,"JobSatisfaction":4}', now() - interval '7 days');

-- Sample Meetings
INSERT INTO meetings (employee_id, scheduled_at, duration_minutes, meeting_type, notes, status) VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', now() + interval '3 days', 60, 'Retention Discussion', 'Discuss compensation and workload concerns', 'Scheduled'),
  ('aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa', now() + interval '7 days', 45, 'Check-in', 'Monthly check-in and goal review', 'Scheduled'),
  ('aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa', now() - interval '10 days', 60, 'Career Development', 'Discussed promotion path and skill development', 'Completed'),
  ('aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa', now() + interval '1 day', 45, 'Retention Discussion', 'Address overtime and work-life balance', 'Scheduled'),
  ('aaaaaaaa-0008-0008-0008-aaaaaaaaaaaa', now() - interval '5 days', 30, 'Check-in', 'Regular quarterly check-in', 'Completed');

-- Sample Follow-ups (with risk_score_before/after for effectiveness tracker)
INSERT INTO followups (employee_id, action_type, status, due_date, notes, risk_score_before, risk_score_after) VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','Salary Review','In Progress', current_date + interval '14 days','Propose 20% salary increase to market rate',82.3,NULL),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','Workload Reduction','Pending', current_date + interval '7 days','Reassign 2 accounts to reduce overtime',82.3,NULL),
  ('aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa','Career Discussion','Completed', current_date - interval '5 days','Discussed Senior Scientist promotion path',54.2,41.8),
  ('aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa','Mentorship Assignment','Pending', current_date + interval '3 days','Pair with senior lab technician',75.1,NULL),
  ('aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa','Flexible Hours','In Progress', current_date + interval '5 days','Allow flexible start time to reduce commute stress',78.6,NULL);

-- Sample Notes
INSERT INTO notes (employee_id, content) VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','Employee mentioned feeling overwhelmed by travel schedule during last 1-on-1. Considering role adjustment.'),
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','Compensation benchmarking shows Priya is 22% below market rate for her role and experience level.'),
  ('aaaaaaaa-0002-0002-0002-aaaaaaaaaaaa','Rahul expressed interest in transitioning to an account management role. Follow up with hiring manager.'),
  ('aaaaaaaa-0006-0006-0006-aaaaaaaaaaaa','Strong performer. Job satisfaction improved after career discussion. Monitor over next quarter.'),
  ('aaaaaaaa-0003-0003-0003-aaaaaaaaaaaa','New hire adjustment challenges. Overtime is primary concern. Manager aware.');
