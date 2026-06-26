'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchCategories } from '@/lib/api';
import { LabelWithTooltip } from '@/components/Tooltip';
import { User, Briefcase, DollarSign, Clock, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeForm({ employeeId, initialData }: { employeeId?: string, initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    Age: 35,
    BusinessTravel: 'Travel_Rarely',
    DailyRate: 800,
    Department: 'Research & Development',
    DistanceFromHome: 10,
    Education: 3,
    EducationField: 'Life Sciences',
    EnvironmentSatisfaction: 3,
    Gender: 'Male',
    HourlyRate: 65,
    JobInvolvement: 3,
    JobLevel: 2,
    JobRole: 'Research Scientist',
    JobSatisfaction: 3,
    MaritalStatus: 'Married',
    MonthlyIncome: 5000,
    MonthlyRate: 15000,
    NumCompaniesWorked: 2,
    OverTime: 'No',
    PercentSalaryHike: 14,
    PerformanceRating: 3,
    RelationshipSatisfaction: 3,
    StockOptionLevel: 1,
    TotalWorkingYears: 10,
    TrainingTimesLastYear: 3,
    WorkLifeBalance: 3,
    YearsAtCompany: 5,
    YearsInCurrentRole: 3,
    YearsSinceLastPromotion: 1,
    YearsWithCurrManager: 2,
    ...initialData
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;
    
    if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    }

    setFormData((prev: any) => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Find department ID based on name
      const { data: deptData } = await supabase
        .from('departments')
        .select('id')
        .eq('name', formData.Department)
        .single();
        
      const department_id = deptData?.id || null;

      const dbPayload = {
        name: formData.name,
        department_id,
        age: formData.Age,
        business_travel: formData.BusinessTravel,
        daily_rate: formData.DailyRate,
        distance_from_home: formData.DistanceFromHome,
        education: formData.Education,
        education_field: formData.EducationField,
        environment_satisfaction: formData.EnvironmentSatisfaction,
        gender: formData.Gender,
        hourly_rate: formData.HourlyRate,
        job_involvement: formData.JobInvolvement,
        job_level: formData.JobLevel,
        job_role: formData.JobRole,
        job_satisfaction: formData.JobSatisfaction,
        marital_status: formData.MaritalStatus,
        monthly_income: formData.MonthlyIncome,
        monthly_rate: formData.MonthlyRate,
        num_companies_worked: formData.NumCompaniesWorked,
        over_time: formData.OverTime,
        percent_salary_hike: formData.PercentSalaryHike,
        performance_rating: formData.PerformanceRating,
        relationship_satisfaction: formData.RelationshipSatisfaction,
        stock_option_level: formData.StockOptionLevel,
        total_working_years: formData.TotalWorkingYears,
        training_times_last_year: formData.TrainingTimesLastYear,
        work_life_balance: formData.WorkLifeBalance,
        years_at_company: formData.YearsAtCompany,
        years_in_current_role: formData.YearsInCurrentRole,
        years_since_last_promotion: formData.YearsSinceLastPromotion,
        years_with_curr_manager: formData.YearsWithCurrManager,
        risk_level: 'Unknown',
        risk_score: null
      };

      if (employeeId) {
        // Update
        const { error: updateError } = await supabase
          .from('employees')
          .update(dbPayload)
          .eq('id', employeeId);
          
        if (updateError) throw updateError;
        router.push(`/dashboard/employees/${employeeId}`);
      } else {
        // Insert
        const { data: insertData, error: insertError } = await supabase
          .from('employees')
          .insert(dbPayload)
          .select('id')
          .single();
          
        if (insertError) throw insertError;
        router.push(`/dashboard/employees/${insertData.id}`);
      }
      
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={employeeId ? `/dashboard/employees/${employeeId}` : "/dashboard/employees"} className="btn-secondary h-8 w-8 p-0 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {employeeId ? 'Edit Employee' : 'Add New Employee'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-start">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2">
            <User className="w-5 h-5 mr-2 text-primary" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip label="Full Name" tooltip="Employee's full legal name." />
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field bg-background" required placeholder="Jane Doe" />
            </div>
            <div>
              <LabelWithTooltip label="Age" tooltip="Employee's age in years." />
              <input type="number" name="Age" value={formData.Age} onChange={handleChange} className="input-field bg-background" min="18" max="100" required />
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <LabelWithTooltip label="Gender" tooltip="Employee's gender identity." />
              <select name="Gender" value={formData.Gender} onChange={handleChange} className="input-field bg-background">
                {categories?.Gender?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </>}
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Marital Status" tooltip="Employee's current marital status." />
              <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleChange} className="input-field bg-background">
                {categories?.MaritalStatus?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </>}
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Distance From Home (miles)" tooltip="Distance between the employee's home and workplace in miles." />
              <input type="number" name="DistanceFromHome" value={formData.DistanceFromHome} onChange={handleChange} className="input-field bg-background" min="1" max="100" required />
            </div>
            <div>
              <LabelWithTooltip label="Education Level (1-5)" tooltip="1: Below College, 2: College, 3: Bachelor, 4: Master, 5: Doctor" />
              <input type="number" name="Education" value={formData.Education} onChange={handleChange} className="input-field bg-background" min="1" max="5" required />
            </div>
            <div>
              <LabelWithTooltip label="Education Field" tooltip="Employee's field of study or major." />
              <select name="EducationField" value={formData.EducationField} onChange={handleChange} className="input-field bg-background">
                {categories?.EducationField?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                  <option value="Life Sciences">Life Sciences</option>
                  <option value="Medical">Medical</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Technical Degree">Technical Degree</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Other">Other</option>
                </>}
              </select>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2 mt-8">
            <Briefcase className="w-5 h-5 mr-2 text-primary" /> Job Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <LabelWithTooltip label="Department" tooltip="The department the employee belongs to." />
              <select name="Department" value={formData.Department} onChange={handleChange} className="input-field bg-background">
                {categories?.Department?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Sales">Sales</option>
                  <option value="Human Resources">Human Resources</option>
                </>}
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Job Role" tooltip="Specific role or job title of the employee." />
              <select name="JobRole" value={formData.JobRole} onChange={handleChange} className="input-field bg-background">
                {categories?.JobRole?.map((c: string) => <option key={c} value={c}>{c}</option>) || <>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Research Scientist">Research Scientist</option>
                  <option value="Laboratory Technician">Laboratory Technician</option>
                  <option value="Manufacturing Director">Manufacturing Director</option>
                  <option value="Healthcare Representative">Healthcare Representative</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Research Director">Research Director</option>
                  <option value="Human Resources">Human Resources</option>
                </>}
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Job Level (1-5)" tooltip="Seniority level from 1 (Entry) to 5 (Executive)." />
              <input type="number" name="JobLevel" value={formData.JobLevel} onChange={handleChange} className="input-field bg-background" min="1" max="5" required />
            </div>
            <div>
              <LabelWithTooltip label="Job Involvement (1-4)" tooltip="Level of job involvement: 1: Low, 2: Medium, 3: High, 4: Very High." />
              <input type="number" name="JobInvolvement" value={formData.JobInvolvement} onChange={handleChange} className="input-field bg-background" min="1" max="4" required />
            </div>
            <div>
              <LabelWithTooltip label="Job Satisfaction (1-4)" tooltip="Level of job satisfaction: 1: Low, 2: Medium, 3: High, 4: Very High." />
              <input type="number" name="JobSatisfaction" value={formData.JobSatisfaction} onChange={handleChange} className="input-field bg-background" min="1" max="4" required />
            </div>
            <div>
              <LabelWithTooltip label="Environment Sat. (1-4)" tooltip="Satisfaction with the work environment: 1: Low, 2: Medium, 3: High, 4: Very High." />
              <input type="number" name="EnvironmentSatisfaction" value={formData.EnvironmentSatisfaction} onChange={handleChange} className="input-field bg-background" min="1" max="4" required />
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2 mt-8">
            <DollarSign className="w-5 h-5 mr-2 text-primary" /> Compensation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <LabelWithTooltip label="Monthly Income (?)" tooltip="Employee's monthly salary in INR." />
              <input type="number" name="MonthlyIncome" value={formData.MonthlyIncome} onChange={handleChange} className="input-field bg-background" min="1000" max="25000" required />
            </div>
            <div>
              <LabelWithTooltip label="Monthly Rate" tooltip="Monthly billing or compensation rate." />
              <input type="number" name="MonthlyRate" value={formData.MonthlyRate} onChange={handleChange} className="input-field bg-background" min="2000" max="30000" required />
            </div>
            <div>
              <LabelWithTooltip label="Daily Rate" tooltip="Daily billing or compensation rate." />
              <input type="number" name="DailyRate" value={formData.DailyRate} onChange={handleChange} className="input-field bg-background" min="100" max="2000" required />
            </div>
            <div>
              <LabelWithTooltip label="Hourly Rate" tooltip="Hourly billing or compensation rate." />
              <input type="number" name="HourlyRate" value={formData.HourlyRate} onChange={handleChange} className="input-field bg-background" min="30" max="150" required />
            </div>
            <div>
              <LabelWithTooltip label="Salary Hike (%)" tooltip="Percentage increase in salary from the previous year." />
              <input type="number" name="PercentSalaryHike" value={formData.PercentSalaryHike} onChange={handleChange} className="input-field bg-background" min="10" max="30" required />
            </div>
            <div>
              <LabelWithTooltip label="Stock Option (0-3)" tooltip="Level of stock options granted: 0: None to 3: High." />
              <input type="number" name="StockOptionLevel" value={formData.StockOptionLevel} onChange={handleChange} className="input-field bg-background" min="0" max="3" required />
            </div>
          </div>
        </div>

        {/* Career History */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2 mt-8">
            <Clock className="w-5 h-5 mr-2 text-primary" /> Career History
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <LabelWithTooltip label="Total Working Years" tooltip="Total years of professional experience across all companies." />
              <input type="number" name="TotalWorkingYears" value={formData.TotalWorkingYears} onChange={handleChange} className="input-field bg-background" min="0" max="40" required />
            </div>
            <div>
              <LabelWithTooltip label="Companies Worked" tooltip="Number of previous companies the employee has worked at." />
              <input type="number" name="NumCompaniesWorked" value={formData.NumCompaniesWorked} onChange={handleChange} className="input-field bg-background" min="0" max="10" required />
            </div>
            <div>
              <LabelWithTooltip label="Years At Company" tooltip="Total years the employee has spent at the current company." />
              <input type="number" name="YearsAtCompany" value={formData.YearsAtCompany} onChange={handleChange} className="input-field bg-background" min="0" max="40" required />
            </div>
            <div>
              <LabelWithTooltip label="Years In Current Role" tooltip="Total years the employee has spent in their current role." />
              <input type="number" name="YearsInCurrentRole" value={formData.YearsInCurrentRole} onChange={handleChange} className="input-field bg-background" min="0" max="20" required />
            </div>
            <div>
              <LabelWithTooltip label="Years Since Promotion" tooltip="Number of years since the employee's last promotion." />
              <input type="number" name="YearsSinceLastPromotion" value={formData.YearsSinceLastPromotion} onChange={handleChange} className="input-field bg-background" min="0" max="15" required />
            </div>
            <div>
              <LabelWithTooltip label="Years With Manager" tooltip="Number of years the employee has been working with their current manager." />
              <input type="number" name="YearsWithCurrManager" value={formData.YearsWithCurrManager} onChange={handleChange} className="input-field bg-background" min="0" max="20" required />
            </div>
          </div>
        </div>

        {/* Work/Life */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center border-b pb-2 mt-8">
            <Clock className="w-5 h-5 mr-2 text-primary" /> Work & Life Balance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <LabelWithTooltip label="OverTime" tooltip="Indicates if the employee regularly works overtime." />
              <select name="OverTime" value={formData.OverTime} onChange={handleChange} className="input-field bg-background">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Business Travel" tooltip="Frequency of business travel required for the role." />
              <select name="BusinessTravel" value={formData.BusinessTravel} onChange={handleChange} className="input-field bg-background">
                {categories?.BusinessTravel?.map((c: string) => <option key={c} value={c}>{c.replace('_', ' ')}</option>) || <>
                  <option value="Non-Travel">Non-Travel</option>
                  <option value="Travel_Rarely">Travel Rarely</option>
                  <option value="Travel_Frequently">Travel Frequently</option>
                </>}
              </select>
            </div>
            <div>
              <LabelWithTooltip label="Work Life Balance (1-4)" tooltip="Self-reported work-life balance: 1: Bad, 2: Good, 3: Better, 4: Best." />
              <input type="number" name="WorkLifeBalance" value={formData.WorkLifeBalance} onChange={handleChange} className="input-field bg-background" min="1" max="4" required />
            </div>
            <div>
              <LabelWithTooltip label="Performance Rating (3-4)" tooltip="Latest performance rating: 3: Excellent, 4: Outstanding." />
              <input type="number" name="PerformanceRating" value={formData.PerformanceRating} onChange={handleChange} className="input-field bg-background" min="3" max="4" required />
            </div>
            <div>
              <LabelWithTooltip label="Relationship Sat. (1-4)" tooltip="Satisfaction with workplace relationships: 1: Low, 2: Medium, 3: High, 4: Very High." />
              <input type="number" name="RelationshipSatisfaction" value={formData.RelationshipSatisfaction} onChange={handleChange} className="input-field bg-background" min="1" max="4" required />
            </div>
            <div>
              <LabelWithTooltip label="Training Last Year" tooltip="Number of training programs attended in the last year." />
              <input type="number" name="TrainingTimesLastYear" value={formData.TrainingTimesLastYear} onChange={handleChange} className="input-field bg-background" min="0" max="6" required />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t flex items-center justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center w-full sm:w-auto px-8">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}
