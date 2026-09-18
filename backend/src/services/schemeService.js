const toBool = (value, fallback = false) => {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') {
		const v = value.toLowerCase().trim();
		if (v === 'true' || v === 'yes' || v === '1') return true;
		if (v === 'false' || v === 'no' || v === '0') return false;
	}
	return fallback;
};

const toNumber = (value, fallback = 0) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
};

const hasCropText = (crop) => String(crop || '').trim().length > 0;

const CATALOG = [
	{
		id: 'pm-kisan',
		name: { en: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', te: 'ప్రధాన్ మంత్రి కిసాన్ సమ్మాన్ నిధి (PM-KISAN)' },
		description: {
			en: 'Direct income support scheme for eligible landholding farmer families.',
			te: 'అర్హత గల భూమి కలిగిన రైతు కుటుంబాలకు నేరుగా ఆదాయ మద్దతు అందించే పథకం.',
		},
		reason: {
			en: 'Landholding farmer profile with Aadhaar, bank linkage, and valid income range matches PM-KISAN baseline conditions.',
			te: 'భూమి కలిగి ఉండటం, ఆధార్/బ్యాంక్ లింకేజ్, మరియు సరైన ఆదాయ పరిమితి PM-KISAN మౌలిక షరతులకు సరిపోతాయి.',
		},
		benefit: {
			en: '₹6,000 per year in three equal installments, subject to active beneficiary status.',
			te: 'సక్రియ లబ్ధిదారు స్థితి ఆధారంగా సంవత్సరానికి ₹6,000 ను 3 విడతలుగా అందిస్తారు.',
		},
		applyAt: 'https://pmkisan.gov.in/',
		officialSource: 'PM-KISAN Portal',
		isEligible: (p) => (
			p.isIndianResident
			&& p.landHectares > 0
			&& p.hasAadhaar
			&& p.hasBankAccount
			&& p.annualIncome >= 0
			&& p.annualIncome <= 1200000
		),
	},
	{
		id: 'pmfby',
		name: { en: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', te: 'ప్రధాన్ మంత్రి ఫసల్ బీమా యోజన (PMFBY)' },
		description: {
			en: 'Crop insurance scheme protecting farmers from weather, pest, and disease-linked losses.',
			te: 'వాతావరణం, పురుగులు, వ్యాధుల వల్ల పంట నష్టానికి బీమా రక్షణ ఇచ్చే పథకం.',
		},
		reason: {
			en: 'Active cultivation with insurance intent and pre-season enrollment readiness aligns with PMFBY conditions.',
			te: 'సక్రియ సాగు, బీమా అవసరం, మరియు సీజన్‌కు ముందు నమోదు సిద్ధత PMFBY షరతులకు సరిపోతాయి.',
		},
		benefit: {
			en: 'Insurance claim support for notified crop losses as per state and season notification.',
			te: 'రాష్ట్ర/సీజన్ నోటిఫికేషన్ ప్రకారం నష్టపోయిన నోటిఫైడ్ పంటలకు బీమా క్లెయిమ్ మద్దతు.',
		},
		applyAt: 'https://pmfby.gov.in/',
		officialSource: 'PMFBY Portal',
		isEligible: (p) => (
			p.hasCropCultivation
			&& p.hasCropInsuranceNeed
			&& p.hasEnrolledBeforeSeason
			&& p.landHectares > 0
		),
	},
	{
		id: 'soil-health-card',
		name: { en: 'Soil Health Card Scheme', te: 'మట్టి ఆరోగ్య కార్డు పథకం' },
		description: {
			en: 'Supports nutrient-based fertilizer planning through soil testing recommendations.',
			te: 'మట్టి పరీక్షల ఆధారంగా ఎరువుల ప్రణాళికకు పోషక సూచనలు అందించే పథకం.',
		},
		reason: {
			en: 'Crop cultivation profile is typically eligible for soil testing advisory support.',
			te: 'పంట సాగు ప్రొఫైల్‌కు మట్టి పరీక్ష సలహా మద్దతు సాధారణంగా వర్తిస్తుంది.',
		},
		benefit: {
			en: 'Soil health card with nutrient status and crop-wise recommendations.',
			te: 'పోషకాల స్థితి మరియు పంటలవారీ సూచనలతో మట్టి ఆరోగ్య కార్డు.',
		},
		applyAt: 'https://soilhealth.dac.gov.in/',
		officialSource: 'Soil Health Card Portal',
		isEligible: (p) => p.hasCropCultivation && p.landHectares > 0,
	},
	{
		id: 'e-nam',
		name: { en: 'National Agriculture Market (e-NAM)', te: 'జాతీయ వ్యవసాయ మార్కెట్ (e-NAM)' },
		description: {
			en: 'Online agri-market platform for improved price discovery and market linkage.',
			te: 'మెరుగైన ధరల కనుగొనిక మరియు మార్కెట్ అనుసంధానం కోసం ఆన్‌లైన్ వ్యవసాయ వేదిక.',
		},
		reason: {
			en: 'Farmers with marketable produce can use e-NAM for broader mandi access.',
			te: 'మార్కెట్‌లో అమ్మదగిన ఉత్పత్తి ఉన్న రైతులు e-NAM ద్వారా విస్తృత మండీ యాక్సెస్ పొందవచ్చు.',
		},
		benefit: {
			en: 'Access to wider mandi network and transparent price information.',
			te: 'విస్తృత మండీ నెట్‌వర్క్ మరియు పారదర్శక ధర సమాచారం అందుబాటులో ఉంటుంది.',
		},
		applyAt: 'https://www.enam.gov.in/',
		officialSource: 'e-NAM Portal',
		isEligible: (p) => p.hasCropCultivation && p.landHectares > 0,
	},
	{
		id: 'pmksy-micro-irrigation',
		name: { en: 'PMKSY - Per Drop More Crop (Micro Irrigation)', te: 'PMKSY - పర్ డ్రాప్ మోర్ క్రాప్ (సూక్ష్మ నీటిపారుదల)' },
		description: {
			en: 'Promotes efficient irrigation systems with subsidy support under state norms.',
			te: 'రాష్ట్ర నియమాల ప్రకారం సమర్థవంతమైన నీటిపారుదల వ్యవస్థలకు సబ్సిడీ మద్దతు ఇచ్చే పథకం.',
		},
		reason: {
			en: 'Small-to-medium landholding with irrigation requirement aligns with micro irrigation support.',
			te: 'చిన్న/మధ్య భూవిస్తీర్ణం మరియు నీటిపారుదల అవసరం ఉండటం సూక్ష్మ నీటిపారుదల మద్దతుకు సరిపోతుంది.',
		},
		benefit: {
			en: 'Subsidy support for drip/sprinkler setup as per state implementation.',
			te: 'రాష్ట్ర అమలు ప్రకారం డ్రిప్/స్ప్రింక్లర్ ఏర్పాటుకు సబ్సిడీ మద్దతు లభిస్తుంది.',
		},
		applyAt: 'https://pmksy.gov.in/',
		officialSource: 'PMKSY Portal',
		isEligible: (p) => p.needsIrrigation && p.landHectares > 0 && p.landHectares <= 10,
	},
];

const normalizeProfile = ({ land, income, state, language = 'en', crop, ...rest }) => {
	const landAcres = toNumber(land, 0);
	const landHectares = rest.landHectares
		? toNumber(rest.landHectares, 0)
		: landAcres > 0
			? landAcres * 0.404686
			: 0;

	const cropText = String(crop || rest.crop || '').trim();

	return {
		state: String(state || rest.state || 'India').trim(),
		language: language === 'te' ? 'te' : 'en',
		crop: cropText,
		landHectares,
		annualIncome: toNumber(income ?? rest.annualIncome, 0),
		isIndianResident: toBool(rest.isIndianResident, true),
		hasCropCultivation: toBool(rest.hasCropCultivation, hasCropText(cropText)),
		hasCropInsuranceNeed: toBool(rest.hasCropInsuranceNeed, false),
		needsIrrigation: toBool(rest.needsIrrigation, false),
		hasAadhaar: toBool(rest.hasAadhaar, false),
		hasBankAccount: toBool(rest.hasBankAccount, false),
		hasEnrolledBeforeSeason: toBool(rest.hasEnrolledBeforeSeason, false),
	};
};

export const generateSchemes = async (input) => {
	const profile = normalizeProfile(input || {});
	const language = profile.language;

	const eligible = CATALOG
		.filter((scheme) => scheme.isEligible(profile))
		.map((scheme) => ({
			id: scheme.id,
			name: scheme.name[language],
			description: scheme.description[language],
			eligibility: scheme.reason[language],
			benefit: scheme.benefit[language],
			applyAt: scheme.applyAt,
			officialSource: scheme.officialSource,
			eligibilityStatus: language === 'te' ? 'సంభావ్య అర్హత' : 'Likely Eligible',
			lastVerifiedAt: new Date().toISOString(),
		}));

	return eligible;
};

export default generateSchemes;