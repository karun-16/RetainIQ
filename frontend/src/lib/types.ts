// database/types.ts
// TypeScript interfaces mirroring all Supabase tables

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Unknown';
export type MeetingStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
export type MeetingType = 'Retention Discussion' | 'Check-in' | 'Performance Review' | 'Career Development' | 'Other';
export type FollowupStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
export type ActionType = 'Salary Review' | 'Workload Reduction' | 'Career Discussion' | 'Mentorship Assignment' | 'Internal Transfer' | 'Flexible Hours' | 'Training Program' | 'Other';
export type BusinessTravel = 'Non-Travel' | 'Travel_Rarely' | 'Travel_Frequently';
export type EducationField = 'Human Resources' | 'Life Sciences' | 'Marketing' | 'Medical' | 'Other' | 'Technical Degree';
export type JobRole = 'Healthcare Representative' | 'Human Resources' | 'Laboratory Technician' | 'Manager' | 'Manufacturing Director' | 'Research Director' | 'Research Scientist' | 'Sales Executive' | 'Sales Representative';
export type MaritalStatus = 'Divorced' | 'Married' | 'Single';
export type Gender = 'Female' | 'Male';
export type OverTime = 'Yes' | 'No';

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string | null;
  // ML Features
  age: number;
  business_travel: BusinessTravel;
  daily_rate: number;
  distance_from_home: number;
  education: number;           // 1-5
  education_field: EducationField;
  environment_satisfaction: number;  // 1-4
  gender: Gender;
  hourly_rate: number;
  job_involvement: number;     // 1-4
  job_level: number;           // 1-5
  job_role: JobRole;
  job_satisfaction: number;    // 1-4
  marital_status: MaritalStatus;
  monthly_income: number;
  monthly_rate: number;
  num_companies_worked: number;
  over_time: OverTime;
  percent_salary_hike: number;
  performance_rating: number;  // 1-4
  relationship_satisfaction: number; // 1-4
  stock_option_level: number;  // 0-3
  total_working_years: number;
  training_times_last_year: number;
  work_life_balance: number;   // 1-4
  years_at_company: number;
  years_in_current_role: number;
  years_since_last_promotion: number;
  years_with_curr_manager: number;
  // Derived
  risk_level: RiskLevel;
  risk_score: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  departments?: Department;
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low' | 'positive';
}

export interface Recommendation {
  action: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface Prediction {
  id: string;
  employee_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactor[];
  recommendations: Recommendation[];
  input_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface Meeting {
  id: string;
  employee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  notes: string | null;
  status: MeetingStatus;
  created_at: string;
  // Joined
  employees?: Pick<Employee, 'id' | 'name' | 'email' | 'job_role' | 'risk_level'>;
}

export interface Followup {
  id: string;
  employee_id: string;
  action_type: ActionType;
  status: FollowupStatus;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  risk_score_before: number | null;
  risk_score_after: number | null;
  created_at: string;
  // Joined
  employees?: Pick<Employee, 'id' | 'name' | 'email' | 'job_role' | 'risk_level'>;
}

export interface Note {
  id: string;
  employee_id: string;
  content: string;
  created_at: string;
}

// API types for the FastAPI backend

export interface PredictRequest {
  Age: number;
  BusinessTravel: BusinessTravel;
  DailyRate: number;
  Department: string;
  DistanceFromHome: number;
  Education: number;
  EducationField: EducationField;
  EnvironmentSatisfaction: number;
  Gender: Gender;
  HourlyRate: number;
  JobInvolvement: number;
  JobLevel: number;
  JobRole: JobRole;
  JobSatisfaction: number;
  MaritalStatus: MaritalStatus;
  MonthlyIncome: number;
  MonthlyRate: number;
  NumCompaniesWorked: number;
  OverTime: OverTime;
  PercentSalaryHike: number;
  PerformanceRating: number;
  RelationshipSatisfaction: number;
  StockOptionLevel: number;
  TotalWorkingYears: number;
  TrainingTimesLastYear: number;
  WorkLifeBalance: number;
  YearsAtCompany: number;
  YearsInCurrentRole: number;
  YearsSinceLastPromotion: number;
  YearsWithCurrManager: number;
}

export interface PredictResponse {
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactor[];
  recommendations: Recommendation[];
  discussion_questions: string[];
}

export interface Intervention {
  id: string;
  label: string;
  description: string;
  original_risk: number;
  new_risk: number;
  delta: number;
}

export interface InterventionRequest {
  employee_data: PredictRequest;
}

export interface InterventionResponse {
  original_risk: number;
  original_level: RiskLevel;
  interventions: Intervention[];
}

// Dashboard types
export interface DashboardKPIs {
  total_employees: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  upcoming_meetings: number;
  pending_followups: number;
}

export interface DeptRiskData {
  department: string;
  high: number;
  medium: number;
  low: number;
}

export interface EffectivenessPoint {
  date: string;
  action: string;
  risk_before: number;
  risk_after: number | null;
  delta: number | null;
}
