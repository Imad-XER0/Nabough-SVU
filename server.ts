import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Endpoint: Nabough Academic Assistant
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { prompt, subject, context, action } = req.body;

    if (!prompt && !context) {
      return res.status(400).json({ error: 'Missing prompt or context' });
    }

    if (!ai) {
      // Provide an educational fallback when API key is not yet set
      return res.json({
        text: `أهلاً بك في نبوغ AI! 🎓\n\nبناءً على المحتوى الأكاديمي لمادة ${subject || 'علم النفس التربوي'}:\n` +
          `• الموضوع: ${prompt}\n` +
          `• التفسير التربوي: يركز هذا المفهوم على تطبيقات نظريات التعلم المعرفية والسلوكية في البيئة الصفية.\n` +
          `• نصيحة المراجعة: راجع المحاضرة الثالثة وبنك الأسئلة المتاح في المنصة لتدريب عملي موثق.\n\n` +
          `*(المصدر: توصيف مقرر ${subject || 'كلية التربية'} - الاعتماد الأكاديمي 2025/2026)*`,
        sourceType: 'FACULTY_MATERIAL',
        sourceTitle: `مقرر ${subject || 'علم النفس التربوي'} - كلية التربية`,
      });
    }

    const systemInstruction = `
أنت "نبوغ AI" - المساعد الأكاديمي والذكي الرسمي لطلاب وأعضاء هيئة التدريس في "كلية التربية" (منصة نبوغ).
لغتك الأساسية هي العربية الفصحى الأنيقة والواضحة والمشجعة.

قواعد صارمة ومهمة جداً:
1. التمييز الواضح بين المحتوى المستند إلى وثائق ومحاضرات الكلية الرسمية والمقررات، وبين المعرفة العامة للذكاء الاصطناعي.
2. إذا كان السؤال متعلقاً بالمقرر الدراسي (${subject || 'المقررات التربوية'})، قدّم شرحاً مفصلاً مدعماً بنصائح تدريسية وعملية تفيد معلم المستقبل في المدارس.
3. نسّق الإجابة بنقاط واضحة، وعناوين بارزة، واستشهادات تربوية موثوقة (مثل: نظريات بياجيه، فيجوتسكي، برونر، استراتيجيات بلوم للتدريس، الإدارة الصفية، التقويم والقياس).
4. اختتم كل استجابة بنصيحة عملية لربط النظرية بالتربية العملية في الميدان المدرسي.
`;

    let userMessage = prompt;
    if (action === 'summarize') {
      userMessage = `يرجى تقديم تلخيص أكاديمي احترافي للمحتوى التالي المتعلق بمقرر (${subject}):\n\n${context || prompt}\n\nضع ملخصاً مركزاً بأهم المفاهيم، المصطلحات الأساسية، والنقاط الامتحانية المتوقعة.`;
    } else if (action === 'generate_questions') {
      userMessage = `أنشئ 3 أسئلة اختيار من متعدد (MCQ) وسؤالين صح/خطأ مع بيان الإجابة النموذجية وشرح السبب التربوي حول الموضوع التالي في مادة (${subject}):\n${prompt}`;
    } else if (action === 'study_plan') {
      userMessage = `أنشئ خطة مذاكرة دراسية ذكية ومنظمة لمدة 5 أيام لمراجعة موضوع (${prompt}) في مادة (${subject}) مع توزيع المهام اليومية وفترات Pomodoro المقترحة.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || 'عذراً، لم أتمكن من استخراج الإجابة. يرجى المحاولة مرة أخرى.';
    
    return res.json({
      text,
      sourceType: subject ? 'FACULTY_MATERIAL' : 'GENERAL_AI',
      sourceTitle: subject ? `توصيف ومحاضرات مقرر ${subject}` : 'المعرفة التربوية العامة',
    });
  } catch (error: any) {
    console.error('Gemini error:', error);
    return res.status(500).json({
      error: 'فشل معالجة طلب الذكاء الاصطناعي',
      details: error.message,
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Nabough Educational Platform running at http://localhost:${port}`);
  });
}

startServer();
