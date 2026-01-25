const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key'; // Change this in production

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files

// In-memory user store (use database in production)
let users = [
  { id: 1, email: 'student@example.com', password: '$2a$10$examplehashedpassword', role: 'student', name: 'John Doe' },
  { id: 2, email: 'teacher@example.com', password: '$2a$10$examplehashedpassword', role: 'teacher', name: 'Jane Smith' },
  { id: 3, email: 'admin@demo.com', password: '$2a$10$0EVGEdvc899SyMDC1PCHgOYkyxkJp12dlXagnn0cUQL0hk8X9icl6', role: 'admin', name: 'Demo Admin' },
  { id: 4, email: 'parent@example.com', password: '$2a$10$examplehashedpassword', role: 'parent', name: 'Parent User' }
];

// In-memory course data store
let courses = [
  {
    id: 1,
    name: 'Class 6 - English',
    description: 'Grammar, Literature, Notes, Live Doubt-Solving',
    modules: [1, 2] // module ids
  },
  {
    id: 2,
    name: 'Class 6 - Hindi',
    description: 'व्याकरण, साहित्य, नोट्स, लाइव डाउट',
    modules: [3, 4]
  },
  // Add more courses as needed for classes 7-12
];

let modules = [
  {
    id: 1,
    courseId: 1,
    name: 'Grammar Basics',
    lessons: [1, 2, 3, 4] // lesson ids
  },
  {
    id: 2,
    courseId: 1,
    name: 'Literature Introduction',
    lessons: [5, 6, 7, 8]
  },
  {
    id: 3,
    courseId: 2,
    name: 'व्याकरण मूल',
    lessons: [9, 10, 11, 12]
  },
  {
    id: 4,
    courseId: 2,
    name: 'साहित्य परिचय',
    lessons: [13, 14, 15, 16]
  }
];

let lessons = [
  {
    id: 1,
    moduleId: 1,
    type: 'video',
    title: 'Introduction to Nouns',
    content: 'https://example.com/video1.mp4',
    completed: false
  },
  {
    id: 2,
    moduleId: 1,
    type: 'notes',
    title: 'Noun Notes',
    content: 'https://example.com/notes1.pdf',
    completed: false
  },
  {
    id: 3,
    moduleId: 1,
    type: 'practice',
    title: 'Noun Practice Questions',
    content: ['What is a noun?', 'Identify the nouns in the sentence.'],
    completed: false
  },
  {
    id: 4,
    moduleId: 1,
    type: 'quiz',
    title: 'Grammar Quiz',
    content: {
      timeLimit: 300, // 5 minutes in seconds
      questions: [
        {
          id: 1,
          text: 'What is a noun?',
          options: ['A word that describes an action', 'A word that names a person, place, thing, or idea', 'A word that shows emotion', 'A word that connects clauses'],
          correctAnswer: 1,
          topic: 'Nouns'
        },
        {
          id: 2,
          text: 'Which of the following is an example of a proper noun?',
          options: ['book', 'London', 'dog', 'happiness'],
          correctAnswer: 1,
          topic: 'Nouns'
        },
        {
          id: 3,
          text: 'What is a verb?',
          options: ['A naming word', 'An action word', 'A describing word', 'A connecting word'],
          correctAnswer: 1,
          topic: 'Verbs'
        }
      ]
    },
    completed: false
  },
  // Add more lessons for other modules
  {
    id: 5,
    moduleId: 2,
    type: 'video',
    title: 'Poetry Basics',
    content: 'https://example.com/video2.mp4',
    completed: false
  },
  {
    id: 6,
    moduleId: 2,
    type: 'notes',
    title: 'Literature Notes',
    content: 'https://example.com/notes2.pdf',
    completed: false
  },
  {
    id: 7,
    moduleId: 2,
    type: 'practice',
    title: 'Literature Practice',
    content: ['Analyze the poem.', 'Write a summary.'],
    completed: false
  },
  {
    id: 8,
    moduleId: 2,
    type: 'quiz',
    title: 'Literature Quiz',
    content: {
      timeLimit: 300,
      questions: [
        {
          id: 1,
          text: 'What is poetry?',
          options: ['A type of story', 'A form of written expression using rhythm and rhyme', 'A scientific explanation', 'A mathematical equation'],
          correctAnswer: 1,
          topic: 'Poetry'
        },
        {
          id: 2,
          text: 'Which of the following is an element of literature?',
          options: ['Plot', 'Chemical formula', 'Weather report', 'Recipe ingredients'],
          correctAnswer: 0,
          topic: 'Elements of Literature'
        }
      ]
    },
    completed: false
  },
  // Hindi lessons
  {
    id: 9,
    moduleId: 3,
    type: 'video',
    title: 'संज्ञा परिचय',
    content: 'https://example.com/video3.mp4',
    completed: false
  },
  {
    id: 10,
    moduleId: 3,
    type: 'notes',
    title: 'संज्ञा नोट्स',
    content: 'https://example.com/notes3.pdf',
    completed: false
  },
  {
    id: 11,
    moduleId: 3,
    type: 'practice',
    title: 'संज्ञा अभ्यास',
    content: ['संज्ञा क्या है?', 'वाक्य में संज्ञा पहचानें।'],
    completed: false
  },
  {
    id: 12,
    moduleId: 3,
    type: 'quiz',
    title: 'व्याकरण क्विज',
    content: {
      timeLimit: 300,
      questions: [
        {
          id: 1,
          text: 'संज्ञा क्या है?',
          options: ['क्रिया का नाम', 'व्यक्ति, स्थान, वस्तु या विचार का नाम', 'भावना दिखाने वाला शब्द', 'खंडों को जोड़ने वाला शब्द'],
          correctAnswer: 1,
          topic: 'संज्ञा'
        },
        {
          id: 2,
          text: 'निम्नलिखित में से कौन सा विशेष संज्ञा का उदाहरण है?',
          options: ['किताब', 'दिल्ली', 'कुत्ता', 'खुशी'],
          correctAnswer: 1,
          topic: 'संज्ञा'
        },
        {
          id: 3,
          text: 'क्रिया क्या है?',
          options: ['नाम देने वाला शब्द', 'कार्य करने वाला शब्द', 'वर्णन करने वाला शब्द', 'जोड़ने वाला शब्द'],
          correctAnswer: 1,
          topic: 'क्रिया'
        }
      ]
    },
    completed: false
  },
  {
    id: 13,
    moduleId: 4,
    type: 'video',
    title: 'कविता मूल',
    content: 'https://example.com/video4.mp4',
    completed: false
  },
  {
    id: 14,
    moduleId: 4,
    type: 'notes',
    title: 'साहित्य नोट्स',
    content: 'https://example.com/notes4.pdf',
    completed: false
  },
  {
    id: 15,
    moduleId: 4,
    type: 'practice',
    title: 'साहित्य अभ्यास',
    content: ['कविता का विश्लेषण करें।', 'सारांश लिखें।'],
    completed: false
  },
  {
    id: 16,
    moduleId: 4,
    type: 'quiz',
    title: 'साहित्य क्विज',
    content: {
      timeLimit: 300,
      questions: [
        {
          id: 1,
          text: 'कविता क्या है?',
          options: ['एक प्रकार की कहानी', 'छंद और लय के साथ लिखित अभिव्यक्ति', 'वैज्ञानिक स्पष्टीकरण', 'गणितीय समीकरण'],
          correctAnswer: 1,
          topic: 'कविता'
        },
        {
          id: 2,
          text: 'साहित्य के निम्नलिखित में से कौन सा तत्व है?',
          options: ['कथानक', 'रासायनिक सूत्र', 'मौसम की रिपोर्ट', 'व्यंजन सामग्री'],
          correctAnswer: 0,
          topic: 'साहित्य के तत्व'
        }
      ]
    },
    completed: false
  }
];

