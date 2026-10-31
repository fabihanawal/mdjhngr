import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function summarizeReport(title: string, description: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `১ নং বদলগাছী ইউনিয়ন পরিষদ নির্বাচনে চেয়ারম্যান পদপ্রার্থী মুহাম্মদ জাহাঙ্গীর আলমের নাগরিক অভিযোগ ও পরামর্শ সেলের জন্য নিচের নাগরিক রিপোর্টটির সংক্ষিপ্ত ও কার্যকরী সারমর্ম বাংলায় লিখুন। মূল সমস্যা ও স্থান উল্লেখ করুন।
      শিরোনাম: ${title}
      বিবরণ: ${description}`,
    });
    return response.text || "সারাংশ প্রস্তুত করা সম্ভব হয়নি।";
  } catch (error) {
    console.error("Gemini summarizing error:", error);
    return "এআই বিশ্লেষণ এই মুহূর্তে প্রস্তুত করা যায়নি।";
  }
}

export async function getActionPlan(category: string, description: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `১ নং বদলগাছী ইউনিয়ন পরিষদের চেয়ারম্যান পদপ্রার্থী মুহাম্মদ জাহাঙ্গীর আলমের নাগরিক সেবা সেলের দায়িত্বপ্রাপ্ত কর্মকর্তা হিসেবে নিচের সমস্যার দ্রুত সমাধানে ৩টি বাস্তবিক কার্যকরী পদক্ষেপ বাংলায় লিখুন:
      খাত: ${category}
      সমস্যা: ${description}`,
    });
    return response.text || "কোনো প্রস্তাবিত পদক্ষেপ পাওয়া যায়নি।";
  } catch (error) {
    console.error("Gemini action plan error:", error);
    return "ওয়ার্ড প্রতিনিধির সাথে যোগাযোগ করে সমস্যাটির সরেজমিন যাচাই ও দ্রুত সমাধানের ব্যবস্থা গ্রহণ করুন।";
  }
}
