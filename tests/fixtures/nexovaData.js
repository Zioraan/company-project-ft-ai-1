export const sampleCandidates = [
    {
        id: "C-2024-0451",
        fullName: "María González",
        email: "maria.gonzalez@email.com",
        phone: "+56912345678",
        yearsOfExperience: 5,
        skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
        englishLevel: "B2",
        seniority: "Semi-Senior",
        currentSalary: 3500,
        expectedSalary: 4200,
        availability: "1 month",
        location: "Valencia, Spain",
        remoteOnly: false,
        status: "Active"
    },
    {
        id: "C-2024-0452",
        fullName: "Juan Pérez",
        email: "juan.perez@email.com",
        phone: "+56987654321",
        yearsOfExperience: 3,
        skills: ["JavaScript", "React", "CSS", "HTML"],
        englishLevel: "B1",
        seniority: "Junior",
        currentSalary: 2200,
        expectedSalary: 2800,
        availability: "Immediate",
        location: "Miami, Florida, United States",
        remoteOnly: true,
        status: "Active"
    },
    {
        id: "C-2024-0453",
        fullName: "Carolina Silva",
        email: "carolina.silva@email.com",
        phone: "+56911223344",
        yearsOfExperience: 8,
        skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
        englishLevel: "C1",
        seniority: "Senior",
        currentSalary: 5500,
        expectedSalary: 6500,
        availability: "2 weeks",
        location: "Valencia, Spain",
        remoteOnly: false,
        status: "In process"
    }
];
export const sampleVacancy = {
    id: "V-2024-0892",
    title: "Senior Full-Stack Developer",
    companyName: "TechCorp Solutions",
    requiredSkills: ["TypeScript", "React", "Node.js"],
    preferredSkills: ["PostgreSQL", "Docker"],
    minYearsExperience: 4,
    maxYearsExperience: 8,
    requiredEnglishLevel: "B2",
    requiredSeniority: "Senior",
    salaryRangeMin: 5000,
    salaryRangeMax: 7000,
    isRemote: true,
    location: "Remote",
    status: "Open"
};
export const sampleProcesses = [
    {
        id: "SP-2024-0001",
        candidateId: "C-2024-0451",
        vacancyId: "V-2024-0892",
        stage: "Interview",
        score: 70,
        notes: "Strong candidate",
        createdAt: new Date("2026-01-10T10:00:00.000Z"),
        updatedAt: new Date("2026-01-12T10:00:00.000Z")
    },
    {
        id: "SP-2024-0002",
        candidateId: "C-2024-0452",
        vacancyId: "V-2024-0892",
        stage: "Rejected",
        score: 35,
        notes: "Missing required skills",
        createdAt: new Date("2026-01-11T10:00:00.000Z"),
        updatedAt: new Date("2026-01-13T10:00:00.000Z")
    },
    {
        id: "SP-2024-0003",
        candidateId: "C-2024-0453",
        vacancyId: "V-2024-0892",
        stage: "Hired",
        score: 87,
        notes: "Excellent fit",
        createdAt: new Date("2026-01-14T10:00:00.000Z"),
        updatedAt: new Date("2026-01-20T10:00:00.000Z")
    }
];