// In-memory student data store
let studentData = {
  1: { // student id
    enrolledCourses: [
      { id: 1, name: 'Class 6 - English', progress: 0, lastModule: null, lastLesson: null },
      { id: 2, name: 'Class 6 - Hindi', progress: 0, lastModule: null, lastLesson: null }
    ],
    streak: 5,
    badges: 3,
    doubts: 12,
    lastLogin: new Date(),
    xp: 1250,
    level: 3,
    earnedBadges: ['first_lesson', 'quiz_master', 'streak_5'],
    achievements: [
      { id: 'first_lesson', name: 'First Steps', description: 'Completed your first lesson', icon: '🎓', earnedAt: new Date('2023-09-01') },
      { id: 'quiz_master', name: 'Quiz Master', description: 'Scored 100% on a quiz', icon: '🏆', earnedAt: new Date('2023-09-15') },
      { id: 'streak_5', name: 'Consistency King', description: 'Maintained a 5-day streak', icon: '🔥', earnedAt: new Date('2023-10-01') }
    ]
  }
};

// Gamification data
const LEVELS = [
  { level: 1, xpRequired: 0, name: 'Beginner' },
  { level: 2, xpRequired: 100, name: 'Learner' },
  { level: 3, xpRequired: 300, name: 'Scholar' },
  { level: 4, xpRequired: 600, name: 'Expert' },
  { level: 5, xpRequired: 1000, name: 'Master' },
  { level: 6, xpRequired: 1500, name: 'Grandmaster' },
  { level: 7, xpRequired: 2200, name: 'Legend' },
  { level: 8, xpRequired: 3000, name: 'Myth' },
  { level: 9, xpRequired: 4000, name: 'Immortal' },
  { level: 10, xpRequired: 5500, name: 'Godlike' }
];

const BADGES = {
  first_lesson: { name: 'First Steps', description: 'Completed your first lesson', icon: '🎓', xpReward: 50 },
  quiz_master: { name: 'Quiz Master', description: 'Scored 100% on a quiz', icon: '🏆', xpReward: 100 },
  streak_5: { name: 'Consistency King', description: 'Maintained a 5-day streak', icon: '🔥', xpReward: 75 },
  streak_10: { name: 'Dedication Champion', description: 'Maintained a 10-day streak', icon: '⚡', xpReward: 150 },
  doubt_solver: { name: 'Problem Solver', description: 'Resolved 10 doubts', icon: '🧠', xpReward: 125 },
  course_complete: { name: 'Course Conqueror', description: 'Completed an entire course', icon: '🎯', xpReward: 200 },
  forum_helper: { name: 'Community Helper', description: 'Helped 5 students in forum', icon: '🤝', xpReward: 100 }
};

const XP_REWARDS = {
  lesson_complete: 25,
  quiz_complete: 50,
  quiz_perfect: 100,
  doubt_ask: 10,
  doubt_resolve: 15,
  forum_post: 20,
  forum_help: 30,
  daily_login: 5
};

