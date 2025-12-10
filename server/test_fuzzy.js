function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function normalize(str) {
    return str.replace(/\s+/g, ' ').trim().toUpperCase();
}

function checkSimilarity(newName, existingNames) {
    const normalizedNew = normalize(newName);

    // 1. Exact match check considering normalization (handles double spaces)
    const exactMatch = existingNames.find(n => normalize(n) === normalizedNew);
    if (exactMatch) {
        return { type: 'EXACT', match: exactMatch };
    }

    // 2. Fuzzy match
    const threshold = 2; // Allow 1 or 2 edits? Maybe 2 for longer strings.
    // For short strings, 2 might be too lenient (e.g. "ABC" vs "AB" is 1 distance, "A" is 2).
    // Let's us relative threshold? Or simple absolute.
    // The user's example: "3M DO BRASIL LTDA." vs "3M DO BRASIL LDA"
    // "LDA" vs "LTDA." -> Distance is 2 (insert T, insert .)

    // Let's try 3 as a safe upper bound for warnings
    const matches = existingNames.map(name => {
        const dist = levenshtein(normalizedNew, normalize(name));
        return { name, dist };
    }).filter(x => x.dist <= 3 && x.dist > 0).sort((a, b) => a.dist - b.dist);

    if (matches.length > 0) {
        return { type: 'SIMILAR', matches: matches };
    }

    return { type: 'NONE' };
}

// Test Cases
const existingParam = [
    "3M DO BRASIL LTDA.",
    "BUNGE ALIMENTOS",
    "CARGILL AGRICOLA"
];

const testCases = [
    "3M DO  BRASIL LTDA.", // Double space
    "3M DO BRASIL LDA",    // Missing letters
    "3M  DO BRASIL LTDA",  // Spaces and missing dot
    "BUNGE ALIMENTOS SA"
];

console.log("Existing:", existingParam);
testCases.forEach(tc => {
    console.log(`\nTesting: "${tc}"`);
    console.log("Result:", checkSimilarity(tc, existingParam));
});
