import { NextResponse } from "next/server";

function transformPayload(body: any) {
  const age = body.age ?? 20;
  const gender = (body.gender && body.gender.toLowerCase() === "male") ? 1 : 0;
  const family_income = body.family_income ?? 3000.0;
  const internet_access = body.internet_access ? 1 : 0;
  const study_hours = body.study_hours_per_day ?? 2.0;
  const attendance = body.attendance_rate ?? 100.0;
  const delay = body.assignment_delay_days ?? 0;
  const travel = body.travel_time_minutes ?? 15;
  const part_time = body.part_time_job ? 1 : 0;
  const scholarship = body.has_scholarship ? 1 : 0;
  
  const stress_index = body.stress_index ?? 3.0;
  
  const gpa = body.gpa ?? 4.0;
  const semester_gpa = body.semester_gpa ?? 4.0;
  const cgpa = body.cgpa ?? 4.0;
  const financial_problem = body.financial_problem ? 1 : 0;
  
  const semester_year = body.semester_year ?? 1;
  const sem1 = semester_year === 1 ? 1 : 0;
  const sem2 = semester_year === 2 ? 1 : 0;
  const sem3 = semester_year === 3 ? 1 : 0;
  const sem4 = semester_year === 4 ? 1 : 0;
  
  const dept = body.department ? body.department.trim() : "CS";
  const deptArts = dept === "Arts" ? 1 : 0;
  const deptBusiness = dept === "Business" ? 1 : 0;
  const deptCS = dept === "CS" ? 1 : 0;
  const deptEngineering = dept === "Engineering" ? 1 : 0;
  const deptScience = dept === "Science" ? 1 : 0;
  
  const parent_edu = body.parent_education ? body.parent_education.trim() : "";
  const parentBachelor = parent_edu === "Bachelor" ? 1 : 0;
  const parentHighSchool = (parent_edu === "High School" || !parent_edu) ? 1 : 0;
  const parentMaster = parent_edu === "Master" ? 1 : 0;
  const parentPhD = parent_edu === "PhD" ? 1 : 0;
  
  const gpa_attendance = gpa * attendance;
  const cgpa_attendance = cgpa * attendance;

  return {
    "Age": age,
    "Gender": gender,
    "Family_Income": family_income,
    "Internet_Access": internet_access,
    "Study_Hours_per_Day": study_hours,
    "Attendance_Rate": attendance,
    "Assignment_Delay_Days": delay,
    "Travel_Time_Minutes": travel,
    "Part_Time_Job": part_time,
    "Scholarship": scholarship,
    "Stress_Index": stress_index,
    "GPA": gpa,
    "Semester_GPA": semester_gpa,
    "CGPA": cgpa,
    "Semester_Year 1": sem1,
    "Semester_Year 2": sem2,
    "Semester_Year 3": sem3,
    "Semester_Year 4": sem4,
    "Department_Arts": deptArts,
    "Department_Business": deptBusiness,
    "Department_CS": deptCS,
    "Department_Engineering": deptEngineering,
    "Department_Science": deptScience,
    "Parent_Bachelor": parentBachelor,
    "Parent_High School": parentHighSchool,
    "Parent_Master": parentMaster,
    "Parent_PhD": parentPhD,
    "Financial_Problem": financial_problem,
    "GPA_Attendance_Interaction": gpa_attendance,
    "CGPA_Attendance_Interaction": cgpa_attendance
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

    // Detect if payload is already in 30-feature model format
    const isModelFormat = "Age" in body || "Gender" in body;
    const fastApiPayload = isModelFormat ? body : transformPayload(body);

    const response = await fetch(`${backendUrl}/predict/single`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fastApiPayload),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned status ${response.status}`);
    }

    const data = await response.json();
    
    let recommendation = "Safe: Student performance is stable. Continue standard academic pathway.";
    if (data.risk_level === "High-Risk") {
      recommendation = "High-Risk: High dropout risk detected. Urgently schedule direct administrative and counselor meetings.";
    } else if (data.risk_level === "At-Risk") {
      recommendation = "At-Risk: Check-in with student. Recommend academic tutoring or peer study groups.";
    }

    return NextResponse.json({
      dropout_probability: data.dropout_probability,
      tier: data.risk_level,
      recommendation: recommendation
    });
  } catch (error) {
    console.warn("FastAPI prediction offline, falling back:", error);
    return NextResponse.json(
      { detail: "Failed to connect to ML Backend" },
      { status: 500 }
    );
  }
}