// In-memory doubt data store
let doubts = [
  {
    id: 1,
    studentId: 1,
    question: 'What is the capital of India?',
    type: 'text',
    image: null,
    aiResponse: 'The capital of India is New Delhi.',
    status: 'resolved',
    escalatedToTeacher: false,
    createdAt: new Date('2023-10-01')
  },
  {
    id: 2,
    studentId: 1,
    question: 'Solve: 2x + 3 = 7',
    type: 'text',
    image: null,
    aiResponse: 'Step 1: Subtract 3 from both sides: 2x = 4\nStep 2: Divide by 2: x = 2',
    status: 'resolved',
    escalatedToTeacher: false,
    createdAt: new Date('2023-10-02')
  }
];

// In-memory quiz results store
let quizResults = [];

// Parent-student relationships
let parentStudentRelationships = [
  {
    id: 1,
    parentId: 4, // parent@example.com
    studentId: 1, // student@example.com
    relationship: 'parent',
    createdAt: new Date('2023-09-01')
  }
];

// Payment and subscription data
let subscriptions = [
  {
    id: 1,
    name: 'Basic Monthly',
    description: 'Access to all Class 6 courses',
    price: 499,
    duration: 30, // days
    features: ['All Class 6 courses', 'Live doubt solving', 'Basic support']
  },
  {
    id: 2,
    name: 'Premium Monthly',
    description: 'All courses + advanced features',
    price: 999,
    duration: 30,
    features: ['All courses (6-12)', 'Priority doubt solving', '1-on-1 mentoring', 'Certificate']
  },
  {
    id: 3,
    name: 'Annual Premium',
    description: 'Best value annual plan',
    price: 9999,
    duration: 365,
    features: ['All courses (6-12)', 'Priority doubt solving', '1-on-1 mentoring', 'Certificate', 'Offline access']
  }
];

let userSubscriptions = [
  {
    id: 1,
    userId: 1, // student
    subscriptionId: 1,
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-10-01'),
    status: 'active',
    autoRenew: true
  }
];

let payments = [
  {
    id: 1,
    userId: 1,
    subscriptionId: 1,
    amount: 499,
    currency: 'INR',
    status: 'completed',
    paymentMethod: 'card',
    transactionId: 'TXN_123456',
    createdAt: new Date('2023-09-01')
  }
];

let coupons = [
  {
    id: 1,
    code: 'WELCOME10',
    description: '10% off first month',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 100,
    validFrom: new Date('2023-01-01'),
    validUntil: new Date('2023-12-31'),
    usageLimit: 1000,
    usedCount: 45,
    applicableTo: ['all']
  },
  {
    id: 2,
    code: 'STUDENT50',
    description: '₹50 off on any plan',
    discountType: 'fixed',
    discountValue: 50,
    maxDiscount: 50,
    validFrom: new Date('2023-01-01'),
    validUntil: new Date('2023-12-31'),
    usageLimit: 500,
    usedCount: 23,
    applicableTo: ['all']
  }
];

// Quiz question bank with difficulty levels
const QUIZ_QUESTIONS = {
  english: {
    easy: [
      {
        id: 1,
        text: "What is a noun?",
        options: ["A word that describes an action", "A word that names a person, place, thing, or idea", "A word that shows emotion", "A word that connects clauses"],
        correctAnswer: 1,
        topic: "Nouns",
        explanation: "A noun is a word that names a person, place, thing, or idea."
      },
      {
        id: 2,
        text: "Which of the following is an example of a proper noun?",
        options: ["book", "London", "dog", "happiness"],
        correctAnswer: 1,
        topic: "Nouns",
        explanation: "Proper nouns name specific people, places, or things and are capitalized."
      }
    ],
    medium: [
      {
        id: 3,
        text: "What is a verb?",
        options: ["A naming word", "An action word", "A describing word", "A connecting word"],
        correctAnswer: 1,
        topic: "Verbs",
        explanation: "A verb is a word that expresses an action, occurrence, or state of being."
      },
      {
        id: 4,
        text: "Identify the verb in this sentence: 'The cat sleeps peacefully.'",
        options: ["The", "cat", "sleeps", "peacefully"],
        correctAnswer: 2,
        topic: "Verbs",
        explanation: "Sleeps is the verb that shows the action the cat is performing."
      }
    ],
    hard: [
      {
        id: 5,
        text: "What is the correct passive voice form of: 'They are building a new school.'?",
        options: ["A new school is being built by them", "A new school are being built", "They build a new school", "A new school is built"],
        correctAnswer: 0,
        topic: "Grammar",
        explanation: "In passive voice, the object becomes the subject: 'A new school is being built by them.'"
      }
    ]
  },
  hindi: {
    easy: [
      {
        id: 6,
        text: "संज्ञा क्या है?",
        options: ["क्रिया का नाम", "व्यक्ति, स्थान, वस्तु या विचार का नाम", "भावना दिखाने वाला शब्द", "खंडों को जोड़ने वाला शब्द"],
        correctAnswer: 1,
        topic: "संज्ञा",
        explanation: "संज्ञा व्यक्ति, स्थान, वस्तु या विचार का नाम है।"
      }
    ],
    medium: [
      {
        id: 7,
        text: "क्रिया क्या है?",
        options: ["नाम देने वाला शब्द", "कार्य करने वाला शब्द", "वर्णन करने वाला शब्द", "जोड़ने वाला शब्द"],
        correctAnswer: 1,
        topic: "क्रिया",
        explanation: "क्रिया कार्य या घटना को व्यक्त करने वाला शब्द है।"
      }
    ],
    hard: [
      {
        id: 8,
        text: "निम्नलिखित में कौन सा शब्द 'कर्ता' है: 'राम ने किताब पढ़ी।'",
        options: ["राम", "ने", "किताब", "पढ़ी"],
        correctAnswer: 0,
        topic: "व्याकरण",
        explanation: "'राम' कर्ता है क्योंकि वह कार्य कर रहा है।"
      }
    ]
  }
};

