import { MongoMemoryServer } from 'mongodb-memory-server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpassword123';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.PORT = '5001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

await import('./src/server.js');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const request = async (path, method = 'GET', body = undefined, token = undefined) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`http://localhost:${process.env.PORT}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data };
};

await wait(1500);

const { User } = await import('./src/models/User.js');
const bcrypt = (await import('bcryptjs')).default;

const existingAdmin = await User.findOne({ username: ADMIN_USERNAME }).lean();
if (!existingAdmin) {
  await User.create({
    username: ADMIN_USERNAME,
    password: await bcrypt.hash(ADMIN_PASSWORD, 10),
    userType: 'Admin',
    firstName: 'Admin',
    lastName: 'System',
    isActive: true,
  });
  console.log('Seeded bootstrap admin user');
}

const login = await request('/api/v1/auth/login', 'POST', {
  username: ADMIN_USERNAME,
  password: ADMIN_PASSWORD,
});

const token = login.data?.data?.token;
if (!token) {
  throw new Error('Admin login failed');
}

const categoryPayloads = [
  {
    name: 'Playsuit',
    description: 'Evaluates physique, poise, and presentation in swimwear.',
    weight: 10,
    isActive: true,
    rubrics: [
      { name: 'Fitness & Form', maxPoints: 40 },
      { name: 'Stage Presence', maxPoints: 40 },
      { name: 'Poise & Bearing', maxPoints: 20 },
    ],
  },
  {
    name: 'Evening Gown / Formal Wear',
    description: 'Evaluates gracefulness, carriage, and regal demeanor.',
    weight: 10,
    isActive: true,
    rubrics: [
      { name: 'Elegance & Carriage', maxPoints: 40 },
      { name: 'Suitability & Fit', maxPoints: 30 },
      { name: 'Stage Presence', maxPoints: 30 },
    ],
  },
  {
    name: 'System Uni',
    description: 'Evaluates proper dress code adherence and deportment.',
    weight: 5,
    isActive: true,
    rubrics: [
      { name: 'Adherence & Neatness', maxPoints: 50 },
      { name: 'Bearing & Deportment', maxPoints: 50 },
    ],
  },
  {
    name: 'Production Number',
    description: 'Evaluates dance execution, vitality, and introduction clarity.',
    weight: 10,
    isActive: true,
    rubrics: [
      { name: 'Choreography Mastery', maxPoints: 40 },
      { name: 'Energy & Showmanship', maxPoints: 40 },
      { name: 'Individual Introduction', maxPoints: 20 },
    ],
  },
  {
    name: 'Impersonation',
    description: 'Evaluates accuracy, showmanship, choreography, and overall impact in musical impersonation performance.',
    weight: 100,
    isActive: true,
    rubrics: [
      { name: 'Accuracy of Impersonation', maxPoints: 35 },
      { name: 'Stage Performance and Showmanship', maxPoints: 25 },
      { name: 'Coordination and Choreography', maxPoints: 30 },
      { name: 'Overall Impact', maxPoints: 10 },
    ],
  },
  {
    name: 'Advocacy',
    description: 'Evaluates community relevance, knowledge, and presentation passion.',
    weight: 15,
    isActive: true,
    rubrics: [
      { name: 'Relevance & Impact', maxPoints: 40 },
      { name: 'Substance & Knowledge', maxPoints: 30 },
      { name: 'Passion & Authenticity', maxPoints: 30 },
    ],
  },
  {
    name: 'Q&A - Closed Door',
    description: 'Evaluates depth of thought, logic, composure under panel.',
    weight: 20,
    isActive: true,
    rubrics: [
      { name: 'Substance & Depth', maxPoints: 40 },
      { name: 'Articulation', maxPoints: 40 },
      { name: 'Composure', maxPoints: 20 },
    ],
  },
  {
    name: 'Q&A - Final',
    description: 'Evaluates concise answers, delivery, and grace under pressure.',
    weight: 30,
    isActive: true,
    rubrics: [
      { name: 'Content & Relevance', maxPoints: 40 },
      { name: 'Delivery & Articulation', maxPoints: 30 },
      { name: 'Grace Under Pressure', maxPoints: 30 },
    ],
  },
];

const categoriesResponse = await request('/api/v1/categories', 'GET', undefined, token);
const categoriesList = categoriesResponse.data?.data ?? [];
const createdCategories = [];

for (const payload of categoryPayloads) {
  const existing = categoriesList.find((cat) => cat.name === payload.name);
  if (existing) {
    createdCategories.push(existing);
    continue;
  }

  const res = await request('/api/v1/categories', 'POST', payload, token);
  createdCategories.push(res.data.data);
}

const categoryMap = new Map(createdCategories.map((cat) => [cat.name, cat._id]));

const groupPayloads = [
  {
    name: 'Male',
    categoriesIncluded: [
      categoryMap.get('Playsuit'),
      categoryMap.get('Evening Gown / Formal Wear'),
      categoryMap.get('System Uni'),
      categoryMap.get('Production Number'),
      categoryMap.get('Advocacy'),
      categoryMap.get('Q&A - Closed Door'),
      categoryMap.get('Q&A - Final'),
    ],
  },
  {
    name: 'Female',
    categoriesIncluded: [
      categoryMap.get('Playsuit'),
      categoryMap.get('Evening Gown / Formal Wear'),
      categoryMap.get('System Uni'),
      categoryMap.get('Production Number'),
      categoryMap.get('Advocacy'),
      categoryMap.get('Q&A - Closed Door'),
      categoryMap.get('Q&A - Final'),
    ],
  },
  {
    name: 'Impersonation',
    categoriesIncluded: [categoryMap.get('Impersonation')],
  },
];

const groupsResponse = await request('/api/v1/contestant-groups', 'GET', undefined, token);
const groupsList = groupsResponse.data?.data ?? [];
const createdGroups = [];

for (const payload of groupPayloads) {
  const existing = groupsList.find((group) => group.name === payload.name);
  if (existing) {
    createdGroups.push(existing);
    continue;
  }

  const res = await request('/api/v1/contestant-groups', 'POST', payload, token);
  createdGroups.push(res.data.data);
}

const groupMap = new Map(createdGroups.map((group) => [group.name, group._id]));

const contestantPayloads = [
  { name: 'Jopeta Mari', label: '1st Year (1)', image: 'https://cdn.example.com/photos/male1.jpg', group: groupMap.get('Male') },
  { name: 'Juan Dela Cruz', label: '2nd Year (2)', image: 'https://cdn.example.com/photos/male2.jpg', group: groupMap.get('Male') },
  { name: 'Mark Anthony', label: '3rd Year (3)', image: 'https://cdn.example.com/photos/male3.jpg', group: groupMap.get('Male') },
  { name: 'Christian Paul', label: '4th Year (4)', image: 'https://cdn.example.com/photos/male4.jpg', group: groupMap.get('Male') },
  { name: 'Maria Santos', label: '1st Year (1)', image: 'https://cdn.example.com/photos/female1.jpg', group: groupMap.get('Female') },
  { name: 'Angela Nicole', label: '2nd Year (2)', image: 'https://cdn.example.com/photos/female2.jpg', group: groupMap.get('Female') },
  { name: 'Bea Alonzo', label: '3rd Year (3)', image: 'https://cdn.example.com/photos/female3.jpg', group: groupMap.get('Female') },
  { name: 'Christine Joy', label: '4th Year (4)', image: 'https://cdn.example.com/photos/female4.jpg', group: groupMap.get('Female') },
  { name: 'Ariana Grande', label: 'Impersonation (1)', image: 'https://cdn.example.com/photos/impersonation1.jpg', group: groupMap.get('Impersonation') },
  { name: 'Dua Lipa', label: 'Impersonation (2)', image: 'https://cdn.example.com/photos/impersonation2.jpg', group: groupMap.get('Impersonation') },
];

const contestantsResponse = await request('/api/v1/contestants', 'GET', undefined, token);
const contestantsList = contestantsResponse.data?.data ?? [];

for (const payload of contestantPayloads) {
  const existing = contestantsList.find((contestant) => contestant.name === payload.name && ((contestant.group?._id === payload.group) || (contestant.group === payload.group)));
  if (existing) continue;

  await request('/api/v1/contestants', 'POST', payload, token);
}

const userPayloads = [
  { username: 'admin', password: ADMIN_PASSWORD, userType: 'Admin', firstName: 'Admin', lastName: 'System' },
  { username: 'judge_donde', password: 'password123', userType: 'Judge', firstName: 'Nay', lastName: 'Donde' },
  { username: 'judge_lester', password: 'password123', userType: 'Judge', firstName: 'Sir', lastName: 'Lester' },
  { username: 'judge_daynver', password: 'password123', userType: 'Judge', firstName: 'Sir', lastName: 'Daynver' },
  { username: 'judge_jhunie', password: 'password123', userType: 'Judge', firstName: 'Sir Jhunie', lastName: 'Jumawan' },
  { username: 'judge_noreen', password: 'password123', userType: 'Judge', firstName: "Ma'am Noreen", lastName: 'Lagahit' },
];

const usersResponse = await request('/api/users', 'GET', undefined, token);
const usersList = usersResponse.data?.data?.items ?? usersResponse.data?.data ?? [];

for (const payload of userPayloads) {
  const existing = usersList.find((user) => user.username === payload.username);
  if (existing) continue;

  await request('/api/users', 'POST', payload, token);
}

console.log('Seed completed successfully');
await mongo.stop();
process.exit(0);
