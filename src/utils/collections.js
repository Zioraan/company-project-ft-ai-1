export function filterCandidatesBySkills(candidates, requiredSkills) {
    if (requiredSkills.length === 0) {
        return [...candidates];
    }
    const normalizedRequiredSkills = requiredSkills.map((skill) => skill.toLowerCase());
    return candidates.filter((candidate) => {
        const candidateSkills = candidate.skills.map((skill) => skill.toLowerCase());
        return normalizedRequiredSkills.every((requiredSkill) => candidateSkills.includes(requiredSkill));
    });
}
export function filterCandidatesBySeniority(candidates, seniority) {
    return candidates.filter((candidate) => candidate.seniority === seniority);
}
export function filterCandidatesByAvailability(candidates, availability) {
    if (availability.length === 0) {
        return [];
    }
    return candidates.filter((candidate) => availability.includes(candidate.availability));
}
export function sortCandidatesBySalary(candidates, order) {
    const sortedCandidates = [...candidates];
    const direction = order === "asc" ? 1 : -1;
    return sortedCandidates.sort((leftCandidate, rightCandidate) => {
        return (leftCandidate.expectedSalary - rightCandidate.expectedSalary) * direction;
    });
}
export function sortCandidatesByExperience(candidates, order) {
    const sortedCandidates = [...candidates];
    const direction = order === "asc" ? 1 : -1;
    return sortedCandidates.sort((leftCandidate, rightCandidate) => {
        return (leftCandidate.yearsOfExperience - rightCandidate.yearsOfExperience) * direction;
    });
}