// In-memory live classes store
let liveClasses = [
  {
    id: 1,
    title: 'Grammar Mastery Session',
    courseId: 1,
    instructor: 'Teacher John',
    scheduledTime: new Date(Date.now() + 3600000), // 1 hour from now
    duration: 60, // minutes
    description: 'Interactive session on advanced grammar concepts',
    meetingLink: 'https://meet.example.com/grammar-session',
    recording: null,
    status: 'upcoming' // upcoming, live, completed
  },
  {
    id: 2,
    title: 'Literature Analysis Workshop',
    courseId: 1,
    instructor: 'Teacher Jane',
    scheduledTime: new Date(Date.now() + 86400000), // 1 day from now
    duration: 90,
    description: 'Deep dive into literary analysis techniques',
    meetingLink: 'https://meet.example.com/literature-workshop',
    recording: null,
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'व्याकरण विशेष कक्षा',
    courseId: 2,
    instructor: 'Teacher Raj',
    scheduledTime: new Date(Date.now() + 172800000), // 2 days from now
    duration: 75,
    description: 'हिंदी व्याकरण की गहरी समझ',
    meetingLink: 'https://meet.example.com/hindi-grammar',
    recording: null,
    status: 'upcoming'
  }
];

// In-memory attendance store
let attendanceRecords = [];

// In-memory notes store
let notes = [
  {
    id: 1,
    courseId: 1,
    title: 'Sample English Notes',
    subject: 'English',
    class: 'Class 6',
    fileName: 'english_notes.pdf',
    filePath: 'uploads/english_notes.pdf',
    uploadDate: new Date('2023-10-01'),
    uploadedBy: 3 // admin
  }
];

// In-memory forum store
let forumPosts = [
  {
    id: 1,
    title: 'Help with Noun-Verb Agreement',
    content: 'I\'m having trouble understanding when to use "is" vs "are" in sentences. Can someone explain?',
    authorId: 1,
    authorName: 'Student User',
    tags: ['grammar', 'english', 'nouns', 'verbs'],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    votes: 5,
    comments: [
      {
        id: 1,
        content: 'Great question! "Is" is used with singular subjects and "are" with plural subjects.',
        authorId: 2,
        authorName: 'Teacher John',
        createdAt: new Date(Date.now() - 82800000), // 23 hours ago
        votes: 3
      },
      {
        id: 2,
        content: 'Also remember: "The book is on the table" (singular) vs "The books are on the table" (plural).',
        authorId: 2,
        authorName: 'Teacher John',
        createdAt: new Date(Date.now() - 79200000), // 22 hours ago
        votes: 2
      }
    ]
  },
  {
    id: 2,
    title: 'व्याकरण में संज्ञा और सर्वनाम',
    content: 'संज्ञा और सर्वनाम में क्या अंतर है? कृपया स्पष्ट करें।',
    authorId: 1,
    authorName: 'Student User',
    tags: ['grammar', 'hindi', 'nouns', 'pronouns'],
    createdAt: new Date(Date.now() - 43200000), // 12 hours ago
    votes: 3,
    comments: [
      {
        id: 3,
        content: 'संज्ञा व्यक्ति, स्थान या वस्तु का नाम है, जबकि सर्वनाम संज्ञा की जगह लेता है।',
        authorId: 2,
        authorName: 'Teacher Raj',
        createdAt: new Date(Date.now() - 39600000), // 11 hours ago
        votes: 1
      }
    ]
  }
];

// In-memory forum votes store
let forumVotes = [];

// Configure multer for file uploads (images and notes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Configure multer for notes uploads (PDF, DOC, PPT)
const notesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/notes/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const notesUpload = multer({
  storage: notesStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { email, password, role, name } = req.body;
  if (!email || !password || !role || !name) return res.status(400).json({ message: 'All fields required' });
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, email, password: hashedPassword, role, name });
  res.status(201).json({ message: 'User created' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  // Demo admin instant login
  if (email === 'kishan@gmail.com') {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  } else if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  } else {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, role: user.role });
  }
});

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Protected route example
app.get('/api/dashboard', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (req.user.role === 'student') {
    const data = studentData[req.user.id] || { enrolledCourses: [], streak: 0, badges: 0, doubts: 0 };
    res.json({
      message: `Welcome ${user.name}`,
      role: req.user.role,
      name: user.name,
      enrolledCourses: data.enrolledCourses,
      streak: data.streak,
      badges: data.badges,
      doubts: data.doubts
    });
  } else {
    res.json({ message: `Welcome ${user.name}`, role: req.user.role, name: user.name });
  }
});

