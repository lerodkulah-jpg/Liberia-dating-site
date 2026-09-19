export type RiskAssessment = {
  score: number;
  reasons: string[];
  level: "low" | "medium" | "high" | "critical";
  requiresHumanReview: boolean;
};

const suspiciousLinkPattern = /(https?:\/\/|www\.)/i;
const scamMoneyPattern = /(?:send|transfer|wire|mobile money|cash app|bitcoin|loan|bank|airtime|pay|donate|support.*money|help.*money)/i;
const abusivePattern = /\b(?:idiot|stupid|dumb|loser|hate|nasty|crazy|worthless|fool)\b/i;
const botPattern = /(?:!!|\b(?:vip|urgent|click here|claim now|limited time|free gift|instant cash)\b)/i;

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function computeLevel(score: number): RiskAssessment["level"] {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function evaluateMessageRisk({
  content,
  recentMessageCount,
  recentUniqueRecipients,
  repeatedMessages,
}: {
  content: string;
  recentMessageCount: number;
  recentUniqueRecipients: number;
  repeatedMessages: number;
}): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (suspiciousLinkPattern.test(content)) {
    score += 22;
    reasons.push("Suspicious links");
  }

  if (scamMoneyPattern.test(content)) {
    score += 25;
    reasons.push("Repeated money requests");
  }

  if (abusivePattern.test(content)) {
    score += 18;
    reasons.push("Abusive message");
  }

  if (botPattern.test(content)) {
    score += 12;
    reasons.push("Bot-like messaging");
  }

  if (recentMessageCount >= 12) {
    score += 18;
    reasons.push("Mass messaging");
  }

  if (recentUniqueRecipients >= 8) {
    score += 14;
    reasons.push("High-volume outreach");
  }

  if (repeatedMessages >= 3) {
    score += 14;
    reasons.push("Repeated copy-paste behavior");
  }

  const finalScore = clampScore(score);
  const reasonsUnique = Array.from(new Set(reasons));

  return {
    score: finalScore,
    reasons: reasonsUnique,
    level: computeLevel(finalScore),
    requiresHumanReview: finalScore >= 40,
  };
}

export function evaluateLikeRisk({
  likesToday,
  likesInLastTenMinutes,
  uniqueProfilesLiked,
  isSuperLike,
}: {
  likesToday: number;
  likesInLastTenMinutes: number;
  uniqueProfilesLiked: number;
  isSuperLike: boolean;
}): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (likesToday >= 30) {
    score += 20;
    reasons.push("High daily like volume");
  }

  if (likesInLastTenMinutes >= 8) {
    score += 18;
    reasons.push("Rapid-fire engagement");
  }

  if (uniqueProfilesLiked >= 12 && likesInLastTenMinutes >= 5) {
    score += 18;
    reasons.push("Mass liking pattern");
  }

  if (isSuperLike && likesToday >= 3) {
    score += 12;
    reasons.push("Bot-like boost usage");
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    reasons: Array.from(new Set(reasons)),
    level: computeLevel(finalScore),
    requiresHumanReview: finalScore >= 40,
  };
}

export function evaluateProfileRisk({
  bio,
  interests,
  profileImage,
  username,
  firstName,
  createdAt,
}: {
  bio?: string | null;
  interests?: string | null;
  profileImage?: string | null;
  username?: string | null;
  firstName?: string | null;
  createdAt?: Date | string | null;
}): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  if (!bio || bio.trim().length < 20) {
    score += 18;
    reasons.push("Minimal profile details");
  }

  if (!interests || interests.trim().length < 10) {
    score += 12;
    reasons.push("Sparse profile interests");
  }

  if (!profileImage) {
    score += 16;
    reasons.push("No profile photo");
  }

  if (username && /(?:admin|support|love|dating|bot|free|click|test|vip)/i.test(username)) {
    score += 16;
    reasons.push("Suspicious username pattern");
  }

  if (firstName && /(?:admin|bot|test|support)/i.test(firstName)) {
    score += 12;
    reasons.push("Fake profile naming pattern");
  }

  if (createdAt) {
    const createdMs = new Date(createdAt).getTime();
    const ageMs = Date.now() - createdMs;
    const ageInMinutes = ageMs / 60000;

    if (ageInMinutes < 5) {
      score += 12;
      reasons.push("New account with rapid activity");
    }
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    reasons: Array.from(new Set(reasons)),
    level: computeLevel(finalScore),
    requiresHumanReview: finalScore >= 40,
  };
}

export function buildRiskSummary(assessment: RiskAssessment, context: string) {
  return `System risk assessment (${assessment.score}/100): ${assessment.reasons.join(", ") || "No major signals"}. Context: ${context}. Human moderation review required.`;
}

export function assessAccountRisk(assessment: RiskAssessment, source: string, notes?: string) {
  return {
    score: assessment.score,
    level: assessment.level,
    reasons: assessment.reasons.join(", ") || "No major signals",
    source,
    notes: notes || "Flagged for human moderation review.",
    requiresHumanReview: assessment.requiresHumanReview,
  };
}
