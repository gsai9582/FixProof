import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      brand: "FixProof",
      tagline: "Don't just report it. Prove it's fixed.",
      nav: {
        explore: "Civic Map",
        report: "Report Defect",
        queue: "Officer Queue",
        accountability: "Accountability Score",
        login: "Sign In",
        logout: "Sign Out",
        dashboard: "Overview"
      },
      hero: {
        badge: "VERIFIED CIVIC RESOLUTION PLATFORM",
        title: "Accountable Civic Infrastructure",
        sub: "Civic complaints are easy to file but hard to trust as resolved. FixProof requires geotagged evidence, AI verification, and community confirmation before a complaint is closed.",
        cta_report: "Report an Issue",
        cta_explore: "Explore Public Integrity",
        step1_title: "1. Capture & Understand",
        step1_desc: "Snap a photo with auto-location. AI classifies defects, merges duplicates, and computes explainable priority.",
        step2_title: "2. Resolve with Proof",
        step2_desc: "Officers work a transparent queue and must submit an in-app geotagged after-photo to claim resolution.",
        step3_title: "3. Verify & Confirm",
        step3_desc: "Multi-signal AI checks location, time, and scene match. Citizens get 72h to confirm before public scores update."
      },
      categories: {
        pothole: "Pothole",
        garbage: "Garbage Dump",
        water_leakage: "Water Leakage",
        broken_streetlight: "Broken Streetlight",
        drainage: "Blocked Drainage",
        unsafe_infrastructure: "Unsafe Infrastructure"
      },
      verdicts: {
        verified_fix: "Verified Fix",
        needs_review: "Needs Review",
        rejected: "Rejected (Fake/Mismatch)"
      },
      status: {
        reported: "Reported",
        in_progress: "In Progress",
        claimed_resolved: "Claimed Resolved",
        verified_fixed: "Verified Fixed",
        needs_review: "Under Review",
        rejected: "Rejected",
        reopened: "Reopened by Community"
      },
      verification: {
        engine_title: "Closure Verification Engine",
        geo_check: "Geolocation Proximity",
        time_check: "Timestamp Freshness",
        scene_check: "Visual Scene & Defect Match",
        confidence: "Verification Confidence",
        reasons: "Integrity Signal Breakdown"
      },
      confirm: {
        question: "Is this issue actually fixed?",
        yes: "Yes, Fixed",
        no: "No, Still Defective",
        submitted: "Your response helps update public ward scores."
      }
    }
  },
  ta: {
    translation: {
      brand: "FixProof",
      tagline: "புகார் மட்டும் செய்யாதீர்கள். சரிசெய்யப்பட்டதை நிரூபியுங்கள்.",
      nav: {
        explore: "நகர வரைபடம்",
        report: "குறைபாடு புகார்",
        queue: "அதிகாரி வரிசை",
        accountability: "நேர்மை மதிப்பெண்",
        login: "உள்நுழைக",
        logout: "வெளியேறுக",
        dashboard: "கண்ணோட்டம்"
      },
      hero: {
        badge: "சான்றளிக்கப்பட்ட மக்கள் தீர்வு தளம்",
        title: "பொறுப்புணர்வுமிக்க நகர உட்கட்டமைப்பு",
        sub: "புகார் அளிப்பது சுலபம், ஆனால் தீர்க்கப்பட்டதை உறுதி செய்வது கடினம். FixProof புகைப்பட ஆதாரம், AI சரிபார்ப்பு மற்றும் பொதுமக்கள் உறுதிப்படுத்தல் மூலம் உண்மையான தீர்வை உறுதி செய்கிறது.",
        cta_report: "குறையைப் புகாரளிக்கவும்",
        cta_explore: "பொது நேர்மையைப் பார்க்க",
        step1_title: "1. பதிவு & புரிதல்",
        step1_desc: "இருப்பிடத்துடன் புகைப்படம் எடுக்கவும். AI குறைபாட்டை வகைப்படுத்தி முன்னுரிமையை நிர்ணயிக்கிறது.",
        step2_title: "2. ஆதாரத்துடன் தீர்வு",
        step2_desc: "அதிகாரிகள் தீர்க்கப்பட்டதற்கான புகைப்பட ஆதாரத்தை சமர்ப்பிக்க வேண்டும்.",
        step3_title: "3. சரிபார்ப்பு & உறுதிப்படுத்தல்",
        step3_desc: "AI மற்றும் மக்கள் 72 மணி நேரத்தில் சரிசெய்ததை உறுதிப்படுத்துகிறார்கள்."
      },
      categories: {
        pothole: "சாலைப் பள்ளம்",
        garbage: "குப்பைக் குவியல்",
        water_leakage: "குடிநீர் கசிவு",
        broken_streetlight: "தெருவிளக்கு பழுது",
        drainage: "வடிகால் அடைப்பு",
        unsafe_infrastructure: "ஆபத்தான கட்டமைப்பு"
      },
      verdicts: {
        verified_fix: "உறுதிப்படுத்தப்பட்ட தீர்வு",
        needs_review: "ஆய்வு தேவை",
        rejected: "நிராகரிக்கப்பட்டது (தவறான ஆதாரம்)"
      },
      status: {
        reported: "பதிவு செய்யப்பட்டது",
        in_progress: "பணியில் உள்ளது",
        claimed_resolved: "தீர்க்கப்பட்டதாக கோரப்பட்டது",
        verified_fixed: "சரிசெய்யப்பட்டது",
        needs_review: "ஆய்வில் உள்ளது",
        rejected: "நிராகரிக்கப்பட்டது",
        reopened: "மீண்டும் திறக்கப்பட்டது"
      },
      verification: {
        engine_title: "தீர்வு சரிபார்ப்பு இயந்திரம்",
        geo_check: "இருப்பிட அருகாமை",
        time_check: "நேர நம்பகத்தன்மை",
        scene_check: "காட்சி & குறைபாடு ஒப்பீடு",
        confidence: "நம்பகத்தன்மை அளவு",
        reasons: "காரணங்களின் பட்டியல்"
      },
      confirm: {
        question: "இந்த குறைபாடு உண்மையில் சரிசெய்யப்பட்டதா?",
        yes: "ஆம், சரியாகிவிட்டது",
        no: "இல்லை, இன்னும் பழுது உள்ளது",
        submitted: "உங்கள் கருத்து வார்டு மதிப்பெண்ணை மேம்படுத்த உதவும்."
      }
    }
  },
  hi: {
    translation: {
      brand: "FixProof",
      tagline: "सिर्फ शिकायत न करें। साबित करें कि समाधान हुआ है।",
      nav: {
        explore: "नागरिक मानचित्र",
        report: "शिकायत दर्ज करें",
        queue: "अधिकारी कतार",
        accountability: "जवाबदेही स्कोर",
        login: "लॉग इन",
        logout: "लॉग आउट",
        dashboard: "डैशबोर्ड"
      },
      hero: {
        badge: "प्रमाणित नागरिक समाधान मंच",
        title: "जवाबदेह नागरिक अवसंरचना",
        sub: "शिकायतें दर्ज करना आसान है लेकिन समाधान पर भरोसा करना मुश्किल। FixProof जियोटैग्ड सबूत, AI सत्यापन और नागरिक पुष्टि की मांग करता है।",
        cta_report: "शिकायत दर्ज करें",
        cta_explore: "सार्वजनिक सत्यनिष्ठा देखें",
        step1_title: "1. फोटो व विश्लेषण",
        step1_desc: "स्थान के साथ फोटो लें। AI समस्या का वर्गीकरण और प्राथमिकता तय करता है।",
        step2_title: "2. सबूत के साथ समाधान",
        step2_desc: "अधिकारियों को समाधान साबित करने के लिए घटनास्थल की लाइव फोटो देनी होती है।",
        step3_title: "3. सत्यापन व पुष्टि",
        step3_desc: "AI स्थान और दृश्य की जांच करता है। नागरिक 72 घंटे में समाधान की पुष्टि करते हैं।"
      },
      categories: {
        pothole: "सड़क का गड्ढा",
        garbage: "कचरे का ढेर",
        water_leakage: "पानी का रिसाव",
        broken_streetlight: "खराब स्ट्रीटलाइट",
        drainage: "अवरुद्ध नाली",
        unsafe_infrastructure: "असुरक्षित ढांचा"
      },
      verdicts: {
        verified_fix: "सत्यापित समाधान",
        needs_review: "समीक्षा आवश्यक",
        rejected: "अस्वीकृत (गलत सबूत)"
      },
      status: {
        reported: "दर्ज की गई",
        in_progress: "प्रगति पर",
        claimed_resolved: "समाधान का दावा",
        verified_fixed: "सत्यापित समाधान",
        needs_review: "समीक्षाधीन",
        rejected: "अस्वीकृत",
        reopened: "पुनः खोला गया"
      },
      verification: {
        engine_title: "समाधान सत्यापन इंजन",
        geo_check: "स्थान निकटता",
        time_check: "समय वैधता",
        scene_check: "दृश्य व दोष तुलना",
        confidence: "सत्यापन विश्वसनीयता",
        reasons: "सत्यापन विवरण"
      },
      confirm: {
        question: "क्या यह समस्या वास्तव में ठीक हो गई है?",
        yes: "हाँ, ठीक हो गई",
        no: "नहीं, अभी भी खराब है",
        submitted: "आपकी राय वार्ड स्कोर को अद्यतन करने में मदद करती है।"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
