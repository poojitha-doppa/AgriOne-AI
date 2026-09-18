import generateSchemes from '../services/schemeService.js';

// POST /api/schemes
export const findSchemes = async (req, res) => {
  try {
    const { land, crop, income, state } = req.body;
    const language = String(req.body?.language || req.body?.lang || '').toLowerCase() === 'te' ? 'te' : 'en';

    if (!land || !crop || !income) {
      return res.status(400).json({
        success: false,
        message: 'land, crop, and income are required',
        requestId: req.requestId,
      });
    }

    const landNum = parseFloat(land);
    const incomeNum = parseFloat(income);
    if (isNaN(landNum) || landNum <= 0) {
      return res.status(422).json({ success: false, message: 'land must be a positive number', requestId: req.requestId });
    }
    if (isNaN(incomeNum) || incomeNum < 0) {
      return res.status(422).json({ success: false, message: 'income must be a non-negative number', requestId: req.requestId });
    }

    console.log(`[Schemes] crop=${crop}, land=${landNum}ac, state=${state || 'N/A'}`);
    const schemes = await generateSchemes({
      land: landNum,
      crop: crop.trim(),
      income: incomeNum,
      state: state?.trim(),
      language,
    });

    return res.json({
      success: true,
      message: 'Schemes fetched successfully',
      requestId: req.requestId,
      data: schemes,
    });
  } catch (err) {
    console.error('[Schemes] Controller error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};

// POST /api/schemes/eligibility
// Compatibility endpoint used by SchemeResults page.
export const checkEligibility = async (req, res) => {
  try {
    const body = req.body || {};
    const language = String(body.language || body.lang || '').toLowerCase() === 'te' ? 'te' : 'en';
    const state = body.state || 'Andhra Pradesh';

    const landFromHectares = Number(body.landHectares || 0);
    const landFromAcres = Number(body.landAcres || 0) * 0.404686;
    const landHectares = landFromHectares > 0 ? landFromHectares : landFromAcres;
    const annualIncome = Number.isFinite(Number(body.annualIncome)) ? Number(body.annualIncome) : null;

    if (!Number.isFinite(landHectares) || landHectares <= 0) {
      return res.status(422).json({
        success: false,
        message: 'landHectares or landAcres must be a positive number',
        requestId: req.requestId,
      });
    }

    const hectaresToAcres = landHectares / 0.404686;
    const crop = String(body.crop || 'general crop');
    const schemes = await generateSchemes({
      land: Number(hectaresToAcres.toFixed(2)),
      crop,
      income: annualIncome ?? 0,
      state,
      language,
      hasAadhaar: body.hasAadhaar,
      hasBankAccount: body.hasBankAccount,
      hasCropCultivation: body.hasCropCultivation,
      hasCropInsuranceNeed: body.hasCropInsuranceNeed,
      needsIrrigation: body.needsIrrigation,
      hasEnrolledBeforeSeason: body.hasEnrolledBeforeSeason,
      isIndianResident: body.isIndianResident,
    });

    const localizeState = (value) => {
      if (language !== 'te') return value;
      const map = {
        'Andhra Pradesh': 'ఆంధ్ర ప్రదేశ్',
        Telangana: 'తెలంగాణ',
        Karnataka: 'కర్ణాటక',
        'Tamil Nadu': 'తమిళ నాడు',
        Maharashtra: 'మహారాష్ట్ర',
        Other: 'ఇతర',
      };
      return map[value] || value;
    };

    const eligibleSchemes = (Array.isArray(schemes) ? schemes : []).map((s) => ({
      name: s.name || 'Scheme',
      level: state === 'Andhra Pradesh'
        ? (language === 'te' ? 'ఆంధ్ర ప్రదేశ్' : 'Andhra Pradesh')
        : (language === 'te' ? 'జాతీయ' : 'National'),
      summary: s.description || s.summary || '',
      reason: s.eligibility || (language === 'te' ? 'మీ వివరాలకు సరిపోతుంది.' : 'Matches your profile details.'),
      sources: [s.applyAt, s.officialSource].filter(Boolean),
      applySteps: [s.benefit, s.applyAt].filter(Boolean),
    }));

    const finalSchemes = eligibleSchemes;

    return res.json({
      profile: {
        state: localizeState(state),
        landHectares,
        annualIncome,
      },
      eligibleSchemes: finalSchemes,
      eligibleCount: finalSchemes.length,
      message:
        finalSchemes.length > 0
          ? 'These national/state schemes match your profile based on the details provided.'
          : 'No tracked scheme matched all provided details. Update profile fields and retry.',
      requestId: req.requestId,
    });
  } catch (err) {
    console.error('[Schemes] Eligibility error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error', requestId: req.requestId });
  }
};