// Get course details
app.get('/api/courses/:id', authenticate, (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = courses.find(c => c.id === courseId);
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

// Get modules for a course
app.get('/api/courses/:courseId/modules', authenticate, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const courseModules = modules.filter(m => m.courseId === courseId);
  res.json(courseModules);
});

// Get lessons for a module
app.get('/api/modules/:moduleId/lessons', authenticate, (req, res) => {
  const moduleId = parseInt(req.params.moduleId);
  const moduleLessons = lessons.filter(l => l.moduleId === moduleId);
  res.json(moduleLessons);
});

// Update lesson progress
app.post('/api/progress/lesson', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { lessonId, completed } = req.body;
  const lesson = lessons.find(l => l.id === lessonId);
  if (lesson) {
    lesson.completed = completed;
    // Update student data for resume learning
    const student = studentData[req.user.id];
    if (student) {
      const course = courses.find(c => c.modules.includes(lesson.moduleId));
      if (course) {
        const enrolledCourse = student.enrolledCourses.find(ec => ec.id === course.id);
        if (enrolledCourse) {
          enrolledCourse.lastModule = lesson.moduleId;
          enrolledCourse.lastLesson = lessonId;
        }
      }
    }
    res.json({ message: 'Lesson progress updated' });
  } else {
    res.status(404).json({ message: 'Lesson not found' });
  }
});

// Update progress endpoint
app.post('/api/progress', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { courseId, progress } = req.body;
  if (!studentData[req.user.id]) {
    studentData[req.user.id] = { enrolledCourses: [], streak: 0, badges: 0, doubts: 0, lastLogin: new Date() };
  }
  const course = studentData[req.user.id].enrolledCourses.find(c => c.id === courseId);
  if (course) {
    course.progress = progress;
    // Simple badge logic: earn a badge if progress reaches 100
    if (progress === 100 && !course.completed) {
      course.completed = true;
      studentData[req.user.id].badges += 1;
    }
  } else {
    // If course not found, add it (for demo purposes)
    studentData[req.user.id].enrolledCourses.push({ id: courseId, name: `Course ${courseId}`, progress });
  }
  res.json({ message: 'Progress updated' });
});

// Get doubt history for a student
app.get('/api/doubts', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const studentDoubts = doubts.filter(d => d.studentId === req.user.id);
  res.json(studentDoubts);
});

// Submit a new doubt
app.post('/api/doubts', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { question, type, image } = req.body;
  const newDoubt = {
    id: doubts.length + 1,
    studentId: req.user.id,
    question,
    type,
    image,
    aiResponse: null,
    status: 'pending',
    escalatedToTeacher: false,
    createdAt: new Date()
  };
  doubts.push(newDoubt);
  res.status(201).json(newDoubt);
});

// Upload image for doubt
app.post('/api/doubts/upload', authenticate, upload.single('image'), (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// Update doubt with AI response
app.put('/api/doubts/:id', authenticate, (req, res) => {
  const doubtId = parseInt(req.params.id);
  const doubt = doubts.find(d => d.id === doubtId);
  if (!doubt) {
    return res.status(404).json({ message: 'Doubt not found' });
  }
  if (doubt.studentId !== req.user.id && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { aiResponse, status, escalatedToTeacher } = req.body;
  if (aiResponse !== undefined) doubt.aiResponse = aiResponse;
  if (status !== undefined) doubt.status = status;
  if (escalatedToTeacher !== undefined) doubt.escalatedToTeacher = escalatedToTeacher;
  res.json(doubt);
});

// Escalate doubt to teacher
app.post('/api/doubts/:id/escalate', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const doubtId = parseInt(req.params.id);
  const doubt = doubts.find(d => d.id === doubtId && d.studentId === req.user.id);
  if (!doubt) {
    return res.status(404).json({ message: 'Doubt not found' });
  }
  doubt.escalatedToTeacher = true;
  doubt.status = 'escalated';
  res.json({ message: 'Doubt escalated to teacher' });
});

// Get escalated doubts for teachers
app.get('/api/doubts/escalated', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const escalatedDoubts = doubts.filter(d => d.escalatedToTeacher);
  res.json(escalatedDoubts);
});

// Get quiz results for a student
app.get('/api/quiz-results', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const studentResults = quizResults.filter(result => result.studentId === req.user.id);
  res.json(studentResults);
});

// Get live classes
app.get('/api/live-classes', authenticate, (req, res) => {
  const now = new Date();
  const upcomingClasses = liveClasses.filter(cls => cls.scheduledTime > now || cls.status === 'live');
  res.json(upcomingClasses);
});

// Join live class
app.post('/api/live-classes/:id/join', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const classId = parseInt(req.params.id);
  const liveClass = liveClasses.find(cls => cls.id === classId);
  if (!liveClass) {
    return res.status(404).json({ message: 'Live class not found' });
  }

  // Record attendance
  const attendance = {
    id: attendanceRecords.length + 1,
    studentId: req.user.id,
    classId: classId,
    joinedAt: new Date(),
    status: 'present'
  };
  attendanceRecords.push(attendance);

  res.json({
    message: 'Joined class successfully',
    meetingLink: liveClass.meetingLink,
    attendanceId: attendance.id
  });
});

// Mark attendance
app.post('/api/live-classes/:id/attendance', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const classId = parseInt(req.params.id);
  const { attendanceId } = req.body;

  const attendance = attendanceRecords.find(att => att.id === attendanceId && att.studentId === req.user.id);
  if (!attendance) {
    return res.status(404).json({ message: 'Attendance record not found' });
  }

  attendance.leftAt = new Date();
  res.json({ message: 'Attendance marked successfully' });
});

