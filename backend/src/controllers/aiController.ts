import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Donor } from '../models/Donor';

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

/**
 * Local Rule replies for AI Chatbot
 */
const evaluateChatLocally = (message: string): string => {
  const msg = message.toLowerCase();

  if (msg.includes('receive') || msg.includes('donate') || msg.includes('compatible') || msg.includes('compatibility')) {
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

  if (msg.includes('eligibility') || msg.includes('eligible') || msg.includes('weight') || msg.includes('age')) {
    return `### Donation Eligibility Requirements
1. **Age**: 18 to 65 years old.
2. **Weight**: Must be at least 50 kg.
3. **Frequency**: Minimum 90 days wait between donations.
4. **Health**: Free of colds, flu, active infections, and major active medications (e.g. blood thinners).`;
  }

  return `Hello! I am your Blood Bank Assistant. 

I can answer compatibility questions (e.g., "Who can receive AB+ blood?") or details about general eligibility requirements (weight, age thresholds, and donation cooldowns). 

How can I help you today?`;
};
