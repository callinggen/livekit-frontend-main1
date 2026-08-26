export type Language = "en" | "te" | "hi";

export const languageNames: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: "English", nativeName: "English", flag: "🇬🇧" },
  te: { name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  hi: { name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
};

export const featuresData = {
  en: [
    {
      id: "voice",
      title: "AI Voice Calling",
      tagline: "Human-like AI Voice Conversations",
      description: "Our AI agents speak with human-like rhythm, natural pauses, and regional accents. Handle thousands of concurrent inbound & outbound calls with instant response.",
      highlights: [
        "Human-like Natural Speech (<300ms latency)",
        "Multi-language & Accent Support",
        "Inbound Receptionist & Outbound Sales",
        "Contextual AI Response Generation",
      ],
      previewType: "voice",
    },
    {
      id: "campaign",
      title: "Campaign Management",
      tagline: "High-Volume Automated Calling Campaigns",
      description: "Schedule, launch, and monitor automated phone campaigns in minutes. Set customized call windows, auto-retry rules, and agent scripts.",
      highlights: [
        "One-Click Campaign Launcher",
        "Bulk Dialing & Automated Retry Logic",
        "Custom Script & Persona Builder",
        "Live Campaign Performance Tracking",
      ],
      previewType: "campaign",
    },
    {
      id: "lead",
      title: "Lead Management",
      tagline: "Automated Lead Qualification & Scoring",
      description: "Screen and qualify incoming leads automatically. CallingGen asks pre-configured qualification questions and instantly labels high-intent leads.",
      highlights: [
        "AI Lead Screening & Intent Scoring",
        "Contact List Upload & Tagging",
        "Real-time Lead Qualification Badges",
        "Instant CRM Sync & Notifications",
      ],
      previewType: "lead",
    },
    {
      id: "booking",
      title: "Appointment Booking",
      tagline: "Seamless Calendar & Meeting Scheduling",
      description: "AI agents check calendar availability during calls, propose open slots, and confirm appointments without any back-and-forth friction.",
      highlights: [
        "Direct Google Calendar & Outlook Sync",
        "Automated Meeting Confirmations & Reminders",
        "Conflict Prevention & Rescheduling",
        "Instant WhatsApp & SMS Invite Delivery",
      ],
      previewType: "booking",
    },
    {
      id: "integrations",
      title: "CRM & Integrations",
      tagline: "Universal CRM & Communication Sync",
      description: "Connect CallingGen directly into HubSpot, Salesforce, Zoho, WhatsApp, and custom webhooks to maintain complete data harmony across your stack.",
      highlights: [
        "HubSpot, Salesforce & Zoho Connectors",
        "WhatsApp Business Message Triggers",
        "Zapier & Webhook API Endpoints",
        "Automated Contact Record Updating",
      ],
      previewType: "integrations",
    },
    {
      id: "analytics",
      title: "Analytics & Reports",
      tagline: "Real-time Voice Intelligence & Analytics",
      description: "Deep analytical insights into call volumes, success rates, transcriptions, and customer sentiment to continuously optimize conversion.",
      highlights: [
        "Real-Time Call Analytics Dashboard",
        "Full Text Transcripts & Audio Recordings",
        "Sentiment & Keyword Analysis",
        "Exportable PDF & CSV Reports",
      ],
      previewType: "analytics",
    },
  ],

  te: [
    {
      id: "voice",
      title: "AI వాయిస్ కాలింగ్",
      tagline: "మనుషుల్లా మాట్లాడే AI వాయిస్ సంభాషణలు",
      description: "మా AI ఏజెంట్లు సహజమైన విరామాలు, మనుషుల శైలి మరియు ప్రాంతీయ యాసలతో మాట్లాడతాయి. వేలాది ఇన్‌బౌండ్ & అవుట్‌బౌండ్ కాల్స్‌ను తక్షణ సమాధానంతో నిర్వహిస్తాయి.",
      highlights: [
        "మనుషుల్లా మాట్లాడే సహజ వాయిస్ (<300ms ఆలస్యం)",
        "బహుభాషా & ప్రాంతీయ యాసల మద్దతు",
        "ఇన్‌బౌండ్ రిసెప్షనిస్ట్ & అవుట్‌బౌండ్ సేల్స్",
        "సందర్భోచిత AI రెస్పాన్స్ జనరేషన్",
      ],
      previewType: "voice",
    },
    {
      id: "campaign",
      title: "క్యాంపైన్ మేనేజ్‌మెంట్",
      tagline: "హై-వాల్యూమ్ ఆటోమేటెడ్ కాలింగ్ క్యాంపైన్లు",
      description: "నిమిషాల్లో ఆటోమేటెడ్ ఫోన్ క్యాంపైన్లను షెడ్యూల్ చేయండి, ప్రారంభించండి మరియు పర్యవేక్షించండి. కస్టమైజ్డ్ కాలింగ్ సమయాలు, ఆటో-రీట్రై నిబంధనలు మరియు ఏజెంట్ స్క్రిప్ట్‌లను సెట్ చేయండి.",
      highlights: [
        "సింగిల్-క్లిక్ క్యాంపైన్ లాంచర్",
        "బల్క్ డయలింగ్ & ఆటోమేటెడ్ రీట్రై లాజిక్",
        "కస్టమ్ స్క్రిప్ట్ & పర్సొనా బిల్డర్",
        "లైవ్ క్యాంపైన్ పర్‌ఫార్మన్స్ ట్రాకింగ్",
      ],
      previewType: "campaign",
    },
    {
      id: "lead",
      title: "లీడ్ మేనేజ్‌మెంట్",
      tagline: "ఆటోమేటెడ్ లీడ్ క్వాలిఫికేషన్ & స్కోరింగ్",
      description: "వచ్చే లీడ్స్‌ను స్వయంచాలకంగా స్క్రీన్ చేసి క్వాలిఫై చేయండి. కాలింగ్‌జెన్ ముందస్తు ప్రశ్నలు అడిగి అధిక ఆసక్తి ఉన్న లీడ్స్‌ను తక్షణమే గుర్తిస్తుంది.",
      highlights: [
        "AI లీడ్ స్క్రీనింగ్ & ఇంటెంట్ స్కోరింగ్",
        "కాంటాక్ట్ లిస్ట్ అప్‌లోడ్ & టాగింగ్",
        "రియల్-టైమ్ లీడ్ క్వాలిఫికేషన్ బ్యాడ్జీలు",
        "తక్షణ CRM సింక్ & నోటిఫికేషన్లు",
      ],
      previewType: "lead",
    },
    {
      id: "booking",
      title: "అపాయింట్‌మెంట్ బుకింగ్",
      tagline: "సులభమైన క్యాలెండర్ & మీటింగ్ షెడ్యూలింగ్",
      description: "AI ఏజెంట్లు కాల్ సమయంలో క్యాలెండర్ అందుబాటును తనిఖీ చేసి, అందుబాటులో ఉన్న సమయాలను ప్రతిపాదించి, ఎలాంటి ఆలస్యం లేకుండా అపాయింట్‌మెంట్‌లను నిర్ధారిస్తాయి.",
      highlights: [
        "డైరెక్ట్ Google Calendar & Outlook సింక్",
        "ఆటోమేటెడ్ మీటింగ్ కన్ఫర్మేషన్లు & రిమైండర్లు",
        "సమయాల వివాదాల నివారణ & రీషెడ్యూలింగ్",
        "తక్షణ WhatsApp & SMS ఆహ్వానాల పంపకం",
      ],
      previewType: "booking",
    },
    {
      id: "integrations",
      title: "CRM & ఇంటిగ్రేషన్లు",
      tagline: "సార్వత్రిక CRM & కమ్యూనికేషన్ సింక్",
      description: "మీ డేటా సమన్వయాన్ని కాపాడుకోవడానికి కాలింగ్‌జెన్‌ను HubSpot, Salesforce, Zoho, WhatsApp మరియు కస్టమ్ వెబ్‌హుక్స్‌తో నేరుగా అనుసంధానించండి.",
      highlights: [
        "HubSpot, Salesforce & Zoho కనెక్టర్లు",
        "WhatsApp బిజినెస్ మెసేజ్ ట్రిగ్గర్లు",
        "Zapier & వెబ్‌హుక్ API ఎండ్‌పాయింట్లు",
        "ఆటోమేటెడ్ కాంటాక్ట్ రికార్డ్ అప్‌డేటింగ్",
      ],
      previewType: "integrations",
    },
    {
      id: "analytics",
      title: "అనలిటిక్స్ & రిపోర్టులు",
      tagline: "రియల్-టైమ్ వాయిస్ ఇంటెలిజెన్స్ & అనలిటిక్స్",
      description: "కన్వర్షన్‌ను నిరంతరం ఆప్టిమైజ్ చేయడానికి కాల్ వాల్యూమ్‌లు, విజయ శాతాలు, ట్రాన్స్‌క్రిప్షన్లు మరియు కస్టమర్ సెంటిమెంట్‌పై లోతైన విశ్లేషణాత్మక అంతర్దృష్టులను పొందండి.",
      highlights: [
        "రియల్-టైమ్ కాల్ అనలిటిక్స్ డాష్‌బోర్డ్",
        "పూర్తి టెక్స్ట్ ట్రాన్స్‌క్రిప్ట్‌లు & ఆడియో రికార్డింగ్‌లు",
        "సెంటిమెంట్ & కీవర్డ్ అనాలిసిస్",
        "ఎగుమతి చేయగల PDF & CSV నివేదికలు",
      ],
      previewType: "analytics",
    },
  ],

  hi: [
    {
      id: "voice",
      title: "AI वॉइस कॉलिंग",
      tagline: "इंसान जैसी AI वॉइस बातचीत",
      description: "हमारे AI एजेंट इंसानी लय, प्राकृतिक विराम और क्षेत्रीय लहजे में बोलते हैं। तत्काल प्रतिक्रिया के साथ हजारों इनबाउंड और आउटबाउंड कॉल्स को संभालें।",
      highlights: [
        "इंसान जैसी प्राकृतिक आवाज (<300ms विलंबता)",
        "बहुभाषी और क्षेत्रीय लहजे का समर्थन",
        "इनबाउंड रिसेप्शनिस्ट और आउटबाउंड सेल्स",
        "संदर्भित AI उत्तर जनरेशन",
      ],
      previewType: "voice",
    },
    {
      id: "campaign",
      title: "अभियान प्रबंधन",
      tagline: "उच्च मात्रा वाले स्वचालित कॉलिंग अभियान",
      description: "मिनटों में स्वचालित फोन अभियानों को शेड्यूल करें, लॉन्च करें और ट्रैक करें। अनुकूलित कॉलिंग समय और ऑटो-रीट्राई नियम सेट करें।",
      highlights: [
        "वन-क्लिक अभियान लांचर",
        "थोक डायलिंग और स्वचालित रीट्राई लॉजिक",
        "कस्टम स्क्रिप्ट और पर्सोना बिल्डर",
        "लाइव अभियान प्रदर्शन ट्रैकिंग",
      ],
      previewType: "campaign",
    },
    {
      id: "lead",
      title: "लीड प्रबंधन",
      tagline: "स्वचालित लीड योग्यता और स्कोरिंग",
      description: "आने वाली लीड्स को स्वचालित रूप से स्क्रीन और क्वालिफाई करें। कॉल्लिंगजेन उच्च रुचि वाली लीड्स को तुरंत पहचानता है।",
      highlights: [
        "AI लीड स्क्रीनिंग और स्कोरिंग",
        "संपर्क सूची अपलोड और टैगिंग",
        "रियल-टाइम लीड योग्यता बैज",
        "तत्काल CRM सिंक और सूचनाएं",
      ],
      previewType: "lead",
    },
    {
      id: "booking",
      title: "अपॉइंटमेंट बुकिंग",
      tagline: "सुगम कैलेंडर और मीटिंग शेड्यूलिंग",
      description: "AI एजेंट कॉल के दौरान कैलेंडर उपलब्धता की जांच करते हैं और बिना किसी परेशानी के अपॉइंटमेंट की पुष्टि करते हैं।",
      highlights: [
        "डायरेक्ट गूगल कैलेंडर और आउटलुक सिंक",
        "स्वचालित मीटिंग पुष्टि और रिमाइंडर",
        "समय टकराव रोकथाम और पुननिर्धारण",
        "तत्काल व्हाट्सएप और एसएमएस आमंत्रण",
      ],
      previewType: "booking",
    },
    {
      id: "integrations",
      title: "CRM और इंटीग्रेशन",
      tagline: "सार्वभौमिक CRM और संचार सिंक",
      description: "अपने डेटा सामंजस्य को बनाए रखने के लिए कॉल्लिंगजेन को HubSpot, Salesforce, Zoho, WhatsApp और कस्टम वेबहुक से सीधे जोड़ें।",
      highlights: [
        "HubSpot, Salesforce और Zoho कनेक्टर्स",
        "व्हाट्सएप बिजनेस मैसेज ट्रिगर्स",
        "ज़ैपियर और वेबहुक API एंडपॉइंट्स",
        "स्वचालित संपर्क रिकॉर्ड अपडेटिंग",
      ],
      previewType: "integrations",
    },
    {
      id: "analytics",
      title: "एनालिटिक्स और रिपोर्ट्स",
      tagline: "रियल-टाइम वॉइस इंटेलिजेंस और एनालिटिक्स",
      description: "कॉल वॉल्यूम, सफलता दर, ट्रांसक्रिप्शन और ग्राहक भावना पर गहन विश्लेषणात्मक अंतर्दृष्टि प्राप्त करें।",
      highlights: [
        "रियल-टाइम कॉल एनालिटिक्स डैशबोर्ड",
        "पूर्ण टेक्स्ट ट्रांसक्रिप्ट और ऑडियो रिकॉर्डिंग",
        "भावना और कीवर्ड विश्लेषण",
        "निर्यात योग्य PDF और CSV रिपोर्ट्स",
      ],
      previewType: "analytics",
    },
  ],
};

export const industriesData = {
  en: [
    {
      id: "real-estate",
      name: "Real Estate",
      subtitle: "Property Buyers & Site Visit Automation",
      challenges: [
        "High volume of property inquiries from Facebook & ad portals.",
        "Delayed agent callbacks result in buyers choosing competitors.",
        "Manual scheduling of site visits takes hours of phone tag.",
      ],
      solutions: [
        "Instant AI response to inbound property ad leads within 5 seconds.",
        "Qualifies budget, location preference, and loan eligibility automatically.",
        "Schedules site visits directly into agent's calendar with WhatsApp updates.",
      ],
      benefits: "+65% Site Visit Conversions • 0s Callback Delay",
    },
    {
      id: "education",
      name: "Education",
      subtitle: "Student Admission & Counseling Workflow",
      challenges: [
        "Thousands of student admission queries during peak admission season.",
        "Counselors overwhelmed by repetitive course & fee questions.",
        "Lost prospective student follow-ups due to manual tracking.",
      ],
      solutions: [
        "AI Agent answers 24/7 course, fee structure, and eligibility queries.",
        "Schedules 1-on-1 counseling sessions with university advisors.",
        "Sends automated document checklist & fee payment reminders.",
      ],
      benefits: "+80% Counseling Booking Rate • 24/7 Student Desk",
    },
    {
      id: "healthcare",
      name: "Healthcare",
      subtitle: "Patient Appointment & Reminder Dashboard",
      challenges: [
        "High patient no-show rates for scheduled doctor consultations.",
        "Front desk phones ringing non-stop for basic slot availability.",
        "Manual follow-ups for lab report pickup & follow-up visits.",
      ],
      solutions: [
        "Automated outbound voice calls confirming doctor appointments 24h prior.",
        "Handles inbound slot booking & rescheduling without receptionist burden.",
        "Instant WhatsApp delivery of doctor location & prep instructions.",
      ],
      benefits: "40% Drop in Patient No-Shows • Zero Receptionist Queue",
    },
    {
      id: "finance",
      name: "Banking & Loans",
      subtitle: "Loan Lead Screening & Document Collection",
      challenges: [
        "High cost of manual phone verification for personal & home loan leads.",
        "Unqualified applicants consuming expensive credit manager bandwidth.",
        "Slow turnaround time in document verification and approval follow-ups.",
      ],
      solutions: [
        "AI Agent screens monthly income, credit score, and loan requirement.",
        "Transfers pre-screened hot leads to loan officers in real time.",
        "Triggers automated WhatsApp link for document submission.",
      ],
      benefits: "3x Faster Loan Qualification • 50% Reduction in Lead Cost",
    },
    {
      id: "agency",
      name: "Marketing Agencies",
      subtitle: "Client Lead Qualification & Onboarding",
      challenges: [
        "Managing client campaign leads across multiple ad accounts.",
        "Clients complaining about lead quality due to slow agency response.",
        "Difficulty scaling outbound sales campaigns for agency's own services.",
      ],
      solutions: [
        "White-label AI Voice Agent calling ad leads on behalf of your agency clients.",
        "Real-time lead scoring and CRM sync directly into client's HubSpot.",
        "Outbound AI calling campaigns to book strategy calls for agency growth.",
      ],
      benefits: "10x Client ROI Proof • High Agency Client Retention",
    },
    {
      id: "services",
      name: "B2B & Services",
      subtitle: "Inbound Support & Outbound Demo Booking",
      challenges: [
        "B2B buyers expecting immediate callback after downloading whitepapers.",
        "Sales reps spending 60% of their day dialing unverified leads.",
        "After-hours inbound leads going cold overnight.",
      ],
      solutions: [
        "Instant outbound AI call within seconds of web form submission.",
        "AI Agent answers product questions & books sales demo live on call.",
        "Full call recording & AI summary synced to CRM opportunity object.",
      ],
      benefits: "2.4x Higher Demo Booked Rate • 100% Inbound Response Rate",
    },
  ],

  te: [
    {
      id: "real-estate",
      name: "రియల్ ఎస్టేట్",
      subtitle: "ప్రాపర్టీ కొనుగోలుదారులు & సైట్ విజిట్ ఆటోమేషన్",
      challenges: [
        "ఫేస్‌బుక్ & యాడ్ పోర్టల్‌ల నుండి భారీగా వచ్చే ప్రాపర్టీ విచారణలు.",
        "ఏజెంట్ కాల్‌బ్యాక్ ఆలస్యం కావడం వల్ల కొనుగోలుదారులు ఇతరులను ఎంచుకోవడం.",
        "సైట్ విజిట్‌లను మాన్యువల్‌గా షెడ్యూల్ చేయడానికి గంటల సమయం పట్టడం.",
      ],
      solutions: [
        "యాడ్ లీడ్స్ వచ్చిన 5 సెకన్లలో తక్షణ AI వాయిస్ రెస్పాన్స్.",
        "బడ్జెట్, లొకేషన్ మరియు లోన్ అర్హతను స్వయంచాలకంగా తనిఖీ చేస్తుంది.",
        "WhatsApp అప్‌డేట్‌లతో సైట్ విజిట్‌లను నేరుగా క్యాలెండర్‌లో బుక్ చేస్తుంది.",
      ],
      benefits: "+65% సైట్ విజిట్ కన్వర్షన్లు • 0సెకన్ల కాల్‌బ్యాక్ ఆలస్యం",
    },
    {
      id: "education",
      name: "విద్య & కళాశాలలు",
      subtitle: "విద్యార్థుల అడ్మిషన్లు & కౌన్సెలింగ్ వర్క్‌ఫ్లో",
      challenges: [
        "అడ్మిషన్ల సమయంలో వేలాదిగా వచ్చే విద్యార్థుల విచారణలు.",
        "కోర్సులు & ఫీజుల ప్రశ్నలతో కౌన్సెలర్లు ఒత్తిడికి గురికావడం.",
        "మాన్యువల్ ట్రాకింగ్ వల్ల ఆసక్తి ఉన్న విద్యార్థుల ఫాలో-అప్‌లు మిస్ కావడం.",
      ],
      solutions: [
        "కోర్సులు, ఫీజుల వివరాలు & అర్హత ప్రశ్నలకు AI 24/7 సమాధానమిస్తుంది.",
        "యూనివర్సిటీ నిపుణులతో 1-on-1 కౌన్సెలింగ్ సెషన్‌లను బుక్ చేస్తుంది.",
        "డాక్యుమెంట్ చెక్‌లిస్ట్ & ఫీజు చెల్లింపు రిమైండర్‌లను ఆటోమేటిక్‌గా పంపుతుంది.",
      ],
      benefits: "+80% కౌన్సెలింగ్ బుకింగ్ రేటు • 24/7 విద్యార్థుల హెల్ప్‌డెస్క్",
    },
    {
      id: "healthcare",
      name: "వైద్యం & హాస్పిటల్స్",
      subtitle: "రోగుల అపాయింట్‌మెంట్ & రిమైండర్ డాష్‌బోర్డ్",
      challenges: [
        "షెడ్యూల్ చేసిన డాక్టర్ అపాయింట్‌మెంట్‌లకు రోగులు రాకపోవడం (No-show).",
        "బేసిక్ టైమింగ్స్ విచారణల కోసం ఫ్రంట్ డెస్క్ ఫోన్లు నిరంతరం మోగడం.",
        "ల్యాబ్ రిపోర్టులు & ఫాలో-అప్ విజిట్‌ల కోసం మాన్యువల్ శ్రమ.",
      ],
      solutions: [
        "అపాయింట్‌మెంట్‌కు 24 గంటల ముందు డాక్టర్ అపాయింట్‌మెంట్‌ను కన్ఫర్మ్ చేసే ఆటోమేటెడ్ కాల్స్.",
        "రిసెప్షనిస్ట్ అవసరం లేకుండా ఇన్‌బౌండ్ బుకింగ్స్ & రీషెడ్యూలింగ్ నిర్వహిస్తుంది.",
        "డాక్టర్ లొకేషన్ & గైడ్‌లైన్స్‌ను WhatsApp ద్వారా తక్షణమే పంపుతుంది.",
      ],
      benefits: "40% తగ్గిన నో-షో రేటు • రిసెప్షన్ దగ్గర సున్నా నిరీక్షణ",
    },
    {
      id: "finance",
      name: "బ్యాంకింగ్ & రుణాలు",
      subtitle: "లోన్ లీడ్ స్క్రీనింగ్ & డాక్యుమెంట్ సేకరణ",
      challenges: [
        "పర్సనల్ & హోమ్ లోన్ లీడ్‌ల మాన్యువల్ వెరిఫికేషన్‌కు ఎక్కువ ఖర్చు.",
        "అర్హత లేని అప్లికెంట్ల వల్ల క్రెడిట్ మేనేజర్ల విలువైన సమయం వృధా.",
        "డాక్యుమెంట్ వెరిఫికేషన్ & అప్రూవల్ ఫాలో-అప్‌లలో ఆలస్యం.",
      ],
      solutions: [
        "నెలవారీ ఆదాయం, క్రెడిట్ స్కోర్ & లోన్ అవసరాన్ని AI స్క్రీన్ చేస్తుంది.",
        "అర్హత కలిగిన హాట్ లీడ్‌లను రియల్-టైమ్‌లో లోన్ ఆఫీసర్లకు బదిలీ చేస్తుంది.",
        "డాక్యుమెంట్ సమర్పణ కోసం వాట్సాప్ లింక్‌ను ఆటోమేటిక్‌గా పంపుతుంది.",
      ],
      benefits: "3 రెట్లు వేగవంతమైన లోన్ అర్హత • 50% తగ్గిన లీడ్ ఖర్చు",
    },
    {
      id: "agency",
      name: "మార్కెటింగ్ ఏజెన్సీలు",
      subtitle: "క్లయింట్ లీడ్ క్వాలిఫికేషన్ & ఆన్‌బోర్డింగ్",
      challenges: [
        "వివిధ యాడ్ ఖాతాల లీడ్‌లను నిర్వహించడంలో ఇబ్బందులు.",
        "ఆలస్యమైన రెస్పాన్స్ వల్ల లీడ్ క్వాలిటీపై క్లయింట్ల అసంతృప్తి.",
        "ఏజెన్సీ సొంత సేవల కోసం అవుట్‌బోండ్ సేల్స్ స్కేల్ చేయడం కష్టం కావడం.",
      ],
      solutions: [
        "మీ ఏజెన్సీ క్లయింట్ల తరపున లీడ్‌లకు కాల్ చేసే వైట్-లేబుల్ AI వాయిస్ ఏజెంట్.",
        "రియల్-టైమ్ లీడ్ స్కోరింగ్ & క్లయింట్ CRM (HubSpot) కి నేరుగా సింక్.",
        "ఏజెన్సీ గ్రోత్ కోసం స్ట్రాటజీ కాల్స్ బుక్ చేసే అవుట్‌బోండ్ AI కాలింగ్.",
      ],
      benefits: "10 రెట్ల క్లయింట్ ROI నిరూపణ • ఎక్కువ క్లయింట్ నిలుపుదల",
    },
    {
      id: "services",
      name: "B2B & ఇతర సేవలు",
      subtitle: "ఇన్‌బౌండ్ సపోర్ట్ & అవుట్‌బోండ్ డెమో బుకింగ్",
      challenges: [
        "వెబ్‌ఫామ్ సబ్మిట్ చేసిన వెంటనే తక్షణ కాల్‌బ్యాక్ ఆశించడం.",
        "సేల్స్ టీమ్ 60% సమయం వెరిఫై కాని లీడ్‌లపై డయల్ చేయడానికే కేటాయించడం.",
        "ఆఫీస్ అవర్స్ తర్వాత వచ్చే లీడ్స్ రాత్రంతా రెస్పాన్స్ లేక చల్లారిపోవడం.",
      ],
      solutions: [
        "ఫామ్ సబ్మిట్ చేసిన కొద్ది సెకన్లలోనే అవుట్‌బోండ్ AI కాల్ ప్రారంభం.",
        "AI ఏజెంట్ ఉత్పత్తుల ప్రశ్నలకు సమాధానమిచ్చి లైవ్ డెమో బుక్ చేస్తుంది.",
        "పూర్తి కాల్ రికార్డింగ్ & AI సమ్మరీ నేరుగా CRM కి సింక్ అవుతుంది.",
      ],
      benefits: "2.4 రెట్లు ఎక్కువ డెమో బుకింగ్ రేటు • 100% ఇన్‌బౌండ్ రెస్పాన్స్",
    },
  ],

  hi: [
    {
      id: "real-estate",
      name: "रियल एस्टेट",
      subtitle: "प्रॉपर्टी खरीदार और साइट विजिट ऑटोमेशन",
      challenges: [
        "फेसबुक और विज्ञापन पोर्टल्स से भारी मात्रा में प्रॉपर्टी पूछताछ।",
        "एजेंट कॉलबैक में देरी के कारण खरीदारों का प्रतिस्पर्धियों को चुनना।",
        "साइट विजिट की मैनुअल शेड्यूलिंग में घंटों का समय लगना।",
      ],
      solutions: [
        "विज्ञापन लीड्स आने के 5 सेकंड के भीतर तत्काल AI वॉइस उत्तर।",
        "बजट, स्थान और ऋण पात्रता को स्वचालित रूप से जांचता है।",
        "साइट विजिट को सीधे एजेंट के कैलेंडर में व्हाट्सएप अपडेट के साथ बुक करता है।",
      ],
      benefits: "+65% साइट विजिट कनवर्टन • 0s कॉलबैक देरी",
    },
    {
      id: "education",
      name: "शिक्षा और कॉलेज",
      subtitle: "छात्र प्रवेश और परामर्श कार्यप्रवाह",
      challenges: [
        "प्रवेश सत्र के दौरान हजारों छात्र पूछताछ।",
        "पाठ्यक्रम और शुल्क प्रश्नों से सलाहकारों पर अधिक बोझ।",
        "मैनुअल ट्रैकिंग के कारण संभावित छात्रों के फॉलो-अप छूट जाना।",
      ],
      solutions: [
        "AI एजेंट 24/7 पाठ्यक्रम, शुल्क संरचना और पात्रता प्रश्नों का उत्तर देता है।",
        "विश्वविद्यालय सलाहकारों के साथ 1-on-1 परामर्श सत्र बुक करता है।",
        "दस्तावेज़ चेकलिस्ट और शुल्क भुगतान रिमाइंडर स्वचालित रूप से भेजता है।",
      ],
      benefits: "+80% परामर्श बुकिंग दर • 24/7 छात्र सहायता डेस्क",
    },
    {
      id: "healthcare",
      name: "स्वास्थ्य और अस्पताल",
      subtitle: "रोगी अपॉइंटमेंट और रिमाइंडर डैशबोर्ड",
      challenges: [
        "डॉक्टर परामर्श के लिए मरीजों के न आने की उच्च दर (No-show)।",
        "मूल समय की जानकारी के लिए फ्रंट डेस्क फोन का लगातार बजना।",
        "लैब रिपोर्ट और फॉलो-अप विजिट के लिए मैनुअल फॉलो-अप।",
      ],
      solutions: [
        "अपॉइंटमेंट से 24 घंटे पहले डॉक्टर अपॉइंटमेंट की पुष्टि करने वाली कॉल्स।",
        "रिसेप्शनिस्ट के बिना इनबाउंड बुकिंग और पुननिर्धारण संभालता है।",
        "डॉक्टर का स्थान और निर्देश व्हाट्सएप पर तुरंत भेजता है।",
      ],
      benefits: "40% कम नो-शो दर • रिसेप्शन पर शून्य कतार",
    },
    {
      id: "finance",
      name: "बैंकिंग और ऋण",
      subtitle: "ऋण लीड स्क्रीनिंग और दस्तावेज़ संग्रह",
      challenges: [
        "व्यक्तिगत और गृह ऋण लीड्स के मैनुअल सत्यापन की उच्च लागत।",
        "अयोग्य आवेदकों के कारण क्रेडिट प्रबंधकों का समय बर्बाद होना।",
        "दस्तावेज़ सत्यापन और स्वीकृति फॉलो-अप में देरी।",
      ],
      solutions: [
        "AI एजेंट मासिक आय, क्रेडिट स्कोर और ऋण आवश्यकता को स्क्रीन करता है।",
        "योग्य लीड्स को तुरंत ऋण अधिकारियों को स्थानांतरित करता है।",
        "दस्तावेज़ जमा करने के लिए व्हाट्सएप लिंक स्वचालित रूप से भेजता है।",
      ],
      benefits: "3x तेज़ ऋण पात्रता • 50% कम लीड लागत",
    },
    {
      id: "agency",
      name: "मार्केटिंग एजेंसियां",
      subtitle: "क्लाइंट लीड योग्यता और ऑनबोर्डिंग",
      challenges: [
        "विभिन्न विज्ञापन खातों की लीड्स को प्रबंधित करने में कठिनाई।",
        "धीमी प्रतिक्रिया के कारण लीड गुणवत्ता पर ग्राहकों की शिकायतें।",
        "एजेंसी की अपनी सेवाओं के लिए आउटबाउंड अभियानों को बढ़ाना कठिन होना।",
      ],
      solutions: [
        "आपकी एजेंसी के ग्राहकों की ओर से कॉलिंग करने वाला व्हाइट-लेबल AI एजेंट।",
        "रियल-टाइम लीड स्कोरिंग और क्लाइंट CRM में सीधा सिंक।",
        "एजेंसी वृद्धि के लिए रणनीति कॉल्स बुक करने वाले आउटबाउंड अभियान।",
      ],
      benefits: "10x क्लाइंट ROI प्रमाण • उच्च ग्राहक प्रतिधारण",
    },
    {
      id: "services",
      name: "B2B और सेवाएं",
      subtitle: "इनबाउंड सहायता और आउटबाउंड डेमो बुकिंग",
      challenges: [
        "फॉर्म जमा करने के तुरंत बाद तत्काल कॉलबैक की उम्मीद।",
        "बिक्री टीमों का 60% समय असत्यापित नंबरों को डायल करने में बीतना।",
        "कार्यालय के समय के बाद आने वाली लीड्स का ठंडा पड़ जाना।",
      ],
      solutions: [
        "वेब फॉर्म जमा होने के कुछ ही सेकंड में आउटबाउंड AI कॉल।",
        "AI एजेंट उत्पाद प्रश्नों का उत्तर देता है और लाइव डेमो बुक करता है।",
        "पूर्ण कॉल रिकॉर्डिंग और AI सारांश सीधे CRM में सिंक होता है।",
      ],
      benefits: "2.4x अधिक डेमो बुकिंग दर • 100% इनबाउंड उत्तर दर",
    },
  ],
};

export const translations = {
  en: {
    // Navbar
    navPricing: "Pricing",
    navContact: "Contact",
    navLogin: "Login",
    navDashboard: "Dashboard",
    getCall: "Get Call",
    
    // Hero Main
    heroBadge: "AI Voice Calling Platform",
    heroHeading: "AI Voice Agents That Handle Your Business Calls ",
    heroHeadingHighlight: "Automatically",
    heroSubheading: "CallingGen helps businesses automate inbound and outbound calls, qualify leads, book appointments, answer customer queries, and save valuable time using AI voice agents.",
    primaryCta: "Get Call",
    secondaryCta: "See How It Works",

    // Trust Features
    feature247: "24/7 AI Calling",
    featureMultiLang: "Multi-language Support",
    featureCrm: "CRM Integration",
    featureWhatsapp: "WhatsApp Integration",

    // Mockup Header
    overview: "OVERVIEW",
    dashboard: "Dashboard",
    proPlan: "Pro Plan",
    credits: "850 Credits",
    userName: "User Name",

    // Mockup Sidebar
    navigation: "Navigation",
    navCalendar: "Calendar",
    navCallManager: "Call Manager",
    navCallLogs: "Call Logs",
    navCampaign: "Campaign",
    navReport: "Report",
    welcomeBack: "Welcome back, User Name",
    campaignSubtitle: "Here is what's happening with your campaigns today.",
    newCampaign: "New Campaign",

    // Mockup Metrics Cards
    totalCampaigns: "Total Campaigns",
    totalCalls: "Total Calls",
    completedCalls: "Completed Calls",
    interestedLeads: "Interested Leads",
    callbacks: "Callbacks",
    metricCredits: "Credits",
    activeAgents: "Active Agents",
    successRate: "Success Rate",

    // Mockup Floating Cards
    inboundCall: "Inbound Call",
    answeredByAi: "Answered by AI",
    leadQualified: "Lead Qualified",
    appointmentSynced: "Appointment Synced to CRM",

    // About Section (Screenshot 1)
    aboutTag: "About CallingGen",
    aboutTitle: "What is CallingGen?",
    aboutSubtitle: "Businesses lose valuable leads when calls go unanswered or follow-ups are delayed. CallingGen solves this by using AI voice agents that answer instantly, engage customers naturally, and automate the entire calling process from start to finish.",

    step1Title: "Login",
    step1Subtext: "Access your dashboard",
    step2Title: "Create Campaign",
    step2Subtext: "Set goal, scripts & settings",
    step3Title: "Upload Contacts",
    step3Subtext: "Upload your contact list",
    step4Title: "Launch Campaign",
    step4Subtext: "Review and launch",
    step5Title: "AI Starts Calling",
    step5Subtext: "AI calls and handles conversations",
    step5Status: "Spoken AI Conversation Active",

    feature1Title: "AI Voice Calls",
    feature1Desc: "Human-like conversations that feel natural.",
    feature2Title: "Lead Qualification",
    feature2Desc: "Qualify leads and capture important information.",
    feature3Title: "Appointment Booking",
    feature3Desc: "Automatically book appointments in calendar.",
    feature4Title: "Smart Automation",
    feature4Desc: "CRM updates, follow-ups and notifications.",

    // Why CallingGen Comparison (Screenshot 2)
    whyTag: "THE CALLINGGEN TRANSFORMATION",
    whyTitle: "Why Businesses Choose CallingGen",
    whySubtitle: "See how CallingGen transforms traditional manual phone operations into automated, 24/7 AI-powered voice campaigns that never miss a lead.",

    withoutCallingGen: "Without CallingGen",
    traditionalOps: "Traditional Phone Operations",
    lowEfficiency: "Low Efficiency",

    withCallingGen: "With CallingGen",
    aiAutomation: "AI Voice Automation",
    fullAutomated: "100% Automated",

    prob1Title: "Missed Customer Calls",
    prob1Desc: "Calls go unanswered during peak hours or after business hours.",
    sol1Title: "AI Answers 24/7 Instantly",
    sol1Desc: "100% of inbound calls answered on the first ring with zero wait time.",

    prob2Title: "Manual Follow-ups & Delays",
    prob2Desc: "Leads cold down while waiting for manual callbacks.",
    sol2Title: "Automatic Immediate Follow-ups",
    sol2Desc: "Outbound AI calls & WhatsApp messages triggered in real time.",

    prob3Title: "Unqualified Lost Leads",
    prob3Desc: "Repetitive sales bandwidth spent on low-intent prospects.",
    sol3Title: "Smart AI Lead Qualification",
    sol3Desc: "AI asks screening questions, scores intent, and logs CRM data.",

    prob4Title: "Manual Appointment Booking",
    prob4Desc: "Back-and-forth emails and calls to schedule meetings.",
    sol4Title: "AI Books Meetings Live",
    sol4Desc: "Real-time calendar checking and direct meeting booking during call.",

    prob5Title: "No Real-time Call Insights",
    prob5Desc: "No visibility into call quality, sentiment, or lost opportunities.",
    sol5Title: "Live Analytics & Transcriptions",
    sol5Desc: "Instant transcriptions, AI summaries, and sentiment reporting.",

    prob6Title: "Team Overloaded & Fatigued",
    prob6Desc: "Human agents burnt out by repetitive phone scripts.",
    sol6Title: "AI Handles Repetitive Work",
    sol6Desc: "Human teams focus on high-value closing & strategy.",

    // Features Section
    whyCallingGenTag: "Why CallingGen",
    featuresTag: "PLATFORM CAPABILITIES",
    featuresTitleMain: "Everything You Need to Automate Business Calls",
    featuresSubtitleMain: "Discover how CallingGen's voice AI features streamline your entire calling workflow, from dialing to lead qualification and meeting booking.",

    // Industries Section
    indTag: "TAILORED INDUSTRY SOLUTIONS",
    indTitle: "Built for Your Specific Industry",
    indSubtitle: "CallingGen adapts seamlessly to your industry's unique call scenarios, scripts, and multi-language customer preferences.",
    indChallengesHeader: "Traditional Industry Challenges",
    indSolutionsHeader: "How CallingGen Solves It",

    // FAQs
    faqTag: "GOT QUESTIONS?",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about deploying AI voice agents for your organization.",

    faq1Q: "1. What is CallingGen and how does it work for my business?",
    faq1A: "CallingGen is an AI Voice Calling SaaS platform that builds custom AI agents to handle both inbound and outbound business calls.",

    faq2Q: "2. Can CallingGen AI agents handle both inbound customer support & outbound sales campaigns?",
    faq2A: "Yes! CallingGen supports both inbound phone reception and high-volume outbound campaigns.",

    faq3Q: "3. Does CallingGen integrate with CRMs, WhatsApp, and Google Calendar?",
    faq3A: "CallingGen offers seamless integrations with major CRMs, WhatsApp Business, and Google Calendar.",

    faq4Q: "4. Which languages and regional accents does CallingGen AI support?",
    faq4A: "CallingGen supports over 12+ global and regional languages including English, Hindi, Telugu, Tamil, and more.",

    faq5Q: "5. How quickly can I set up and deploy my first CallingGen AI voice agent?",
    faq5A: "You can configure and launch your first AI Voice Agent in under 10 minutes!",

    // Testimonials
    testiTitle: "What Our Customers Say",
    testiSubtitle: "Join thousands of businesses that trust CallingGen to handle their customer conversations.",

    t1Name: "Rahul Sharma",
    t1Role: "Founder",
    t1Company: "Sharma Realty",
    t1Content: "We reduced our missed calls and increased property visits using CallingGen.",

    t2Name: "Priya Reddy",
    t2Role: "Director",
    t2Company: "Bright Tax Consultants",
    t2Content: "Our follow-ups are now completely automated and clients receive instant responses.",

    t3Name: "Amit Patel",
    t3Role: "CEO",
    t3Company: "Digital Reach Agency",
    t3Content: "CallingGen helped us qualify leads faster and improve our team's productivity.",

    // Final CTA
    finalCtaTitle: "Ready to Automate Your Business Calls?",
    finalCtaSubtitle: "See how CallingGen can help your business answer calls, qualify leads, and automate customer conversations.",
    contactSales: "Contact Sales",

    // Get Call Modal
    getCallTitle: "Get an Immediate AI Test Call",
    getCallSubtitle: "Experience how CallingGen's AI Voice Agent interacts in real-time.",
    fullNameLabel: "Full Name",
    workEmailLabel: "Work Email",
    phoneNumberLabel: "Phone Number",
    companyNameLabel: "Company Name",
    industryLabel: "Industry",
    triggerCallBtn: "Call Me Now",

    // Footer
    footerDesc: "AI-powered voice agent platform empowering modern businesses to automate customer communications.",
    allRightsReserved: "All rights reserved.",
  },

  te: {
    // Navbar
    navPricing: "ధరలు",
    navContact: "సంప్రదించండి",
    navLogin: "లాగిన్",
    navDashboard: "డాష్‌బోర్డ్",
    getCall: "కాల్ చేయండి",

    // Hero Main
    heroBadge: "AI వాయిస్ కాలింగ్ ప్లాట్‌ఫారమ్",
    heroHeading: "మీ బిజినెస్ కాల్స్‌ను స్వయంచాలకంగా నిర్వహించే ",
    heroHeadingHighlight: "AI వాయిస్ ఏజెంట్లు",
    heroSubheading: "కాలింగ్‌జెన్ మీ బిజినెస్ కోసం ఇన్‌బౌండ్ మరియు అవుట్‌బౌండ్ కాల్స్‌ను ఆటోమేట్ చేస్తుంది, లీడ్స్‌ను క్వాలిఫై చేస్తుంది, అపాయింట్‌మెంట్లను బుక్ చేస్తుంది, కస్టమర్ ప్రశ్నలకు సమాధానం ఇస్తుంది మరియు AI వాయిస్ ఏజెంట్లతో విలువైన సమయాన్ని ఆదా చేస్తుంది.",
    primaryCta: "కాల్ చేయండి",
    secondaryCta: "ఎలా పని చేస్తుందో చూడండి ➔",

    // Trust Features
    feature247: "24/7 AI కాలింగ్",
    featureMultiLang: "బహుభాషా మద్దతు",
    featureCrm: "CRM ఇంటిగ్రేషన్",
    featureWhatsapp: "WhatsApp ఇంటిగ్రేషన్",

    // Mockup Header
    overview: "సారాంశం",
    dashboard: "డాష్‌బోర్డ్",
    proPlan: "ప్రో ప్లాన్",
    credits: "850 క్రెడిట్స్",
    userName: "వినియోగదారుని పేరు",

    // Mockup Sidebar
    navigation: "నావిగేషన్",
    navCalendar: "క్యాలెండర్",
    navCallManager: "కాల్ మేనేజర్",
    navCallLogs: "కాల్ లాగ్స్",
    navCampaign: "క్యాంపైన్లు",
    navReport: "రిపోర్టులు",
    welcomeBack: "మళ్ళీ స్వాగతం, వినియోగదారుని పేరు",
    campaignSubtitle: "ఈరోజు మీ క్యాంపైన్లలో ఏమి జరుగుతుందో ఇక్కడ చూడండి.",
    newCampaign: "కొత్త క్యాంపైన్",

    // Mockup Metrics Cards
    totalCampaigns: "మొత్తం క్యాంపైన్లు",
    totalCalls: "మొత్తం కాల్స్",
    completedCalls: "పూర్తయిన కాల్స్",
    interestedLeads: "ఆసక్తి ఉన్న లీడ్స్",
    callbacks: "కాల్‌బ్యాక్‌లు",
    metricCredits: "క్రెడిట్స్",
    activeAgents: "యాక్టివ్ ఏజెంట్లు",
    successRate: "విజయ శాతం",

    // Mockup Floating Cards
    inboundCall: "ఇన్‌బౌండ్ కాల్",
    answeredByAi: "AI ద్వారా సమాధానమివ్వబడింది",
    leadQualified: "లీడ్ క్వాలిఫైడ్",
    appointmentSynced: "అపాయింట్‌మెంట్ CRM కి సీంక్ చేయబడింది",

    // About Section (Screenshot 1 Exact Telugu)
    aboutTag: "కాలింగ్‌జెన్ గురించి",
    aboutTitle: "కాలింగ్‌జెన్ అంటే ఏమిటి?",
    aboutSubtitle: "కాల్స్ కు సమాధానం రాకపోవడం లేదా ఫాలో-అప్‌లు ఆలస్యం కావడం వల్ల వ్యాపారాలు విలువైన లీడ్స్ ను కోల్పోతాయి. కాలింగ్‌జెన్ ఈ సమస్యను AI వాయిస్ ఏజెంట్లతో పరిష్కరిస్తుంది. వారు సహజంగా మాట్లాడుతూ, కస్టమర్లను ఎంగేజ్ చేసి, ప్రారంభం నుండి చివరి వరకు మొత్తం కాలింగ్ ప్రక్రియను ఆటోమేట్ చేస్తారు.",

    step1Title: "లాగిన్",
    step1Subtext: "మీ డాష్‌బోర్డ్ యాక్సెస్ చేయండి",
    step2Title: "క్యాంపైన్ సృష్టించండి",
    step2Subtext: "లక్ష్యాలు, స్క్రిప్ట్‌లు & సెట్టింగ్‌లను సెట్ చేయండి",
    step3Title: "కాంటాక్ట్‌లు అప్‌లోడ్ చేయండి",
    step3Subtext: "మీ కాంటాక్ట్ లిస్ట్‌ను అప్‌లోడ్ చేయండి",
    step4Title: "క్యాంపైన్ ప్రారంభించండి",
    step4Subtext: "రివ్యూ చేసి ప్రారంభించండి",
    step5Title: "AI కాల్స్ ప్రారంభమయ్యాయి",
    step5Subtext: "AI కాల్స్ చేసి, సంభాషణలను నిర్వహిస్తుంది",
    step5Status: "స్పోకెన్ AI సంభాషణ యాక్టివ్",

    feature1Title: "AI వాయిస్ కాల్స్",
    feature1Desc: "సహజంగా మనుషుల్లా మాట్లాడే సంభాషణలు",
    feature2Title: "లీడ్ క్వాలిఫైకేషన్",
    feature2Desc: "లీడ్స్‌ను క్వాలిఫై చేసి ముఖ్యమైన సమాచారాన్ని సేకరించండి",
    feature3Title: "అపాయింట్‌మెంట్ బుకింగ్",
    feature3Desc: "క్యాలెండర్‌లో అపాయింట్‌మెంట్లను స్వయంచాలకంగా బుక్ చేయండి",
    feature4Title: "స్మార్ట్ ఆటోమేషన్",
    feature4Desc: "CRM అప్‌డేట్స్, ఫాలో-అప్‌లు మరియు నోటిఫికేషన్లు",

    // Why CallingGen Comparison (Screenshot 2 Exact Telugu)
    whyTag: "కాలింగ్‌జెన్ పరివర్తన",
    whyTitle: "వ్యాపారాలు కాలింగ్‌జెన్ ను ఎందుకు ఎంచుకుంటాయి?",
    whySubtitle: "కాలింగ్‌జెన్ ఎలా సాంప్రదాయ మాన్యువల్ ఫోన్ ఆపరేషన్లను ఆటోమేట్ చేసి, 24/7 AI ఆధారిత వాయిస్ క్యాంపైన్లతో ఒక్క లీడ్ కూడా మిస్ కాకుండా చేస్తుందో చూడండి.",

    withoutCallingGen: "కాలింగ్‌జెన్ లేకుండా",
    traditionalOps: "సంప్రదాయ ఫోన్ ఆపరేషన్లు",
    lowEfficiency: "తక్కువ సమర్థత",

    withCallingGen: "కాలింగ్‌జెన్ తో",
    aiAutomation: "AI వాయిస్ ఆటోమేషన్",
    fullAutomated: "100% ఆటోమేటిడ్",

    prob1Title: "మిస్ అయిన కస్టమర్ కాల్స్",
    prob1Desc: "పీక్ అవర్స్ లేదా ఆఫీస్ అవర్స్ లో కాల్స్ ఆన్సర్ కాకపోవచ్చు.",
    sol1Title: "AI తక్షణమే 24/7 కాల్స్ ఆన్సర్ చేస్తుంది",
    sol1Desc: "మొదటి రింగ్‌లోనే 100% ఇన్బోండ్ కాల్స్ ఆన్సర్ చేయబడతాయి.",

    prob2Title: "మాన్యువల్ ఫాలో-అప్స్ & ఆలస్యాలు",
    prob2Desc: "మాన్యువల్ కాల్‌బ్యాక్స్ కోసం లీడ్స్ చల్లారిపోతాయి.",
    sol2Title: "ఆటోమేటిక్ ఇమిడియట్ ఫాలో-అప్స్",
    sol2Desc: "అవుట్‌బోండ్ AI కాల్స్ & WhatsApp మెసేజ్‌లు రియల్ టైమ్‌లో ట్రిగ్గర్ అవుతాయి.",

    prob3Title: "అర్హతలేని లీడ్స్",
    prob3Desc: "లో-ఇంట్రెస్ట్ లీడ్స్ పై రిపిటేటివ్ సేల్స్ బృందం సమయం వృధా అవుతుంది.",
    sol3Title: "స్మార్ట్ AI లీడ్ క్వాలిఫైకేషన్",
    sol3Desc: "AI ప్రశ్నలు అడిగి స్కోర్ ఇస్తుంది, ఇంట్రెస్ట్ ఫిల్టర్ చేస్తుంది & CRM డేటా లాగ్ చేస్తుంది.",

    prob4Title: "మాన్యువల్ అపాయింట్‌మెంట్ బుకింగ్",
    prob4Desc: "ఇమెయిల్స్ & కాల్స్ ద్వారా ముందుకు వెనుకకు జరిగే బుకింగ్స్.",
    sol4Title: "AI మీటింగ్స్ లైవ్‌లో బుకింగ్ చేస్తుంది",
    sol4Desc: "రియల్-టైమ్ క్యాలెండర్ చెక్ చేసి కాల్ సమయంలోనే మీటింగ్ బుక్ చేస్తుంది.",

    prob5Title: "రియల్-టైమ్ కాల్ ఇన్‌సైట్స్ లేవు",
    prob5Desc: "కాల్స్ నాణ్యత, సెంటిమెంట్ లేదా అవకాశాలపై స్పష్టమైన సమాచారం లేదు.",
    sol5Title: "లైవ్ అనాటిలిటిక్స్ & ట్రాన్స్‌క్రిప్షన్స్",
    sol5Desc: "ఇన్‌స్టంట్ ట్రాన్స్‌క్రిప్షన్స్, AI సమ్మరీలు & సెంటిమెంట్ రిపోర్ట్స్ పొందండి.",

    prob6Title: "టీమ్ ఓవర్‌లోడెడ్ & అలసట",
    prob6Desc: "రిపిటేటివ్ కాల్స్ కారణంగా హ్యూమన్ ఏజెంట్స్ అలసిపోతారు.",
    sol6Title: "AI రిపిటేటివ్ వర్క్స్‌ను డీల్ చేస్తుంది",
    sol6Desc: "హ్యూమన్ టీమ్‌లు హై-వాల్యూ క్లోజింగ్ & స్ట్రాటజీపై ఫోకస్ చేయగలవు.",

    // Features Section
    whyCallingGenTag: "ఎందుకు కాలింగ్‌జెన్",
    featuresTag: "ప్లాట్‌ఫారమ్ సామర్థ్యాలు",
    featuresTitleMain: "మీ బిజినెస్ కాల్స్‌ను ఆటోమేట్ చేయడానికి మీకు కావలసినవన్నీ",
    featuresSubtitleMain: "కాలింగ్‌జెన్ యొక్క వాయిస్ AI ఫీచర్లు డయలింగ్ నుండి లీడ్ క్వాలిఫైకేషన్ మరియు మీటింగ్ బుకింగ్ వరకు మీ పూర్తి కాలింగ్ వర్క్‌ఫ్లోను ఎలా సులభతరం చేస్తాయో తెలుసుకోండి.",

    // Industries Section
    indTag: "పరిశ్రమ పరిష్కారాలు",
    indTitle: "మీ పరిశ్రమ కోసం ప్రత్యేకంగా నిర్మించబడింది",
    indSubtitle: "కాలింగ్‌జెన్ మీ పరిశ్రమ యొక్క ప్రత్యేక కాల్ పరిస్థితులు, స్క్రిప్ట్‌లు మరియు బహుభాషా కస్టమర్ ప్రాధాన్యతలకు అనుగుణంగా పనిచేస్తుంది.",
    indChallengesHeader: "సాంప్రదాయ పరిశ్రమ సవాళ్లు",
    indSolutionsHeader: "కాలింగ్‌జెన్ దీనిని ఎలా పరిష్కరిస్తుంది",

    // FAQs
    faqTag: "ప్రశ్నలు ఉన్నాయా?",
    faqTitle: "తరచుగా అడిగే ప్రశ్నలు",
    faqSubtitle: "మీ సంస్థ కోసం AI వాయిస్ ఏజెంట్లను అమలు చేయడం గురించి మీరు తెలుసుకోవలసినవన్నీ.",

    faq1Q: "1. కాలింగ్‌జెన్ అంటే ఏమిటి మరియు ఇది నా వ్యాపారం కోసం ఎలా పనిచేస్తుంది?",
    faq1A: "కాలింగ్‌జెన్ అనేది ఇన్‌బౌండ్ మరియు అవుట్‌బౌండ్ బిజినెస్ కాల్‌లను నిర్వహించడానికి కస్టమ్ AI ఏజెంట్‌లను నిర్మించే AI వాయిస్ కాలింగ్ SaaS ప్లాట్‌ఫారమ్.",

    faq2Q: "2. కాలింగ్‌జెన్ AI ఏజెంట్లు ఇన్‌బౌండ్ మరియు అవుట్‌బౌండ్ రెండింటినీ నిర్వహించగలవా?",
    faq2A: "అవును! కాలింగ్‌జెన్ ఇన్‌బౌండ్ ఫోన్ రిసెప్షన్ మరియు అవుట్‌బౌండ్ సేల్స్ క్యాంపైన్‌లు రెండింటికీ మద్దతు ఇస్తుంది.",

    faq3Q: "3. కాలింగ్‌జెన్ CRM, వాట్సాప్ మరియు గూగుల్ క్యాలెండర్‌తో అనుసంధానించబడుతుందా?",
    faq3A: "అవును, కాలింగ్‌జెన్ ప్రధాన CRM లు, వాట్సాప్ మరియు గూగుల్ క్యాలెండర్‌తో సజావుగా అనుసంధానించబడుతుంది.",

    faq4Q: "4. కాలింగ్‌జెన్ AI ఏ భాషలకు మద్దతు ఇస్తుంది?",
    faq4A: "కాలింగ్‌జెన్ ఇంగ్లీష్, హిందీ, తెలుగు, తమిళం వంటి 12 కంటే ఎక్కువ భాషలకు మద్దతు ఇస్తుంది.",

    faq5Q: "5. నా మొదటి AI వాయిస్ ఏజెంట్‌ను ఎంత త్వరగా ప్రారంభించవచ్చు?",
    faq5A: "మీరు 10 నిమిషాల కంటే తక్కువ సమయంలో మీ మొదటి AI వాయిస్ ఏజెంట్‌ను ప్రారంభించవచ్చు!",

    // Testimonials
    testiTitle: "మా కస్టమర్‌లు ఏమి చెప్తున్నారు",
    testiSubtitle: "వారి కస్టమర్ సంభాషణలను నిర్వహించడానికి కాలింగ్‌జెన్‌ను విశ్వసించే వేలాది వ్యాపారాలలో చేరండి.",

    t1Name: "రాహుల్ శర్మ",
    t1Role: "ఫౌండర్",
    t1Company: "శర్మ రియల్టీ",
    t1Content: "కాలింగ్‌జెన్ ఉపయోగించి మేము మిస్డ్ కాల్‌లను తగ్గించాము మరియు ప్రాపర్టీ విజిట్‌లను పెంచాము.",

    t2Name: "ప్రియ రెడ్డి",
    t2Role: "డైరెక్టర్",
    t2Company: "బ్రైట్ టాక్స్ కన్సల్టెంట్స్",
    t2Content: "మా ఫాలో-అప్‌లు ఇప్పుడు పూర్తిగా ఆటోమేట్ చేయబడ్డాయి మరియు క్లయింట్లు తక్షణ సమాధానాలను పొందుతారు.",

    t3Name: "అమిత్ పటేల్",
    t3Role: "సిఇఓ",
    t3Company: "డిజిటల్ రీచ్ ఏజెన్సీ",
    t3Content: "కాలింగ్‌జెన్ లీడ్‌లను వేగంగా క్వాలిఫై చేయడానికి మరియు మా టీమ్ ఉత్పాదకతను మెరుగుపరచడానికి సహాయపడింది.",

    // Final CTA
    finalCtaTitle: "మీ బిజినెస్ కాల్స్‌ను ఆటోమేట్ చేయడానికి సిద్ధంగా ఉన్నారా?",
    finalCtaSubtitle: "కాలింగ్‌జెన్ మీ వ్యాపారానికి కాల్‌లకు సమాధానం ఇవ్వడానికి, లీడ్‌లను క్వాలిఫై చేయడానికి సహాయపడుతుంది.",
    contactSales: "సేల్స్‌ను సంప్రదించండి",

    // Get Call Modal
    getCallTitle: "తక్షణ AI టెస్ట్ కాల్ పొందండి",
    getCallSubtitle: "కాలింగ్‌జెన్ యొక్క AI వాయిస్ ఏజెంట్ రియల్ టైమ్‌లో ఎలా సంభాషిస్తుందో అనుభవించండి.",
    fullNameLabel: "పూర్తి పేరు",
    workEmailLabel: "వర్క్ ఇమెయిల్",
    phoneNumberLabel: "ఫోన్ నంబర్",
    companyNameLabel: "కంపెనీ పేరు",
    industryLabel: "పరిశ్రమ",
    triggerCallBtn: "ఇప్పుడే నాకు కాల్ చేయండి",

    // Footer
    footerDesc: "ఆధునిక వ్యాపారాల కోసం కస్టమర్ కమ్యూనికేషన్లను ఆటోమేట్ చేసే AI వాయిస్ ఏజెంట్ ప్లాట్‌ఫారమ్.",
    allRightsReserved: "అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.",
  },

  hi: {
    // Navbar
    navPricing: "मूल्य निर्धारण",
    navContact: "संपर्क करें",
    navLogin: "लॉगिन",
    navDashboard: "डैशबोर्ड",
    getCall: "कॉल करें",

    // Hero Main
    heroBadge: "AI वॉइस कॉलिंग प्लेटफॉर्म",
    heroHeading: "आपके व्यवसाय की कॉल्स को स्वचालित रूप से प्रबंधित करने वाले ",
    heroHeadingHighlight: "AI वॉइस एजेंट",
    heroSubheading: "कॉल्लिंगजेन आपके व्यवसाय के लिए इनबाउंड और आउटबाउंड कॉल्स को स्वचालित करता है, लीड्स को क्वालिफाई करता है, अपॉइंटमेंट बुक करता है और AI वॉइस एजेंटों के साथ आपका कीमती समय बचाता है।",
    primaryCta: "कॉल करें",
    secondaryCta: "देखें यह कैसे काम करता है ➔",

    // Trust Features
    feature247: "24/7 AI कॉलिंग",
    featureMultiLang: "बहुभाषी सहायता",
    featureCrm: "CRM इंटीग्रेशन",
    featureWhatsapp: "WhatsApp इंटीग्रेशन",

    // Mockup Header
    overview: "सारांश",
    dashboard: "डैशबोर्ड",
    proPlan: "प्रो प्लान",
    credits: "850 क्रेडिट्स",
    userName: "उपयोगकर्ता नाम",

    // Mockup Sidebar
    navigation: "नेविगेशन",
    navCalendar: "कैलेंडर",
    navCallManager: "कॉल मैनेजर",
    navCallLogs: "कॉल लॉग्स",
    navCampaign: "अभियान",
    navReport: "रिपोर्ट्स",
    welcomeBack: "पुनः स्वागत है, उपयोगकर्ता नाम",
    campaignSubtitle: "आज आपके अभियानों में क्या हो रहा है, यहाँ देखें।",
    newCampaign: "नया अभियान",

    // Mockup Metrics Cards
    totalCampaigns: "कुल अभियान",
    totalCalls: "कुल कॉल्स",
    completedCalls: "पूर्ण कॉल्स",
    interestedLeads: "इच्छुक लीड्स",
    callbacks: "कॉलबैक्स",
    metricCredits: "क्रेडिट्स",
    activeAgents: "सक्रिय एजेंट्स",
    successRate: "सफलता दर",

    // Mockup Floating Cards
    inboundCall: "इनबाउंड कॉल",
    answeredByAi: "AI द्वारा उत्तर दिया गया",
    leadQualified: "लीड क्वालिफाइड",
    appointmentSynced: "अपॉइंटमेंट CRM में सिंक हो गया",

    // About Section
    aboutTag: "कॉल्लिंगजेन के बारे में",
    aboutTitle: "कॉल्लिंगजेन क्या है?",
    aboutSubtitle: "कॉल्स का उत्तर न मिलने या फॉलो-अप में देरी होने पर व्यवसाय मूल्यवान लीड्स खो देते हैं। कॉल्लिंगजेन AI वॉइस एजेंटों के साथ इसे हल करता है जो तुरंत उत्तर देते हैं और पूरी कॉलिंग प्रक्रिया को स्वचालित करते हैं।",

    step1Title: "लॉगिन",
    step1Subtext: "अपने डैशबोर्ड पर पहुंचें",
    step2Title: "अभियान बनाएं",
    step2Subtext: "लक्ष्य, स्क्रिप्ट और सेटिंग्स सेट करें",
    step3Title: "संपर्क अपलोड करें",
    step3Subtext: "अपनी संपर्क सूची अपलोड करें",
    step4Title: "अभियान शुरू करें",
    step4Subtext: "समीक्षा करें और शुरू करें",
    step5Title: "AI कॉल्स शुरू हुईं",
    step5Subtext: "AI कॉल्स करके बातचीत संभालता है",
    step5Status: "स्पोकन AI बातचीत सक्रिय",

    feature1Title: "AI वॉइस कॉल्स",
    feature1Desc: "प्राकृतिक रूप से इंसान जैसी बातचीत।",
    feature2Title: "लीड क्वालिफिकेशन",
    feature2Desc: "लीड्स को क्वालिफाई करें और महत्वपूर्ण जानकारी कैप्चर करें।",
    feature3Title: "अपॉइंटमेंट बुकिंग",
    feature3Desc: "कैलेंडर में स्वचालित रूप से अपॉइंटमेंट बुक करें।",
    feature4Title: "स्मार्ट ऑटोमेशन",
    feature4Desc: "CRM अपडेट, फॉलो-अप और सूचनाएं।",

    // Why CallingGen Comparison
    whyTag: "कॉल्लिंगजेन परिवर्तन",
    whyTitle: "व्यवसाय कॉल्लिंगजेन क्यों चुनते हैं?",
    whySubtitle: "देखें कि कैसे कॉल्लिंगजेन 24/7 AI वॉइस अभियानों के साथ आपकी पारंपरिक कॉलिंग प्रक्रिया को बदलता है।",

    withoutCallingGen: "कॉल्लिंगजेन के बिना",
    traditionalOps: "पारंपरिक फोन संचालन",
    lowEfficiency: "कम दक्षता",

    withCallingGen: "कॉल्लिंगजेन के साथ",
    aiAutomation: "AI वॉइस ऑटोमेशन",
    fullAutomated: "100% स्वचालित",

    prob1Title: "छूटी हुई ग्राहक कॉल्स",
    prob1Desc: "व्यस्त समय या कार्यालय के बाद कॉल्स का उत्तर नहीं मिलता।",
    sol1Title: "AI तुरंत 24/7 कॉल्स का उत्तर देता है",
    sol1Desc: "पहली रिंग में ही 100% इनबाउंड कॉल्स का उत्तर दिया जाता है।",

    prob2Title: "मैनुअल फॉलो-अप और देरी",
    prob2Desc: "मैनुअल कॉलबैक का इंतजार करते हुए लीड्स ठंडी पड़ जाती हैं।",
    sol2Title: "स्वचालित तत्काल फॉलो-अप",
    sol2Desc: "आउटबाउंड AI कॉल्स और वॉट्सएप संदेश रियल टाइम में ट्रिगर होते हैं।",

    prob3Title: "अयोग्य लीड्स",
    prob3Desc: "कम रुचि वाले संभावित ग्राहकों पर बिक्री टीम का समय बर्बाद होता है।",
    sol3Title: "स्मार्ट AI लीड क्वालिफिकेशन",
    sol3Desc: "AI स्क्रीनिंग प्रश्न पूछता है, स्कोर करता है और CRM डेटा लॉग करता है।",

    prob4Title: "मैनुअल अपॉइंटमेंट बुकिंग",
    prob4Desc: "मीटिंग्स शेड्यूल करने के लिए बार-बार ईमेल और कॉल्स।",
    sol4Title: "AI लाइव मीटिंग्स बुक करता है",
    sol4Desc: "कॉल्स के दौरान रियल टाइम कैलेंडर जांच और सीधी मीटिंग बुकिंग।",

    prob5Title: "कोई रियल-टाइम कॉल अंतर्दृष्टि नहीं",
    prob5Desc: "कॉल गुणवत्ता, भावना या छूटे हुए अवसरों की कोई स्पष्टता नहीं।",
    sol5Title: "लाइव एनालिटिक्स और ट्रांसक्रिप्शन",
    sol5Desc: "तत्काल ट्रांसक्रिप्शन, AI सारांश और भावना रिपोर्टिंग।",

    prob6Title: "टीम ओवरलोडेड और थकी हुई",
    prob6Desc: "दौहराए जाने वाले फोन स्क्रिप्ट्स से मानव एजेंट थक जाते हैं।",
    sol6Title: "AI दोहराए जाने वाले काम को संभालता है",
    sol6Desc: "मानव टीमें उच्च-मूल्य समापन और रणनीति पर ध्यान केंद्रित कर सकती हैं।",

    // Features Section
    whyCallingGenTag: "कॉल्लिंगजेन क्यों",
    featuresTag: "प्लेटफॉर्म क्षमताएं",
    featuresTitleMain: "व्यावसायिक कॉल्स को स्वचालित करने के लिए सब कुछ",
    featuresSubtitleMain: "जानें कि कॉल्लिंगजेन की वॉइस AI विशेषताएं आपके कॉलिंग कार्यप्रवाह को कैसे सुव्यवस्थित करती हैं।",

    // Industries Section
    indTag: "उद्योग समाधान",
    indTitle: "आपके उद्योग के लिए विशेष रूप से निर्मित",
    indSubtitle: "कॉल्लिंगजेन आपके उद्योग के अद्वितीय परिदृश्यों, स्क्रिप्ट्स और बहुभाषी प्राथमिकताओं के अनुकूल काम करता है।",
    indChallengesHeader: "पारंपरिक उद्योग चुनौतियां",
    indSolutionsHeader: "कॉल्लिंगजेन इसे कैसे हल करता है",

    // FAQs
    faqTag: "कोई सवाल?",
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
    faqSubtitle: "अपने संगठन के लिए AI वॉइस एजेंटों को तैनात करने के बारे में सब कुछ।",

    faq1Q: "1. कॉल्लिंगजेन क्या है और यह मेरे व्यवसाय के लिए कैसे काम करता है?",
    faq1A: "कॉल्लिंगजेन एक AI वॉइस कॉलिंग SaaS प्लेटफॉर्म है जो इनबाउंड और आउटबाउंड कॉल्स को संभालने के लिए कस्टम AI एजेंट बनाता है।",

    faq2Q: "2. क्या कॉल्लिंगजेन AI एजेंट इनबाउंड और आउटबाउंड दोनों संभाल सकते हैं?",
    faq2A: "हाँ! कॉल्लिंगजेन इनबाउंड फोन रिसेप्शन और आउटबाउंड सेल्स अभियानों दोनों का समर्थन करता है।",

    faq3Q: "3. क्या कॉल्लिंगजेन CRM, व्हाट्सएप और गूगल कैलेंडर के साथ एकीकृत होता है?",
    faq3A: "हाँ, कॉल्लिंगजेन प्रमुख CRM, व्हाट्सएप और गूगल कैलेंडर के साथ आसानी से एकीकृत होता है।",

    faq4Q: "4. कॉल्लिंगजेन AI किन भाषाओं का समर्थन करता है?",
    faq4A: "कॉल्लिंगजेन अंग्रेजी, हिंदी, तेलुगु, तमिल जैसी 12+ भाषाओं का समर्थन करता है।",

    faq5Q: "5. मैं अपना पहला AI वॉइस एजेंट कितनी जल्दी शुरू कर सकता हूँ?",
    faq5A: "आप 10 मिनट से भी कम समय में अपना पहला AI वॉइस एजेंट शुरू कर सकते हैं!",

    // Testimonials
    testiTitle: "हमारे ग्राहक क्या कहते हैं",
    testiSubtitle: "हजारों व्यवसायों में शामिल हों जो अपनी ग्राहक बातचीत को संभालने के लिए कॉल्लिंगजेन पर भरोसा करते हैं।",

    t1Name: "राहुल शर्मा",
    t1Role: "संस्थापक",
    t1Company: "शर्मा रियल्टी",
    t1Content: "हमने कॉल्लिंगजेन का उपयोग करके छूटी हुई कॉल्स को कम किया और संपत्ति के दौरों को बढ़ाया।",

    t2Name: "प्रिया रेड्डी",
    t2Role: "निदेशक",
    t2Company: "ब्राइट टैक्स कंसल्टेंट्स",
    t2Content: "हमारे फॉलो-अप अब पूरी तरह से स्वचालित हैं और ग्राहकों को तुरंत उत्तर मिलते हैं।",

    t3Name: "अमित पटेल",
    t3Role: "सीईओ",
    t3Company: "डिजिटल रीच एजेंसी",
    t3Content: "कॉल्लिंगजेन ने हमें लीड्स को तेज़ी से क्वालिफाई करने में मदद की।",

    // Final CTA
    finalCtaTitle: "अपनी व्यावसायिक कॉल्स को स्वचालित करने के लिए तैयार हैं?",
    finalCtaSubtitle: "देखें कि कॉल्लिंगजेन आपके व्यवसाय की कॉल्स का उत्तर देने में कैसे मदद कर सकता है।",
    contactSales: "बिक्री से संपर्क करें",

    // Get Call Modal
    getCallTitle: "तत्काल AI टेस्ट कॉल प्राप्त करें",
    getCallSubtitle: "अनुभव करें कि कॉल्लिंगजेन का AI एजेंट कैसे बातचीत करता है।",
    fullNameLabel: "पूरा नाम",
    workEmailLabel: "कार्य ईमेल",
    phoneNumberLabel: "फोन नंबर",
    companyNameLabel: "कंपनी का नाम",
    industryLabel: "उद्योग",
    triggerCallBtn: "मुझे अभी कॉल करें",

    // Footer
    footerDesc: "आधुनिक व्यवसायों के लिए ग्राहक संचार को स्वचालित करने वाला AI वॉइस एजेंट प्लेटफॉर्म।",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
  }
};

export type TranslationKey = keyof typeof translations.en;
