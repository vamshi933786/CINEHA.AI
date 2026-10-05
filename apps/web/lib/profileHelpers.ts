import type {
  CreatorProfileData,
  ProfileCompleteness,
  PersonaPreviewResponse,
  CategoryCompleteness,
} from "@/types/creatorProfile";

export function computeClientCompleteness(
  data: Partial<CreatorProfileData>
): ProfileCompleteness {
  const categories: CategoryCompleteness[] = [];
  const recommendations: string[] = [];

  // 1. Identity (15%)
  const hasName = Boolean(data.creator_name?.trim());
  const hasBio = Boolean(data.creator_bio?.trim());
  const hasType = Boolean(data.creator_type?.trim());
  const identityComplete = hasName && (hasBio || hasType);
  categories.push({
    category: "Identity & Bio",
    completed: identityComplete,
    weight: 15,
    details: identityComplete
      ? "Name and creator profile defined"
      : "Add creator name and bio/type",
  });
  if (!hasName) recommendations.push("Provide your creator name.");
  else if (!hasBio) recommendations.push("Add a creator bio to personalize AI tone.");

  // 2. Content Niche & Pillars (20%)
  const hasNiche = Boolean(data.niche?.trim());
  const hasPillars = Boolean(data.content_pillars && data.content_pillars.length > 0);
  const nicheComplete = hasNiche && hasPillars;
  categories.push({
    category: "Niche & Content Pillars",
    completed: nicheComplete,
    weight: 20,
    details: nicheComplete
      ? "Niche and content pillars set"
      : "Define primary vertical and core content pillars",
  });
  if (!hasNiche) recommendations.push("Specify your primary content niche.");
  else if (!hasPillars) recommendations.push("Add at least 1-2 core content pillars.");

  // 3. Audience Persona (20%)
  const hasAudience = Boolean(data.target_audience?.trim());
  const hasPainOrInterests = Boolean(
    (data.audience_pain_points && data.audience_pain_points.length > 0) ||
      (data.audience_interests && data.audience_interests.length > 0)
  );
  const audienceComplete = hasAudience || hasPainOrInterests;
  categories.push({
    category: "Target Audience",
    completed: audienceComplete,
    weight: 20,
    details: audienceComplete
      ? "Target audience demographics defined"
      : "Specify who your videos are created for",
  });
  if (!audienceComplete) {
    recommendations.push("Describe your target audience or their key pain points.");
  }

  // 4. Voice & Style (15%)
  const hasTones = Boolean(data.content_tones && data.content_tones.length > 0);
  const hasStyle = Boolean(
    data.energy || data.storytelling_style || data.custom_tone_notes
  );
  const voiceComplete = hasTones && hasStyle;
  categories.push({
    category: "Voice & Delivery Style",
    completed: voiceComplete,
    weight: 15,
    details: voiceComplete
      ? "Delivery tone and energy calibrated"
      : "Select tones and energy/storytelling style",
  });
  if (!hasTones) recommendations.push("Select at least one content tone.");
  else if (!hasStyle) recommendations.push("Set your energy level or storytelling style.");

  // 5. Language & Script (10%)
  const hasLang = Boolean(data.primary_language?.trim());
  categories.push({
    category: "Language & Script Preference",
    completed: hasLang,
    weight: 10,
    details: hasLang
      ? `Primary language set to ${data.primary_language}`
      : "Choose primary creation language",
  });
  if (!hasLang) recommendations.push("Select your primary content language.");

  // 6. Distribution Channels (10%)
  const hasPlatforms = Boolean(data.platforms && data.platforms.length > 0);
  categories.push({
    category: "Target Platforms",
    completed: hasPlatforms,
    weight: 10,
    details: hasPlatforms
      ? `${data.platforms?.length} distribution platform(s) selected`
      : "Select at least one video platform",
  });
  if (!hasPlatforms) recommendations.push("Select at least one target platform.");

  // 7. Brand Rules & CTA (10%)
  const hasCta = Boolean(data.cta_style?.trim());
  const hasBrand = Boolean(
    data.brand_positioning?.trim() ||
      data.core_message?.trim() ||
      (data.words_to_use && data.words_to_use.length > 0) ||
      (data.style_rules && data.style_rules.length > 0)
  );
  const brandComplete = hasCta || hasBrand;
  categories.push({
    category: "Brand Guidance & CTA",
    completed: brandComplete,
    weight: 10,
    details: brandComplete
      ? "Call-to-action or brand rules established"
      : "Set preferred CTA style or signature vocabulary",
  });
  if (!brandComplete) {
    recommendations.push("Define your default CTA style or signature brand rules.");
  }

  const score = categories.reduce(
    (acc, cat) => acc + (cat.completed ? cat.weight : 0),
    0
  );

  return {
    score,
    categories,
    recommendations,
  };
}

export function computeClientPersonaPreview(
  data: Partial<CreatorProfileData>
): PersonaPreviewResponse {
  const name = data.creator_name?.trim() || "Creator";
  const niche = data.niche?.trim() || "Filmmaking";
  const type = data.creator_type?.trim() || "Creator";
  const language = data.primary_language?.trim() || "Tanglish";
  const tones = data.content_tones && data.content_tones.length > 0
    ? data.content_tones.join(", ")
    : "Educational & Cinematic";
  const energy = data.energy || "High-energy";
  const cta = data.cta_style || "Save this reel";
  const audience = data.target_audience?.trim() || "ambitious creators and viewers";

  const summary = `${name} is a ${type.toLowerCase()} creating ${tones.toLowerCase()} short-form content in the ${niche.toLowerCase()} space for ${audience.toLowerCase()}, communicating in ${language} with ${energy.toLowerCase()} delivery.`;

  let example_hook = "";
  let example_intro = "";
  let example_cta = "";

  if (language === "Telugu") {
    example_hook = `మీరు ${niche} లో ఈ తప్పు చేస్తున్నారా? ఇప్పుడే తెలుసుకోండి!`;
    example_intro = `హలో ఫ్రెండ్స్, నేను ${name}. ఈ రోజు మనం మోస్ట్ ఇంపార్టెంట్ సీక్రెట్ తెలుసుకోబోతున్నాం.`;
    example_cta = `ఈ టిప్ నచ్చితే వెంటనే ${cta} చేయండి, మరిన్ని అప్‌డేట్స్ కోసం ఫాలో అవ్వండి!`;
  } else if (language === "Tanglish") {
    example_hook = `Stop scrolling! Meeru ${niche} lo e mistake chesthunnara? Watch this.`;
    example_intro = `Hey creators, nenu ${name}. Today I'm breaking down the exact cinematic technique.`;
    example_cta = `Ee tip use ayithe immediately ${cta} cheyandi, next video miss avvakandi!`;
  } else {
    example_hook = `Stop making this huge mistake in ${niche} if you want real results.`;
    example_intro = `Hey everyone, I'm ${name}. Today I'm revealing the exact step-by-step breakdown.`;
    example_cta = `If this helped you, make sure to ${cta} and follow for more!`;
  }

  return {
    summary,
    example_hook,
    example_intro,
    example_cta,
    is_ai_generated: false,
  };
}
