export const mockUsers = [
  {
    _id: '64f8a123b0a9c12345678901',
    username: 'admin',
    password: 'adminpassword123',
    userType: 'Admin',
    firstName: 'Admin',
    lastName: 'System',
    isActive: true,
  },
  {
    _id: '64f8a123b0a9c12345678902',
    username: 'judge_donde',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Nay',
    lastName: 'Donde',
    isActive: true,
  },
];

export const mockJudges = [
  {
    _id: '65f8a123b0a9c12345678901',
    username: 'judge001',
    password: 'password123',
    firstName: 'Mario',
    lastName: 'Kart',
    userType: 'Judge',
    isActive: true,
  },
  {
    _id: '65f8a123b0a9c12345678902',
    username: 'judge002',
    password: 'password123',
    firstName: 'Mia',
    lastName: 'Luna',
    userType: 'Judge',
    isActive: true,
  },
];

export const mockCategories = [
  {
    _id: '65f8a123b0a9c12345678910',
    name: 'Playsuit',
    description: 'Evaluates physique, poise, and presentation in swimwear.',
    weight: 10,
    isActive: true,
    rubrics: [
      { _id: '65f8a123b0a9c12345678911', name: 'Fitness & Form', maxPoints: 40 },
      { _id: '65f8a123b0a9c12345678912', name: 'Stage Presence', maxPoints: 40 },
      { _id: '65f8a123b0a9c12345678913', name: 'Poise & Bearing', maxPoints: 20 },
    ],
  },
  {
    _id: '65f8a123b0a9c12345678920',
    name: 'Production Number',
    description: 'Measures energy, choreography, and overall performance quality.',
    weight: 15,
    isActive: true,
    rubrics: [
      { _id: '65f8a123b0a9c12345678921', name: 'Choreography', maxPoints: 35 },
      { _id: '65f8a123b0a9c12345678922', name: 'Confidence', maxPoints: 35 },
      { _id: '65f8a123b0a9c12345678923', name: 'Stage Impact', maxPoints: 30 },
    ],
  },
];

export const mockContestantGroups = [
  {
    _id: '65f8a123b0a9c12345678930',
    name: 'Pageant Male',
    categoriesIncluded: ['65f8a123b0a9c12345678910'],
  },
  {
    _id: '65f8a123b0a9c12345678931',
    name: 'Pageant Female',
    categoriesIncluded: ['65f8a123b0a9c12345678920'],
  },
];

export const mockContestants = [
  {
    _id: '65f8a123b0a9c12345678920',
    name: 'Jopeta Mari',
    label: '1st Year (1)',
    image: 'https://cdn.example.com/photos/contestant1.jpg',
    group: '65f8a123b0a9c12345678930',
  },
  {
    _id: '65f8a123b0a9c12345678921',
    name: 'Rae Ann Sol',
    label: '2nd Year (2)',
    image: 'https://cdn.example.com/photos/contestant2.jpg',
    group: '65f8a123b0a9c12345678930',
  },
];

export const mockJudgeScores = [
  {
    _id: '65f8a123b0a9c12345678990',
    judgeId: '65f8a123b0a9c12345678901',
    categoryId: '65f8a123b0a9c12345678910',
    contestantId: '65f8a123b0a9c12345678920',
    rubricsScore: [
      { rubricsId: '65f8a123b0a9c12345678911', score: 38 },
      { rubricsId: '65f8a123b0a9c12345678912', score: 35 },
      { rubricsId: '65f8a123b0a9c12345678913', score: 18 },
    ],
  },
  {
    _id: '65f8a123b0a9c12345678991',
    judgeId: '65f8a123b0a9c12345678902',
    categoryId: '65f8a123b0a9c12345678910',
    contestantId: '65f8a123b0a9c12345678920',
    rubricsScore: [
      { rubricsId: '65f8a123b0a9c12345678911', score: 36 },
      { rubricsId: '65f8a123b0a9c12345678912', score: 34 },
      { rubricsId: '65f8a123b0a9c12345678913', score: 17 },
    ],
  },
];

export const mockConfiguration = {
  _id: '65f8a123b0a9c12345678900',
  eventTitle: '2026 Mr & Ms CCS',
  eventDescription: 'The MR and MS CCS of Acquaintance Party',
  isConfigurationMode: true,
  stats: {
    totalJudges: 5,
    totalContestants: 8,
  },
  liveStatus: {
    categoryActive: { _id: '65f8a123b0a9c12345678910', name: 'Playsuit' },
    contestantActive: {
      _id: '65f8a123b0a9c12345678920',
      name: 'Jopeta Mari',
      image: 'https://cdn.example.com/photos/contestant1.jpg',
      label: '1st Year (1)',
      group: 'Pageant Male',
    },
  },
};