// Get attendance history for a student
app.get('/api/attendance', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const studentAttendance = attendanceRecords.filter(att => att.studentId === req.user.id);
  res.json(studentAttendance);
});

// Forum endpoints

// Get all forum posts (with teacher verification - only approved posts for students)
app.get('/api/forum/posts', authenticate, (req, res) => {
  let posts = forumPosts;
  if (req.user.role === 'student') {
    posts = posts.filter(post => post.status === 'approved');
  }
  res.json(posts);
});

// Create a new forum post
app.post('/api/forum/posts', authenticate, (req, res) => {
  const { title, content, tags } = req.body;
  const newPost = {
    id: forumPosts.length + 1,
    title,
    content,
    authorId: req.user.id,
    authorName: req.user.role === 'student' ? 'Student User' : 'Teacher User', // Simplified
    tags,
    createdAt: new Date(),
    votes: 0,
    status: req.user.role === 'teacher' ? 'approved' : 'pending', // Teacher posts auto-approved
    comments: []
  };
  forumPosts.push(newPost);
  res.status(201).json(newPost);
});

// Add comment to a post
app.post('/api/forum/posts/:id/comments', authenticate, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = forumPosts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const { content } = req.body;
  const newComment = {
    id: post.comments.length + 1,
    content,
    authorId: req.user.id,
    authorName: req.user.role === 'student' ? 'Student User' : 'Teacher User',
    createdAt: new Date(),
    votes: 0
  };
  post.comments.push(newComment);
  res.status(201).json(newComment);
});

// Vote on a post
app.post('/api/forum/posts/:id/vote', authenticate, (req, res) => {
  const postId = parseInt(req.params.id);
  const post = forumPosts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const { voteType } = req.body;
  // Simple voting logic (no duplicate votes handling for demo)
  if (voteType === 'up') post.votes += 1;
  else if (voteType === 'down') post.votes -= 1;
  res.json({ votes: post.votes });
});

// Vote on a comment
app.post('/api/forum/posts/comment/:commentId/vote', authenticate, (req, res) => {
  const commentId = parseInt(req.params.commentId);
  let comment = null;
  for (const post of forumPosts) {
    comment = post.comments.find(c => c.id === commentId);
    if (comment) break;
  }
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  const { voteType } = req.body;
  if (voteType === 'up') comment.votes += 1;
  else if (voteType === 'down') comment.votes -= 1;
  res.json({ votes: comment.votes });
});

// Teacher verification endpoints
app.get('/api/forum/pending-posts', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Access denied' });
  const pendingPosts = forumPosts.filter(p => p.status === 'pending');
  res.json(pendingPosts);
});

app.post('/api/forum/posts/:id/verify', authenticate, (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Access denied' });
  const postId = parseInt(req.params.id);
  const post = forumPosts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const { action } = req.body; // 'approve' or 'reject'
  post.status = action === 'approve' ? 'approved' : 'rejected';
  res.json(post);
});

// Gamification endpoints

// Get student gamification data
app.get('/api/gamification', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const student = studentData[req.user.id] || {
    xp: 0,
    level: 1,
    earnedBadges: [],
    achievements: []
  };

  // Calculate current level
  let currentLevel = 1;
  for (const level of LEVELS) {
    if (student.xp >= level.xpRequired) {
      currentLevel = level.level;
    } else {
      break;
    }
  }

  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  const xpForNextLevel = nextLevel ? nextLevel.xpRequired - student.xp : 0;

  res.json({
    xp: student.xp,
    level: currentLevel,
    levelName: LEVELS.find(l => l.level === currentLevel)?.name || 'Beginner',
    xpForNextLevel,
    earnedBadges: student.earnedBadges,
    achievements: student.achievements
  });
});

// Award XP for activities
app.post('/api/gamification/xp', authenticate, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { activity, amount } = req.body;

  if (!studentData[req.user.id]) {
    studentData[req.user.id] = {
      enrolledCourses: [],
      streak: 0,
      badges: 0,
      doubts: 0,
      lastLogin: new Date(),
      xp: 0,
      level: 1,
      earnedBadges: [],
      achievements: []
    };
  }

  const student = studentData[req.user.id];
  student.xp += amount;

  // Check for level up
  let newLevel = 1;
  for (const level of LEVELS) {
    if (student.xp >= level.xpRequired) {
      newLevel = level.level;
    } else {
      break;
    }
  }

  const leveledUp = newLevel > student.level;
  student.level = newLevel;

  // Check for badges
  const earnedBadges = checkBadgeConditions(student, activity);

  res.json({
    xp: student.xp,
    level: student.level,
    leveledUp,
    earnedBadges
  });
});

