import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Donor } from '../models/Donor';
import { COMPATIBILITY_MAP } from '../utils/matching';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Service] GEMINI_API_KEY is not defined. Using local fallback rule engine.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Checks eligibility using Gemini model or fallback heuristic
 */
export const checkEligibility = async (req: any, res: Response) => {
  const { weight, age, lastDonationDate, chronicConditions, medications } = req.body;

  try {
    if (!weight || !age) {
      return res.status(400).json({ message: 'Weight and age are required' });
    }

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    let isEligible = true;
    let reason = 'Approved for blood donation by AI Eligibility Checker.';
    const genAI = getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          Analyze the following donor metrics for blood donation eligibility and respond in a clear JSON format.
          
          Donor Metrics:
          - Age: ${age} years old
          - Weight: ${weight} kg
          - Last Donation Date: ${lastDonationDate || 'Never'}
          - Chronic Conditions: ${chronicConditions || 'None'}
          - Medications: ${medications || 'None'}
          
          Standard Medical Guidelines for reference:
          1. Age must be between 18 and 65 years.
          2. Weight must be at least 45 kg (typically 50 kg for normal units).
          3. Cooldown between donations is 90 days.
          4. No major active chronic infections (HIV, Hepatitis) or severe blood pressure issues.
          
          Provide the output as JSON:
          {
            "isEligible": true/false,
            "reason": "Detailed summary explanation of the medical reasoning"
          }
        `;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        });

        const text = result.response.text();
        const parsed = JSON.parse(text);
        isEligible = parsed.isEligible;
        reason = parsed.reason;
      } catch (aiError: any) {
        console.error('[AI Service] Gemini Error, using fallback heuristics:', aiError.message);
        // Fallback to local rule engine if AI fails
        const localResult = evaluateEligibilityLocally(age, weight, lastDonationDate, chronicConditions, medications);
        isEligible = localResult.isEligible;
        reason = localResult.reason;
      }
    } else {
      // Local fallback rule engine
      const localResult = evaluateEligibilityLocally(age, weight, lastDonationDate, chronicConditions, medications);
      isEligible = localResult.isEligible;
      reason = localResult.reason;
    }

    // Save eligibility to Donor database profile
    donor.eligibilityStatus = {
      isEligible,
      reason,
      checkedAt: new Date(),
    };
    if (lastDonationDate) {
      donor.lastDonationDate = new Date(lastDonationDate);
    }
    await donor.save();

    res.status(200).json({
      message: 'Eligibility evaluation completed',
      status: donor.eligibilityStatus,
    });
  } catch (error: any) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ message: 'Server error check eligibility', error: error.message });
  }
};

/**
 * Chat Assistant handling donor compatibility inquiries
 */
export const chatAssistant = async (req: Request, res: Response) => {
  const { message, chatHistory } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const genAI = getGeminiClient();

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: `You are an AI Blood Donation Compatibility Assistant. 
          Answer donor questions accurately. 
          Use the following compatibility guidelines:
          - O- can receive from O-
          - O+ can receive from O+, O-
          - A- can receive from A-, O-
          - A+ can receive from A+, A-, O+, O-
          - B- can receive from B-, O-
          - B+ can receive from B+, B-, O+, O-
          - AB- can receive from AB-, A-, B-, O-
          - AB+ can receive from anyone (AB+, AB-, A+, A-, B+, B-, O+, O-)
          Be polite, friendly, and structure answers in bullet points. Only answer questions related to blood donation, blood types, eligibility, health requirements, and guidelines. If a user asks about anything else, politely explain that you are specialized in blood donation.`,
        });

        // Format history for Gemini chat API
        const chat = model.startChat({
          history: (chatHistory || []).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });

        const response = await chat.sendMessage(message);
        const reply = response.response.text();

        return res.status(200).json({ reply });
      } catch (aiError: any) {
        console.error('[AI Service] Chat assistant Gemini Error, using rule replies:', aiError.message);
        const reply = evaluateChatLocally(message);
        return res.status(200).json({ reply });
      }
    } else {
      const reply = evaluateChatLocally(message);
      return res.status(200).json({ reply });
    }
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'Server error processing chat request', error: error.message });
  }
};

/**
 * Local Rule Heuristic logic for eligibility checker
 */
const evaluateEligibilityLocally = (
  age: number,
  weight: number,
  lastDonationDate?: string,
  chronicConditions?: string,
  medications?: string
) => {
  if (age < 18 || age > 65) {
    return {
      isEligible: false,
      reason: `Ineligible: Age must be between 18 and 65 years old. Currently registered as ${age}.`,
    };
  }

  if (weight < 50) {
    return {
      isEligible: false,
      reason: `Ineligible: Body weight must be at least 50 kg for blood donation safety. Registered weight: ${weight} kg.`,
    };
  }

  if (lastDonationDate) {
    const diffTime = Math.abs(new Date().getTime() - new Date(lastDonationDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      return {
        isEligible: false,
        reason: `Ineligible: Safety cooldown check. You donated ${diffDays} days ago. Please wait 90 days between blood donations.`,
      };
    }
  }

  if (chronicConditions && /hiv|hepatitis|cancer|diabetes|kidney/i.test(chronicConditions)) {
    return {
      isEligible: false,
      reason: `Ineligible: Active chronic condition reported ("${chronicConditions}"). Safety guidelines exclude candidates with major blood pressure or immune issues.`,
    };
  }

  if (medications && /blood thinner|antibiotic|immunosuppressant/i.test(medications)) {
    return {
      isEligible: false,
      reason: `Ineligible: Active medication schedule contains high-risk compounds. Please wait until completing your prescription.`,
    };
  }

  return {
    isEligible: true,
    reason: 'Approved: You satisfy all core health guidelines (Age, Weight, and Donation interval checks successful).',
  };
};

const evaluateChatLocally = (message: string): string => {
  const msg = message.toLowerCase();

  // 1. Basic Greetings
  if (msg.startsWith('hi') || msg.startsWith('hello') || msg.startsWith('hey') || msg.includes('greetings')) {
    return `Hello! I'm your LifeFlow compatibility assistant. How can I help you today? You can ask about compatibility for specific blood types (e.g., "Can A+ donate to AB-?") or donation guidelines.`;
  }

  if (msg.includes('thank') || msg.includes('thanks') || msg.includes('awesome') || msg.includes('great')) {
    return `You're very welcome! If you have any more questions about blood groups, donation intervals, or compatibility rules, feel free to ask. Stay safe!`;
  }

  // 2. Specific compatibility pairings (e.g. "Can O- donate to AB+?")
  const bloodGroupsRegex = /(ab\+|ab\-|a\+|a\-|b\+|b\-|o\+|o\-)/gi;
  const groupsFound = msg.match(bloodGroupsRegex);
  
  if (groupsFound && groupsFound.length >= 2) {
    const donor = groupsFound[0].toUpperCase();
    const recipient = groupsFound[1].toUpperCase();
    const compatibleDonors = COMPATIBILITY_MAP[recipient] || [];
    const isCompatible = compatibleDonors.includes(donor);
    
    if (isCompatible) {
      return `### Compatibility Match: Yes! ✅
*   **Donor**: **${donor}**
*   **Recipient**: **${recipient}**

**Yes**, a donor with blood group **${donor}** can safely donate to a recipient with blood group **${recipient}**. 
*(Reason: Recipients with ${recipient} blood can receive from: ${compatibleDonors.join(', ')}).*`;
    } else {
      return `### Compatibility Mismatch: No ❌
*   **Donor**: **${donor}**
*   **Recipient**: **${recipient}**

**No**, blood group **${donor}** is **not compatible** with recipient blood group **${recipient}**. 
*(Reason: Recipients with ${recipient} blood can only receive from: ${compatibleDonors.join(', ')}).*`;
    }
  }

  // 3. Single Blood Type query (e.g. "Who can O- donate to?" or "Who can AB+ receive from?")
  if (groupsFound && groupsFound.length === 1) {
    const bg = groupsFound[0].toUpperCase();
    
    if (msg.includes('receive') || msg.includes('recipient') || msg.includes('get') || msg.includes('take')) {
      const compatibleDonors = COMPATIBILITY_MAP[bg] || [];
      return `### Recipient Guidelines for ${bg}
A recipient with blood group **${bg}** can receive blood from:
${compatibleDonors.map(d => `*   **${d}**`).join('\n')}

*Note: O- is the universal donor, but can only receive from O- itself.*`;
    }
    
    if (msg.includes('donate') || msg.includes('give') || msg.includes('donor') || msg.includes('send')) {
      const canDonateTo = [];
      for (const [recipientBg, donors] of Object.entries(COMPATIBILITY_MAP)) {
        if (donors.includes(bg)) {
          canDonateTo.push(recipientBg);
        }
      }
      return `### Donor Guidelines for ${bg}
A donor with blood group **${bg}** can donate blood to:
${canDonateTo.map(r => `*   **${r}**`).join('\n')}

${bg === 'O-' ? '*Universal Donor: O- blood can be given to patients of any blood group in emergencies.*' : ''}`;
    }
  }

  // 4. Proximity matching details
  if (msg.includes('distance') || msg.includes('proximity') || msg.includes('range') || msg.includes('km') || msg.includes('score') || msg.includes('ranking')) {
    return `### LifeFlow Proximity Matching Algorithm
Our matching engine prioritizes donors dynamically using a weighted formula:
1.  **Availability (40%)**: Verifies if the donor is active and checked in.
2.  **Proximity (40%)**: Calculates coordinate distances via the **Haversine formula**.
3.  **Cooldown (20%)**: Checks that the donor has rested for at least 90 days since their last donation.

*The top 5 matches are automatically notified of emergencies.*`;
  }

  // 5. Emergency alerts questions
  if (msg.includes('emergency') || msg.includes('alert') || msg.includes('request') || msg.includes('hospital')) {
    return `### Creating an Emergency Request
To notify compatible donors in your area:
1.  Navigate to **"Request Emergency Blood"** in the navigation bar.
2.  Enter the patient's name, hospital address, and required blood type.
3.  Select the **Urgency Level** and click **"Create Request"**.

The matching system will locate compatible donors within a 30 km radius and notify them instantly.`;
  }

  // 6. Generic Blood compatibility matrix fallback
  if (msg.includes('chart') || msg.includes('table') || msg.includes('matrix') || msg.includes('guidelines') || msg.includes('rule') || msg.includes('compatibility')) {
    return `### Blood Compatibility Chart
*   **O-**: Can receive from **O-** only.
*   **O+**: Can receive from **O+, O-**.
*   **A-**: Can receive from **A-, O-**.
*   **A+**: Can receive from **A+, A-, O+, O-**.
*   **B-**: Can receive from **B-, O-**.
*   **B+**: Can receive from **B+, B-, O+, O-**.
*   **AB-**: Can receive from **AB-, A-, B-, O-**.
*   **AB+**: Universal Recipient, can receive from **all blood groups**.

*Note: O- is the Universal Donor, capable of donating to any blood group in emergencies.*`;
  }

  // 7. General Fallback
  return `I am your LifeFlow AI Assistant. I can help you with:
*   **Compatibility checks**: e.g., "Can O- donate to AB+?" or "Who can receive A+ blood?"
*   **Donation cooldown rules**: e.g., "How often can I donate?"
*   **Proximity ranking queries**: e.g., "How does donor scoring work?"

How can I help you today?`;
};
