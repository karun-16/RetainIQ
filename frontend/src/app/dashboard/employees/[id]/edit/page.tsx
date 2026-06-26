'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import EmployeeForm from '@/components/EmployeeForm';
import { Loader2 } from 'lucide-react';

export default function EditEmployeePage() {
  const params = useParams();
  const id = params.id as string;
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        // Map database fields to form data fields
        const initialData = {
          name: data.name,
          Age: data.age,
          BusinessTravel: data.business_travel,
          DailyRate: data.daily_rate,
          Department: 'Research & Development', // We need to fetch the actual department name or just map it later
          DistanceFromHome: data.distance_from_home,
          Education: data.education,
          EducationField: data.education_field,
          EnvironmentSatisfaction: data.environment_satisfaction,
          Gender: data.gender,
          HourlyRate: data.hourly_rate,
          JobInvolvement: data.job_involvement,
          JobLevel: data.job_level,
          JobRole: data.job_role,
          JobSatisfaction: data.job_satisfaction,
          MaritalStatus: data.marital_status,
          MonthlyIncome: data.monthly_income,
          MonthlyRate: data.monthly_rate,
          NumCompaniesWorked: data.num_companies_worked,
          OverTime: data.over_time,
          PercentSalaryHike: data.percent_salary_hike,
          PerformanceRating: data.performance_rating,
          RelationshipSatisfaction: data.relationship_satisfaction,
          StockOptionLevel: data.stock_option_level,
          TotalWorkingYears: data.total_working_years,
          TrainingTimesLastYear: data.training_times_last_year,
          WorkLifeBalance: data.work_life_balance,
          YearsAtCompany: data.years_at_company,
          YearsInCurrentRole: data.years_in_current_role,
          YearsSinceLastPromotion: data.years_since_last_promotion,
          YearsWithCurrManager: data.years_with_curr_manager,
        };
        
        // Let's get department name properly
        if (data.department_id) {
          const { data: deptData } = await supabase.from('departments').select('name').eq('id', data.department_id).single();
          if (deptData) {
            initialData.Department = deptData.name;
          }
        }
        
        setEmployee(initialData);
      }
      setLoading(false);
    }
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <div>Employee not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <EmployeeForm employeeId={id} initialData={employee} />
    </div>
  );
}