// Check and award badges
function checkBadgeConditions(student, activity) {
  const newBadges = [];

  // First lesson badge
  if (activity === 'lesson_complete' && !student.earnedBadges.includes('first_lesson')) {
    student.earnedBadges.push('first_lesson');
    student.achievements.push({
      id: 'first_lesson',
      name: BADGES.first_lesson.name,
      description: BADGES.first_lesson.description,
      icon: BADGES.first_lesson.icon,
      earnedAt: new Date()
    });
    student.xp += BADGES.first_lesson.xpReward;
    newBadges.push('first_lesson');
  }

  // Quiz master badge
  if (activity === 'quiz_perfect' && !student.earnedBadges.includes('quiz_master')) {
    student.earnedBadges.push('quiz_master');
    student.achievements.push({
      id: 'quiz_master',
      name: BADGES.quiz_master.name,
      description: BADGES.quiz_master.description,
      icon: BADGES.quiz_master.icon,
      earnedAt: new Date()
    });
    student.xp += BADGES.quiz_master.xpReward;
    newBadges.push('quiz_master');
  }

  // Streak badges
  if (student.streak >= 5 && !student.earnedBadges.includes('streak_5')) {
    student.earnedBadges.push('streak_5');
    student.achievements.push({
      id: 'streak_5',
      name: BADGES.streak_5.name,
      description: BADGES.streak_5.description,
      icon: BADGES.streak_5.icon,
      earnedAt: new Date()
    });
    student.xp += BADGES.streak_5.xpReward;
    newBadges.push('streak_5');
  }

  if (student.streak >= 10 && !student.earnedBadges.includes('streak_10')) {
    student.earnedBadges.push('streak_10');
    student.achievements.push({
      id: 'streak_10',
      name: BADGES.streak_10.name,
      description: BADGES.streak_10.description,
      icon: BADGES.streak_10.icon,
      earnedAt: new Date()
    });
    student.xp += BADGES.streak_10.xpReward;
    newBadges.push('streak_10');
  }

  // Doubt solver badge
  if (student.doubts >= 10 && !student.earnedBadges.includes('doubt_solver')) {
    student.earnedBadges.push('doubt_solver');
    student.achievements.push({
      id: 'doubt_solver',
      name: BADGES.doubt_solver.name,
      description: BADGES.doubt_solver.description,
      icon: BADGES.doubt_solver.icon,
      earnedAt: new Date()
    });
    student.xp += BADGES.doubt_solver.xpReward;
    newBadges.push('doubt_solver');
  }

  return newBadges;
}

// Get leaderboard
app.get('/api/leaderboard', authenticate, (req, res) => {
  const leaderboard = Object.values(studentData)
    .map(student => ({
      id: Object.keys(studentData).find(key => studentData[key] === student),
      xp: student.xp || 0,
      level: student.level || 1,
      name: 'Student ' + Object.keys(studentData).find(key => studentData[key] === student)
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  res.json(leaderboard);
});

// Get available badges
app.get('/api/badges', authenticate, (req, res) => {
  res.json(BADGES);
});

// Get level information
app.get('/api/levels', authenticate, (req, res) => {
  res.json(LEVELS);
});

// Parent Dashboard endpoints

// Get parent dashboard data
app.get('/api/parent/dashboard', authenticate, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Get students linked to this parent
  const parentRelationships = parentStudentRelationships.filter(rel => rel.parentId === req.user.id);
  const studentIds = parentRelationships.map(rel => rel.studentId);

  const students = studentIds.map(studentId => {
    const student = users.find(u => u.id === studentId);
    const studentInfo = studentData[studentId] || { enrolledCourses: [], streak: 0, badges: 0, doubts: 0 };
    const quizResultsForStudent = quizResults.filter(result => result.studentId === studentId);
    const attendanceForStudent = attendanceRecords.filter(att => att.studentId === studentId);

    return {
      id: student.id,
      name: student.email.split('@')[0], // Simplified name
      enrolledCourses: studentInfo.enrolledCourses,
      streak: studentInfo.streak,
      badges: studentInfo.badges,
      doubts: studentInfo.doubts,
      xp: studentInfo.xp || 0,
      level: studentInfo.level || 1,
      quizResults: quizResultsForStudent,
      attendance: attendanceForStudent
    };
  });

  res.json({
    message: 'Parent dashboard data',
    students: students
  });
});

// Link parent to student
app.post('/api/parent/link-student', authenticate, (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { studentEmail } = req.body;
  const student = users.find(u => u.email === studentEmail && u.role === 'student');

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Check if relationship already exists
  const existingRelationship = parentStudentRelationships.find(
    rel => rel.parentId === req.user.id && rel.studentId === student.id
  );

  if (existingRelationship) {
    return res.status(400).json({ message: 'Student already linked' });
  }

  const newRelationship = {
    id: parentStudentRelationships.length + 1,
    parentId: req.user.id,
    studentId: student.id,
    relationship: 'parent',
    createdAt: new Date()
  };

  parentStudentRelationships.push(newRelationship);
  res.status(201).json({ message: 'Student linked successfully' });
});

// Payment and Subscription endpoints

// Get available subscriptions
app.get('/api/subscriptions', authenticate, (req, res) => {
  res.json(subscriptions);
});

// Get user subscriptions
app.get('/api/user/subscriptions', authenticate, (req, res) => {
  const userSubscriptionsFiltered = userSubscriptions.filter(sub => sub.userId === req.user.id);
  const subscriptionsWithDetails = userSubscriptionsFiltered.map(userSub => {
    const subscription = subscriptions.find(s => s.id === userSub.subscriptionId);
    return {
      ...userSub,
      subscription: subscription
    };
  });
  res.json(subscriptionsWithDetails);
});

// Purchase subscription
app.post('/api/subscriptions/purchase', authenticate, (req, res) => {
  const { subscriptionId, couponCode } = req.body;

  const subscription = subscriptions.find(s => s.id === subscriptionId);
  if (!subscription) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  let finalPrice = subscription.price;

  // Apply coupon if provided
  if (couponCode) {
    const coupon = coupons.find(c => c.code === couponCode && c.usedCount < c.usageLimit);
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        finalPrice = finalPrice - (finalPrice * coupon.discountValue / 100);
        finalPrice = Math.min(finalPrice, coupon.maxDiscount);
      } else if (coupon.discountType === 'fixed') {
        finalPrice = Math.max(0, finalPrice - coupon.discountValue);
      }
      coupon.usedCount += 1;
    }
  }

  // Create payment record
  const payment = {
    id: payments.length + 1,
    userId: req.user.id,
    subscriptionId: subscriptionId,
    amount: finalPrice,
    currency: 'INR',
    status: 'completed', // Simplified - in real app, this would be 'pending' until payment gateway confirms
    paymentMethod: 'card',
    transactionId: `TXN_${Date.now()}`,
    createdAt: new Date()
  };
  payments.push(payment);

  // Create user subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + subscription.duration);

  const userSubscription = {
    id: userSubscriptions.length + 1,
    userId: req.user.id,
    subscriptionId: subscriptionId,
    startDate: new Date(),
    endDate: endDate,
    status: 'active',
    autoRenew: true
  };
  userSubscriptions.push(userSubscription);

  res.status(201).json({
    message: 'Subscription purchased successfully',
    payment: payment,
    subscription: userSubscription
  });
});

