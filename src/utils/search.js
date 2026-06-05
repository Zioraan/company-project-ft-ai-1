export function findCandidateById(candidates, id) {
    for (const candidate of candidates) {
        if (candidate.id === id) {
            return candidate;
        }
    }
    return null;
}
export function findCandidateByEmail(candidates, email) {
    const normalizedEmail = email.toLowerCase();
    for (const candidate of candidates) {
        if (candidate.email.toLowerCase() === normalizedEmail) {
            return candidate;
        }
    }
    return null;
}
export function binarySearchCandidateBySalary(sortedCandidates, targetSalary) {
    let leftIndex = 0;
    let rightIndex = sortedCandidates.length - 1;
    while (leftIndex <= rightIndex) {
        const middleIndex = Math.floor((leftIndex + rightIndex) / 2);
        const middleSalary = sortedCandidates[middleIndex]?.expectedSalary;
        if (middleSalary === targetSalary) {
            return middleIndex;
        }
        if (middleSalary === undefined || middleSalary > targetSalary) {
            rightIndex = middleIndex - 1;
        }
        else {
            leftIndex = middleIndex + 1;
        }
    }
    return -1;
}
