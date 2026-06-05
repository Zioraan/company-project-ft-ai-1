const SENIORITY_ORDER = ["Junior", "Semi-Senior", "Senior", "Lead", "Executive"];
const ENGLISH_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
function roundToTwoDecimals(value) {
    return Math.round(value * 100) / 100;
}
function calculateSkillsScore(candidate, vacancy) {
    const requiredSkills = vacancy.requiredSkills.map((skill) => skill.toLowerCase());
    const candidateSkills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
    let score = 0;
    const matchedRequiredSkills = requiredSkills.filter((skill) => candidateSkills.has(skill)).length;
    if (requiredSkills.length > 0 && matchedRequiredSkills === requiredSkills.length) {
        score += 40;
    }
    else if (requiredSkills.length > 0 && matchedRequiredSkills / requiredSkills.length >= 0.5) {
        score += 20;
    }
    const preferredSkills = vacancy.preferredSkills.map((skill) => skill.toLowerCase());
    const matchedPreferredSkills = preferredSkills.filter((skill) => candidateSkills.has(skill)).length;
    score += Math.min(matchedPreferredSkills * 10, 20);
    return score;
}
function calculateExperienceScore(candidate, vacancy) {
    const years = candidate.yearsOfExperience;
    const { minYearsExperience, maxYearsExperience } = vacancy;
    if (years >= minYearsExperience && years <= maxYearsExperience) {
        return 20;
    }
    const distanceToRange = Math.min(Math.abs(years - minYearsExperience), Math.abs(years - maxYearsExperience));
    if (distanceToRange <= 2) {
        return 10;
    }
    return 0;
}
function calculateSeniorityScore(candidate, vacancy) {
    const candidateIndex = SENIORITY_ORDER.indexOf(candidate.seniority);
    const vacancyIndex = SENIORITY_ORDER.indexOf(vacancy.requiredSeniority);
    if (candidateIndex === vacancyIndex) {
        return 15;
    }
    if (Math.abs(candidateIndex - vacancyIndex) === 1) {
        return 7;
    }
    return 0;
}
function calculateEnglishScore(candidate, vacancy) {
    const candidateIndex = ENGLISH_ORDER.indexOf(candidate.englishLevel);
    const requiredIndex = ENGLISH_ORDER.indexOf(vacancy.requiredEnglishLevel);
    return candidateIndex >= requiredIndex ? 15 : 0;
}
function calculateSalaryScore(candidate, vacancy) {
    const { expectedSalary } = candidate;
    const { salaryRangeMin, salaryRangeMax } = vacancy;
    if (expectedSalary >= salaryRangeMin && expectedSalary <= salaryRangeMax) {
        return 10;
    }
    const maxWithTolerance = salaryRangeMax * 1.2;
    if (expectedSalary > salaryRangeMax && expectedSalary <= maxWithTolerance) {
        return 5;
    }
    return 0;
}
export function calculateCandidateScore(candidate, vacancy) {
    const totalScore = calculateSkillsScore(candidate, vacancy) +
        calculateExperienceScore(candidate, vacancy) +
        calculateSeniorityScore(candidate, vacancy) +
        calculateEnglishScore(candidate, vacancy) +
        calculateSalaryScore(candidate, vacancy);
    return Math.min(totalScore, 100);
}
export function rankCandidatesForVacancy(candidates, vacancy) {
    return candidates
        .map((candidate) => ({
        candidate,
        score: calculateCandidateScore(candidate, vacancy)
    }))
        .sort((left, right) => right.score - left.score);
}
export function groupCandidatesBySeniority(candidates) {
    const grouped = {
        Junior: [],
        "Semi-Senior": [],
        Senior: [],
        Lead: [],
        Executive: []
    };
    for (const candidate of candidates) {
        grouped[candidate.seniority].push(candidate);
    }
    return grouped;
}
export function countCandidatesByStatus(candidates) {
    const counters = {
        Active: 0,
        "In process": 0,
        Hired: 0,
        Inactive: 0
    };
    for (const candidate of candidates) {
        counters[candidate.status] += 1;
    }
    return counters;
}
export function calculateAverageSalary(candidates) {
    if (candidates.length === 0) {
        return 0;
    }
    const total = candidates.reduce((accumulator, candidate) => accumulator + candidate.expectedSalary, 0);
    return roundToTwoDecimals(total / candidates.length);
}
export function findTopSkills(candidates, topN) {
    if (topN <= 0) {
        return [];
    }
    const skillCounter = new Map();
    for (const candidate of candidates) {
        for (const skill of candidate.skills) {
            const normalizedSkill = skill.toLowerCase();
            skillCounter.set(normalizedSkill, (skillCounter.get(normalizedSkill) ?? 0) + 1);
        }
    }
    return [...skillCounter.entries()]
        .map(([skill, count]) => ({ skill, count }))
        .sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }
        return left.skill.localeCompare(right.skill);
    })
        .slice(0, topN);
}
export function calculateVacancyFillRate(processes) {
    if (processes.length === 0) {
        return 0;
    }
    const hiredCount = processes.filter((process) => process.stage === "Hired").length;
    return roundToTwoDecimals((hiredCount / processes.length) * 100);
}