// Get payment history
app.get('/api/payments', authenticate, (req, res) => {
  const userPayments = payments.filter(p => p.userId === req.user.id);
  const paymentsWithDetails = userPayments.map(payment => {
    const subscription = subscriptions.find(s => s.id === payment.subscriptionId);
    return {
      ...payment,
      subscription: subscription
    };
  });
  res.json(paymentsWithDetails);
});

// Get available coupons
app.get('/api/coupons', authenticate, (req, res) => {
  const validCoupons = coupons.filter(coupon =>
    coupon.usedCount < coupon.usageLimit &&
    new Date() >= coupon.validFrom &&
    new Date() <= coupon.validUntil
  );
  res.json(validCoupons);
});

// Validate coupon
app.post('/api/coupons/validate', authenticate, (req, res) => {
  const { code, subscriptionId } = req.body;

  const coupon = coupons.find(c => c.code === code);
  if (!coupon) {
    return res.status(404).json({ message: 'Coupon not found' });
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: 'Coupon usage limit exceeded' });
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return res.status(400).json({ message: 'Coupon expired or not yet valid' });
  }

  const subscription = subscriptions.find(s => s.id === subscriptionId);
  if (!subscription) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = subscription.price * coupon.discountValue / 100;
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, subscription.price);
  }

  res.json({
    valid: true,
    discountAmount: discountAmount,
    finalPrice: subscription.price - discountAmount
  });
});

// Cancel subscription
app.post('/api/subscriptions/:id/cancel', authenticate, (req, res) => {
  const subscriptionId = parseInt(req.params.id);
  const userSubscription = userSubscriptions.find(
    sub => sub.id === subscriptionId && sub.userId === req.user.id
  );

  if (!userSubscription) {
    return res.status(404).json({ message: 'Subscription not found' });
  }

  userSubscription.status = 'cancelled';
  userSubscription.autoRenew = false;

  res.json({ message: 'Subscription cancelled successfully' });
});

// Notes endpoints

// Get notes for a course (for students)
app.get('/api/courses/:courseId/notes', authenticate, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const courseNotes = notes.filter(n => n.courseId === courseId);
  res.json(courseNotes);
});

// Upload notes (admin only)
app.post('/api/notes/upload', authenticate, notesUpload.single('file'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { title, subject, class: className, courseId } = req.body;

  if (!title || !subject || !className || !courseId) {
    return res.status(400).json({ message: 'All fields required: title, subject, class, courseId' });
  }

  const newNote = {
    id: notes.length + 1,
    courseId: parseInt(courseId),
    title,
    subject,
    class: className,
    fileName: req.file.originalname,
    filePath: req.file.path,
    uploadDate: new Date(),
    uploadedBy: req.user.id
  };

  notes.push(newNote);
  res.status(201).json({ message: 'Note uploaded successfully', note: newNote });
});

// Get all notes (admin only)
app.get('/api/notes', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  res.json(notes);
});

// Update note (admin only)
app.put('/api/notes/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const noteId = parseInt(req.params.id);
  const note = notes.find(n => n.id === noteId);

  if (!note) {
    return res.status(404).json({ message: 'Note not found' });
  }

  const { title, subject, class: className } = req.body;

  if (title) note.title = title;
  if (subject) note.subject = subject;
  if (className) note.class = className;

  res.json({ message: 'Note updated successfully', note });
});

// Delete note (admin only)
app.delete('/api/notes/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const noteId = parseInt(req.params.id);
  const noteIndex = notes.findIndex(n => n.id === noteId);

  if (noteIndex === -1) {
    return res.status(404).json({ message: 'Note not found' });
  }

  // Remove file from filesystem (optional, for demo we skip)
  // const fs = require('fs');
  // fs.unlinkSync(notes[noteIndex].filePath);

  notes.splice(noteIndex, 1);
  res.json({ message: 'Note deleted successfully' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
