export const analyzeQueryForClarification = async (query) => {
  // First check if query is very short (likely incomplete)
  if (query.split(" ").length < 3) {
    return {
      needsClarification: true,
      question:
        "Your query seems brief. Could you provide more details about what you want to know?",
    };
  }

  // Define areas that commonly need clarification
  const ambiguityTypes = [
    { pattern: /show|display|get/i, aspect: "time period" },
    { pattern: /sales|revenue|amount/i, aspect: "product specificity" },
    { pattern: /customer|customers/i, aspect: "customer segmentation" },
    { pattern: /compare|comparison/i, aspect: "comparison metrics" },
    {
      pattern: /top|best|highest/i,
      aspect: "result count and ranking criteria",
    },
    { pattern: /join/i, aspect: "join relationships" },
    {
      pattern: /average|avg|mean/i,
      aspect: "grouping and calculation method",
    },
    { pattern: /duplicate|duplicates/i, aspect: "duplicate handling" },
  ];

  const joinPatterns = [
    { pattern: /inner\s+join|join/i, type: "inner join" },
    { pattern: /left\s+join/i, type: "left join" },
    { pattern: /right\s+join/i, type: "right join" },
    { pattern: /full\s+join|full\s+outer\s+join/i, type: "full join" },
    { pattern: /cross\s+join/i, type: "cross join" },
  ];

  const lowercaseQuery = query.toLowerCase();

  // Special handling for join operations
  for (const { pattern, type } of joinPatterns) {
    if (pattern.test(lowercaseQuery)) {
      return {
        needsClarification: true,
        question: `I noticed you want to perform a ${type}. Could you specify which tables you want to join and on which columns?`,
        joinType: type,
      };
    }
  }

  // Check for generic duplicates handling
  if (/duplicate|duplicates/i.test(lowercaseQuery)) {
    return {
      needsClarification: true,
      question:
        "I noticed your query might involve duplicate data. Would you like to include or exclude duplicates in the results?",
      duplicateHandling: true,
    };
  }

  // Check for other ambiguities that might need clarification
  for (const { pattern, aspect } of ambiguityTypes) {
    if (pattern.test(lowercaseQuery)) {
      return {
        needsClarification: true,
        question: `Could you provide more details about the ${aspect} in your query?`,
      };
    }
  }

  return { needsClarification: false };
};

export const generateEnhancedJoinQuery = async (originalQuery, clarification, joinType) => {
  return `${originalQuery} (Join details: ${clarification})`;
};

export const generateDuplicateHandlingQuery = async (originalQuery, clarification) => {
  return `${originalQuery} (Duplicate handling: ${clarification})`;
};

export const handleDuplicateDataClarification = async (query) => {
  return "Do you want to include or exclude duplicates?";
};
